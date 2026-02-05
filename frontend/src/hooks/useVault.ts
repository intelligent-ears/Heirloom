import { useState, useEffect } from 'react'

export interface Vault {
    id: string
    grantor: string
    grantorEns?: string
    heir: string
    heirEns: string
    balance: string
    balanceUsd: string
    lastHeartbeat: number
    gracePeriodDays: number
    status: 'active' | 'warning' | 'settled'
    guardians: string[]
    guardianThreshold: number
    maturityTimestamp?: number
    encryptedWillCid?: string
}

// Mock data for demo
const MOCK_VAULTS: Vault[] = [
    {
        id: '2847',
        grantor: '0x1234...5678',
        grantorEns: 'grandfather.eth',
        heir: '0xabcd...ef01',
        heirEns: 'grandson.eth',
        balance: '10.5',
        balanceUsd: '42,000',
        lastHeartbeat: Date.now() - 23 * 24 * 60 * 60 * 1000, // 23 days ago
        gracePeriodDays: 180,
        status: 'active',
        guardians: ['0x1111...2222', '0x3333...4444', '0x5555...6666'],
        guardianThreshold: 2,
    },
    {
        id: '1293',
        grantor: '0x9876...5432',
        grantorEns: 'alice.eth',
        heir: '0xfedc...ba98',
        heirEns: 'bob.eth',
        balance: '5.2',
        balanceUsd: '20,800',
        lastHeartbeat: Date.now() - 165 * 24 * 60 * 60 * 1000, // 165 days ago
        gracePeriodDays: 180,
        status: 'warning',
        guardians: [],
        guardianThreshold: 0,
    },
]

/**
 * Hook to fetch user's vaults
 */
export function useVaults(userAddress: string | undefined) {
    const [vaults, setVaults] = useState<Vault[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!userAddress) {
            setVaults([])
            setIsLoading(false)
            return
        }

        // Simulate API call
        const fetchVaults = async () => {
            try {
                setIsLoading(true)
                // TODO: Replace with actual Sui RPC call
                await new Promise(resolve => setTimeout(resolve, 1000))
                setVaults(MOCK_VAULTS)
                setError(null)
            } catch (err) {
                setError(err as Error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchVaults()
    }, [userAddress])

    return { vaults, isLoading, error }
}

/**
 * Hook to calculate vault status and time remaining
 */
export function useVaultStatus(vault: Vault) {
    const now = Date.now()
    const gracePeriodMs = vault.gracePeriodDays * 24 * 60 * 60 * 1000
    const deadline = vault.lastHeartbeat + gracePeriodMs
    const daysRemaining = Math.max(0, Math.floor((deadline - now) / (24 * 60 * 60 * 1000)))
    const daysSinceHeartbeat = Math.floor((now - vault.lastHeartbeat) / (24 * 60 * 60 * 1000))

    const progressPercent = Math.min(100, (daysSinceHeartbeat / vault.gracePeriodDays) * 100)

    let statusColor = 'var(--color-success)'
    if (vault.status === 'warning' || progressPercent > 80) {
        statusColor = 'var(--color-warning)'
    }
    if (vault.status === 'settled') {
        statusColor = 'var(--color-danger)'
    }

    return {
        daysRemaining,
        daysSinceHeartbeat,
        progressPercent,
        statusColor,
        isUrgent: progressPercent > 90,
    }
}

/**
 * Hook to send a heartbeat transaction
 */
export function useSendHeartbeat() {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const sendHeartbeat = async (vaultId: string) => {
        try {
            setIsPending(true)
            setError(null)

            // TODO: Replace with actual Sui transaction
            await new Promise(resolve => setTimeout(resolve, 2000))

            console.log('Heartbeat sent for vault:', vaultId)
            return true
        } catch (err) {
            setError(err as Error)
            return false
        } finally {
            setIsPending(false)
        }
    }

    return { sendHeartbeat, isPending, error }
}

/**
 * Hook to create a new vault
 */
export function useCreateVault() {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const createVault = async (params: {
        heirEns: string
        heirAddress: string
        gracePeriodDays: number
        maturityTimestamp?: number
        guardians: string[]
        guardianThreshold: number
        depositAmount: string
        encryptedWillCid?: string
    }) => {
        try {
            setIsPending(true)
            setError(null)

            // TODO: Replace with actual Sui transaction
            await new Promise(resolve => setTimeout(resolve, 2000))

            console.log('Vault created:', params)
            return { success: true, vaultId: '9999' }
        } catch (err) {
            setError(err as Error)
            return { success: false, error: err }
        } finally {
            setIsPending(false)
        }
    }

    return { createVault, isPending, error }
}
