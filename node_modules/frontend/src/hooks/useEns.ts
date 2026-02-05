import { useAccount, useEnsName, useEnsAddress, useEnsResolver } from 'wagmi'
import { normalize } from 'viem/ens'

/**
 * Hook to get the current user's ENS name
 */
export function useUserEns() {
    const { address } = useAccount()

    const { data: ensName, isLoading, error } = useEnsName({
        address: address,
    })

    return {
        address,
        ensName: ensName || null,
        isLoading,
        error,
        hasEns: !!ensName,
    }
}

/**
 * Hook to resolve an ENS name to an address
 */
export function useResolveEns(ensName: string | undefined) {
    const { data: address, isLoading, error } = useEnsAddress({
        name: ensName ? normalize(ensName) : undefined,
    })

    return {
        address: address || null,
        isLoading,
        error,
        isValid: !!address,
    }
}

/**
 * Hook to check if an ENS name is valid and resolvable
 */
export function useValidateEns(ensName: string) {
    const fullName = ensName.endsWith('.eth') ? ensName : `${ensName}.eth`

    const { address, isLoading, error } = useResolveEns(fullName)

    return {
        fullName,
        address,
        isLoading,
        error,
        isValid: !!address && !error,
    }
}

/**
 * Format an address for display (truncated with ENS fallback)
 */
export function useFormattedAddress(address: `0x${string}` | undefined) {
    const { data: ensName } = useEnsName({ address })

    if (ensName) return ensName
    if (!address) return ''

    return `${address.slice(0, 6)}...${address.slice(-4)}`
}
