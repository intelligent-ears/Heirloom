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


/**
 * Hook to fetch user's vaults
 */
export function useVaults(userAddress: string | undefined) {
    const [vaults, setVaults] = useState<Vault[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const hasuraEndpoint = import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT ?? 'http://localhost:8080/v1/graphql'

    useEffect(() => {
        if (!userAddress) {
            setVaults([])
            setIsLoading(false)
            return
        }

        const fetchVaults = async () => {
            try {
                setIsLoading(true)
                const response = await fetch(hasuraEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-role': 'user',
                        'x-hasura-wallet-address': userAddress
                    },
                    body: JSON.stringify({
                        query: `query Vaults($wallet: String!) {\n  vaults(where: { grantor_wallet: { _eq: $wallet } }) {\n    id\n    grantor_wallet\n    grantor_ens\n    heir_wallet\n    heir_ens\n    balance\n    balance_usd\n    last_heartbeat\n    grace_period_days\n    status\n    guardians\n    guardian_threshold\n    maturity_timestamp\n    encrypted_will_cid\n    created_at\n  }\n}`,
                        variables: { wallet: userAddress }
                    })
                })

                const data = await response.json()
                if (data.errors?.length) {
                    throw new Error(data.errors[0].message)
                }

                const mapped: Vault[] = (data.data?.vaults ?? []).map((vault: any) => ({
                    id: vault.id,
                    grantor: vault.grantor_wallet,
                    grantorEns: vault.grantor_ens ?? undefined,
                    heir: vault.heir_wallet,
                    heirEns: vault.heir_ens,
                    balance: Number(vault.balance ?? 0).toString(),
                    balanceUsd: Number(vault.balance_usd ?? 0).toLocaleString(),
                    lastHeartbeat: new Date(vault.last_heartbeat).getTime(),
                    gracePeriodDays: vault.grace_period_days,
                    status: vault.status,
                    guardians: vault.guardians ?? [],
                    guardianThreshold: vault.guardian_threshold ?? 0,
                    maturityTimestamp: vault.maturity_timestamp
                        ? new Date(vault.maturity_timestamp).getTime()
                        : undefined,
                    encryptedWillCid: vault.encrypted_will_cid ?? undefined,
                }))

                setVaults(mapped)
                setError(null)
            } catch (err) {
                setError(err as Error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchVaults()
    }, [userAddress, hasuraEndpoint])

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
