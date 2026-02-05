// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IENS, IENSResolver} from "./interfaces/IENS.sol";

/**
 * @title ENSInheritance
 * @notice ENS text record integration for DeFi Legacy
 * @dev Stores and reads inheritance metadata in ENS text records
 * 
 * Text Records Used:
 * - "legacy.vault" - Address/ID of active vault
 * - "legacy.status" - Current status (active/warning/settled)
 * - "legacy.heir" - ENS name of designated heir
 * - "legacy.lastHeartbeat" - Timestamp of last heartbeat
 */
contract ENSInheritance {
    // ====== Constants ======
    
    /// @notice ENS Registry address on Ethereum mainnet
    address public constant ENS_REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
    
    /// @notice Text record keys
    string public constant KEY_VAULT = "legacy.vault";
    string public constant KEY_STATUS = "legacy.status";
    string public constant KEY_HEIR = "legacy.heir";
    string public constant KEY_HEARTBEAT = "legacy.lastHeartbeat";

    // ====== State ======
    
    /// @notice Mapping from ENS namehash to vault info
    mapping(bytes32 => VaultInfo) public vaultsByName;
    
    struct VaultInfo {
        address vaultAddress;
        string heirEns;
        string status;
        uint256 lastHeartbeat;
        bool exists;
    }

    // ====== Events ======
    
    event VaultLinked(bytes32 indexed nameHash, address vault, string heirEns);
    event StatusUpdated(bytes32 indexed nameHash, string status);
    event HeartbeatRecorded(bytes32 indexed nameHash, uint256 timestamp);

    // ====== Errors ======
    
    error NotOwner();
    error ENSNotFound();
    error VaultNotLinked();

    // ====== External Functions ======
    
    /**
     * @notice Link an ENS name to a DeFi Legacy vault
     * @param nameHash The namehash of the ENS name
     * @param vaultAddress Address of the vault contract
     * @param heirEns ENS name of the heir
     */
    function linkVault(
        bytes32 nameHash,
        address vaultAddress,
        string calldata heirEns
    ) external {
        // Verify caller owns the ENS name
        address owner = IENS(ENS_REGISTRY).owner(nameHash);
        if (owner != msg.sender) revert NotOwner();
        
        vaultsByName[nameHash] = VaultInfo({
            vaultAddress: vaultAddress,
            heirEns: heirEns,
            status: "active",
            lastHeartbeat: block.timestamp,
            exists: true
        });
        
        emit VaultLinked(nameHash, vaultAddress, heirEns);
    }

    /**
     * @notice Update the status of a linked vault
     * @param nameHash The namehash of the ENS name
     * @param status New status (active/warning/settled)
     */
    function updateStatus(bytes32 nameHash, string calldata status) external {
        VaultInfo storage info = vaultsByName[nameHash];
        if (!info.exists) revert VaultNotLinked();
        
        // In production, verify caller is the vault contract
        info.status = status;
        
        emit StatusUpdated(nameHash, status);
    }

    /**
     * @notice Record a heartbeat for a linked vault
     * @param nameHash The namehash of the ENS name
     */
    function recordHeartbeat(bytes32 nameHash) external {
        VaultInfo storage info = vaultsByName[nameHash];
        if (!info.exists) revert VaultNotLinked();
        
        info.lastHeartbeat = block.timestamp;
        info.status = "active";
        
        emit HeartbeatRecorded(nameHash, block.timestamp);
    }

    // ====== View Functions ======
    
    /**
     * @notice Resolve an ENS name to its owner address
     * @param nameHash The namehash of the ENS name
     */
    function resolveAddress(bytes32 nameHash) external view returns (address) {
        address resolver = IENS(ENS_REGISTRY).resolver(nameHash);
        if (resolver == address(0)) revert ENSNotFound();
        return IENSResolver(resolver).addr(nameHash);
    }

    /**
     * @notice Get vault info for an ENS name
     * @param nameHash The namehash of the ENS name
     */
    function getVaultInfo(bytes32 nameHash) external view returns (VaultInfo memory) {
        return vaultsByName[nameHash];
    }

    /**
     * @notice Check if an ENS name has an active vault
     * @param nameHash The namehash of the ENS name
     */
    function hasActiveVault(bytes32 nameHash) external view returns (bool) {
        VaultInfo memory info = vaultsByName[nameHash];
        return info.exists && keccak256(bytes(info.status)) == keccak256(bytes("active"));
    }

    /**
     * @notice Get the heir ENS name for a vault
     * @param nameHash The namehash of the grantor's ENS name
     */
    function getHeir(bytes32 nameHash) external view returns (string memory) {
        return vaultsByName[nameHash].heirEns;
    }

    // ====== Helper Functions ======
    
    /**
     * @notice Compute namehash for an ENS name
     * @dev Follows ENS namehashing algorithm
     */
    function namehash(string memory name) public pure returns (bytes32) {
        bytes32 node = 0x0;
        if (bytes(name).length == 0) return node;
        
        // Split name by dots and hash from right to left
        bytes memory nameBytes = bytes(name);
        uint256 lastDot = nameBytes.length;
        
        for (uint256 i = nameBytes.length; i > 0; i--) {
            if (nameBytes[i - 1] == bytes1('.') || i == 1) {
                uint256 start = i == 1 ? 0 : i;
                bytes memory label = new bytes(lastDot - start);
                for (uint256 j = start; j < lastDot; j++) {
                    label[j - start] = nameBytes[j];
                }
                node = keccak256(abi.encodePacked(node, keccak256(label)));
                lastDot = i - 1;
            }
        }
        
        return node;
    }
}
