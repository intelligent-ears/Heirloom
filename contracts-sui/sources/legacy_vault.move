/// DeFi Legacy - On-Chain Will & Inheritance Protocol
/// Core LegacyVault module implementing heartbeat-based inheritance
module defi_legacy::legacy_vault {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ====== Constants ======
    
    /// Vault status constants
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_WARNING: u8 = 1;
    const STATUS_SETTLED: u8 = 2;
    
    /// Time constants (in milliseconds)
    const MS_PER_DAY: u64 = 86_400_000;
    const WARNING_PERIOD_DAYS: u64 = 30;
    
    // ====== Errors ======
    
    const ENotGrantor: u64 = 0;
    const ENotHeir: u64 = 1;
    const EVaultSettled: u64 = 2;
    const EGracePeriodNotExpired: u64 = 3;
    const EWarningPeriodNotExpired: u64 = 4;
    const EMaturityNotReached: u64 = 5;
    const ENotGuardian: u64 = 6;
    const EInsufficientGuardians: u64 = 7;
    const EAlreadyVoted: u64 = 8;
    const EInvalidThreshold: u64 = 9;

    // ====== Structs ======
    
    /// Main vault object that holds inheritance configuration and assets
    public struct LegacyVault has key, store {
        id: UID,
        /// Address of the vault creator (grantor)
        grantor: address,
        /// ENS name of the heir (stored as string for cross-chain compatibility)
        heir_ens: String,
        /// Resolved heir address (can be updated)
        heir_address: address,
        /// Timestamp of last heartbeat (ms since epoch)
        last_heartbeat: u64,
        /// Grace period in days before settlement can begin
        grace_period_days: u64,
        /// Timestamp when heir can claim (0 = no restriction)
        maturity_timestamp: u64,
        /// Current vault status
        status: u8,
        /// List of guardian addresses
        guardians: vector<address>,
        /// Number of guardians required for recovery actions
        guardian_threshold: u8,
        /// SUI balance held in vault
        balance: Balance<SUI>,
        /// IPFS/Walrus CID for encrypted will
        encrypted_will_cid: String,
        /// Settlement initiated timestamp (0 if not in settlement)
        settlement_initiated: u64,
    }

    /// Capability for administrative actions
    public struct VaultAdminCap has key, store {
        id: UID,
        vault_id: address,
    }

    /// Guardian vote for recovery actions
    public struct GuardianVote has key, store {
        id: UID,
        vault_id: address,
        action_type: u8, // 0 = reset heartbeat, 1 = change heir
        voters: vector<address>,
        new_heir_address: address, // Only used for change heir action
        created_at: u64,
    }

    // ====== Events ======
    
    public struct VaultCreated has copy, drop {
        vault_id: address,
        grantor: address,
        heir_ens: String,
        grace_period_days: u64,
    }
    
    public struct HeartbeatSent has copy, drop {
        vault_id: address,
        timestamp: u64,
        next_deadline: u64,
    }
    
    public struct SettlementWarning has copy, drop {
        vault_id: address,
        warning_started: u64,
        final_settlement: u64,
    }
    
    public struct VaultSettled has copy, drop {
        vault_id: address,
        heir_address: address,
        amount: u64,
        timestamp: u64,
    }
    
    public struct GuardianActionRequested has copy, drop {
        vault_id: address,
        action_type: u8,
        initiator: address,
    }

    // ====== Entry Functions ======
    
    /// Create a new legacy vault
    public entry fun create_vault(
        heir_ens: vector<u8>,
        heir_address: address,
        grace_period_days: u64,
        maturity_timestamp: u64,
        guardians: vector<address>,
        guardian_threshold: u8,
        encrypted_will_cid: vector<u8>,
        deposit: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let guardian_count = vector::length(&guardians);
        assert!(
            guardian_threshold <= (guardian_count as u8) || guardian_count == 0,
            EInvalidThreshold
        );
        
        let current_time = clock::timestamp_ms(clock);
        let vault_uid = object::new(ctx);
        let vault_id = object::uid_to_address(&vault_uid);
        
        let vault = LegacyVault {
            id: vault_uid,
            grantor: tx_context::sender(ctx),
            heir_ens: string::utf8(heir_ens),
            heir_address,
            last_heartbeat: current_time,
            grace_period_days,
            maturity_timestamp,
            status: STATUS_ACTIVE,
            guardians,
            guardian_threshold,
            balance: coin::into_balance(deposit),
            encrypted_will_cid: string::utf8(encrypted_will_cid),
            settlement_initiated: 0,
        };
        
        // Create admin capability for grantor
        let admin_cap = VaultAdminCap {
            id: object::new(ctx),
            vault_id,
        };
        
        event::emit(VaultCreated {
            vault_id,
            grantor: tx_context::sender(ctx),
            heir_ens: vault.heir_ens,
            grace_period_days,
        });
        
        transfer::share_object(vault);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Send a heartbeat to reset the inactivity timer
    public entry fun send_heartbeat(
        vault: &mut LegacyVault,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.grantor, ENotGrantor);
        assert!(vault.status != STATUS_SETTLED, EVaultSettled);
        
        let current_time = clock::timestamp_ms(clock);
        vault.last_heartbeat = current_time;
        vault.status = STATUS_ACTIVE;
        vault.settlement_initiated = 0;
        
        let next_deadline = current_time + (vault.grace_period_days * MS_PER_DAY);
        
        event::emit(HeartbeatSent {
            vault_id: object::uid_to_address(&vault.id),
            timestamp: current_time,
            next_deadline,
        });
    }

    /// Check if settlement should be triggered (can be called by anyone)
    public entry fun check_settlement(
        vault: &mut LegacyVault,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // Already settled
        if (vault.status == STATUS_SETTLED) {
            return
        };
        
        let current_time = clock::timestamp_ms(clock);
        let grace_period_ms = vault.grace_period_days * MS_PER_DAY;
        let grace_deadline = vault.last_heartbeat + grace_period_ms;
        
        // Check if grace period has expired
        if (current_time >= grace_deadline) {
            if (vault.status == STATUS_ACTIVE) {
                // Transition to warning
                vault.status = STATUS_WARNING;
                vault.settlement_initiated = current_time;
                
                let final_settlement = current_time + (WARNING_PERIOD_DAYS * MS_PER_DAY);
                
                event::emit(SettlementWarning {
                    vault_id: object::uid_to_address(&vault.id),
                    warning_started: current_time,
                    final_settlement,
                });
            } else if (vault.status == STATUS_WARNING) {
                // Check if warning period has also expired
                let warning_deadline = vault.settlement_initiated + (WARNING_PERIOD_DAYS * MS_PER_DAY);
                
                if (current_time >= warning_deadline) {
                    vault.status = STATUS_SETTLED;
                    
                    event::emit(VaultSettled {
                        vault_id: object::uid_to_address(&vault.id),
                        heir_address: vault.heir_address,
                        amount: balance::value(&vault.balance),
                        timestamp: current_time,
                    });
                }
            }
        }
    }

    /// Heir claims the inheritance after settlement
    public entry fun claim_inheritance(
        vault: &mut LegacyVault,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.heir_address, ENotHeir);
        assert!(vault.status == STATUS_SETTLED, EGracePeriodNotExpired);
        
        let current_time = clock::timestamp_ms(clock);
        
        // Check maturity date if set
        if (vault.maturity_timestamp > 0) {
            assert!(current_time >= vault.maturity_timestamp, EMaturityNotReached);
        };
        
        // Transfer all balance to heir
        let amount = balance::value(&vault.balance);
        let coin = coin::from_balance(balance::split(&mut vault.balance, amount), ctx);
        transfer::public_transfer(coin, vault.heir_address);
    }

    /// Deposit additional funds to vault
    public entry fun deposit(
        vault: &mut LegacyVault,
        deposit: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.grantor, ENotGrantor);
        assert!(vault.status != STATUS_SETTLED, EVaultSettled);
        
        balance::join(&mut vault.balance, coin::into_balance(deposit));
    }

    /// Update heir address (grantor only, before settlement)
    public entry fun update_heir(
        vault: &mut LegacyVault,
        new_heir_ens: vector<u8>,
        new_heir_address: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.grantor, ENotGrantor);
        assert!(vault.status != STATUS_SETTLED, EVaultSettled);
        
        vault.heir_ens = string::utf8(new_heir_ens);
        vault.heir_address = new_heir_address;
    }

    /// Update encrypted will CID
    public entry fun update_will(
        vault: &mut LegacyVault,
        new_cid: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.grantor, ENotGrantor);
        assert!(vault.status != STATUS_SETTLED, EVaultSettled);
        
        vault.encrypted_will_cid = string::utf8(new_cid);
    }

    // ====== Guardian Functions ======
    
    /// Initiate guardian action to reset heartbeat
    public entry fun guardian_reset_heartbeat(
        vault: &mut LegacyVault,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(is_guardian(vault, sender), ENotGuardian);
        
        // For 1-of-N, execute immediately
        if (vault.guardian_threshold == 1) {
            vault.last_heartbeat = clock::timestamp_ms(clock);
            vault.status = STATUS_ACTIVE;
            vault.settlement_initiated = 0;
        } else {
            // TODO: Implement multi-sig voting for higher thresholds
            // For hackathon MVP, only support 1-of-N
            assert!(vault.guardian_threshold == 1, EInsufficientGuardians);
        }
    }

    // ====== View Functions ======
    
    /// Check if an address is a guardian of the vault
    public fun is_guardian(vault: &LegacyVault, addr: address): bool {
        let len = vector::length(&vault.guardians);
        let mut i = 0;
        while (i < len) {
            if (*vector::borrow(&vault.guardians, i) == addr) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Get vault status
    public fun get_status(vault: &LegacyVault): u8 {
        vault.status
    }

    /// Get last heartbeat timestamp
    public fun get_last_heartbeat(vault: &LegacyVault): u64 {
        vault.last_heartbeat
    }

    /// Get grace period in days
    public fun get_grace_period_days(vault: &LegacyVault): u64 {
        vault.grace_period_days
    }

    /// Get vault balance
    public fun get_balance(vault: &LegacyVault): u64 {
        balance::value(&vault.balance)
    }

    /// Get heir address
    public fun get_heir_address(vault: &LegacyVault): address {
        vault.heir_address
    }

    /// Get grantor address
    public fun get_grantor(vault: &LegacyVault): address {
        vault.grantor
    }

    /// Calculate time remaining before grace period expires (in ms)
    public fun time_until_warning(vault: &LegacyVault, clock: &Clock): u64 {
        let current_time = clock::timestamp_ms(clock);
        let deadline = vault.last_heartbeat + (vault.grace_period_days * MS_PER_DAY);
        
        if (current_time >= deadline) {
            0
        } else {
            deadline - current_time
        }
    }

    /// Calculate time remaining before final settlement (in ms)
    public fun time_until_settlement(vault: &LegacyVault, clock: &Clock): u64 {
        if (vault.status != STATUS_WARNING) {
            return 0
        };
        
        let current_time = clock::timestamp_ms(clock);
        let deadline = vault.settlement_initiated + (WARNING_PERIOD_DAYS * MS_PER_DAY);
        
        if (current_time >= deadline) {
            0
        } else {
            deadline - current_time
        }
    }
}
