import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
    appName: 'Heirloom',
    projectId: 'defi-legacy-hackmoney-2026', // TODO: Get from WalletConnect
    chains: [mainnet, sepolia],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
    },
})

// Contract addresses (to be updated after deployment)
export const CONTRACTS = {
    // Sepolia testnet
    sepolia: {
        legacyLiquidationHook: '0x0000000000000000000000000000000000000000',
        ensInheritance: '0x0000000000000000000000000000000000000000',
    },
    // Mainnet
    mainnet: {
        ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        ensResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    },
} as const

// Sui network configuration
export const SUI_CONFIG = {
    testnet: {
        rpcUrl: 'https://fullnode.testnet.sui.io:443',
        packageId: '0x0', // To be updated after deployment
    },
    mainnet: {
        rpcUrl: 'https://fullnode.mainnet.sui.io:443',
        packageId: '0x0',
    },
} as const
