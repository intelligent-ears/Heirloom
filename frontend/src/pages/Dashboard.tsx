import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import {
    Shield,
    Plus,
    Heart,
    Clock,
    AlertTriangle,
    CheckCircle,
    ArrowRight,
    RefreshCw,
    Wallet
} from 'lucide-react'
import { useVaults, useVaultStatus, useSendHeartbeat } from '../hooks/useVault'
import './Dashboard.css'

function VaultCard({ vault }: { vault: any }) {
    const status = useVaultStatus(vault)
    const { sendHeartbeat, isPending } = useSendHeartbeat()

    const getStatusIcon = (vaultStatus: string) => {
        switch (vaultStatus) {
            case 'active': return <Heart size={14} />
            case 'warning': return <AlertTriangle size={14} />
            case 'settled': return <CheckCircle size={14} />
            default: return null
        }
    }

    return (
        <motion.div
            className="vault-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="vault-header">
                <div
                    className="vault-status"
                    style={{
                        background: `${status.statusColor}15`,
                        color: status.statusColor
                    }}
                >
                    {getStatusIcon(vault.status)}
                    <span>{vault.status.charAt(0).toUpperCase() + vault.status.slice(1)}</span>
                </div>
                <span className="vault-id">#{vault.id}</span>
            </div>

            <div className="vault-body">
                <div className="vault-ens">
                    <span className="ens-label">From</span>
                    <span className="ens-name">{vault.grantorEns || vault.grantor}</span>
                    <ArrowRight size={16} className="ens-arrow" />
                    <span className="ens-label">To</span>
                    <span className="ens-name heir">{vault.heirEns}</span>
                </div>

                <div className="vault-balance">
                    <span className="balance-value">{vault.balance} ETH</span>
                    <span className="balance-usd">${vault.balanceUsd}</span>
                </div>

                <div className="vault-progress">
                    <div className="progress-header">
                        <span>Grace Period Progress</span>
                        <span>{status.daysSinceHeartbeat} / {vault.gracePeriodDays} days</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${status.progressPercent}%`,
                                background: status.isUrgent
                                    ? 'var(--color-warning)'
                                    : 'var(--color-primary)'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="vault-footer">
                <button
                    className="btn btn-primary btn-send-heartbeat"
                    onClick={() => sendHeartbeat(vault.id)}
                    disabled={isPending}
                >
                    <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
                    {isPending ? 'Sending...' : 'Send Heartbeat'}
                </button>
                <button className="btn btn-secondary">
                    Manage
                </button>
            </div>
        </motion.div>
    )
}

function Dashboard() {
    const navigate = useNavigate()
    const { address, isConnected } = useAccount()
    const { vaults, isLoading } = useVaults(address)
    const [kycStatus, setKycStatus] = useState<'idle' | 'checking' | 'needs_verification' | 'pending' | 'verified' | 'error'>('idle')
    const [kycError, setKycError] = useState<string | null>(null)
    const [requestId, setRequestId] = useState<string | null>(null)
    const [nullifierHash, setNullifierHash] = useState('')
    const [proof, setProof] = useState('')
    const [isStarting, setIsStarting] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    const hasuraEndpoint = import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT ?? 'http://localhost:8080/v1/graphql'
    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'
    const isDevMode = (import.meta.env.VITE_PRIVADO_DEV_MODE ?? 'false') === 'true'

    useEffect(() => {
        if (!isConnected || !address) {
            setKycStatus('idle')
            setKycError(null)
            return
        }

        const checkWallet = async () => {
            try {
                setKycStatus('checking')
                setKycError(null)

                const response = await fetch(hasuraEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-role': 'user',
                        'x-hasura-wallet-address': address
                    },
                    body: JSON.stringify({
                        query: `query CheckUser($wallet: String!) { users(where: { wallet_address: { _eq: $wallet } }) { id } }`,
                        variables: { wallet: address }
                    })
                })

                const data = await response.json()
                if (data.errors?.length) {
                    throw new Error(data.errors[0].message)
                }

                const exists = (data.data?.users ?? []).length > 0
                setKycStatus(exists ? 'verified' : 'needs_verification')
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to check wallet'
                setKycError(message)
                setKycStatus('error')
            }
        }

        checkWallet()
    }, [address, hasuraEndpoint, isConnected])

    const startVerification = async () => {
        if (!address) return
        try {
            setIsStarting(true)
            setKycError(null)

            const response = await fetch(`${backendUrl}/privado/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to start verification')
            }

            setRequestId(data.requestId)
            setNullifierHash(crypto.randomUUID())
            setProof('dev-proof')
            setKycStatus('pending')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start verification'
            setKycError(message)
            setKycStatus('error')
        } finally {
            setIsStarting(false)
        }
    }

    const submitVerification = async () => {
        if (!address || !requestId) return
        try {
            setIsVerifying(true)
            setKycError(null)

            const response = await fetch(`${backendUrl}/privado/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    walletAddress: address,
                    nullifierHash,
                    proof
                })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error ?? 'Verification failed')
            }

            setKycStatus('verified')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Verification failed'
            setKycError(message)
            setKycStatus('error')
        } finally {
            setIsVerifying(false)
        }
    }

    const totalBalance = vaults.reduce((sum, v) => sum + parseFloat(v.balance), 0)
    const totalUsd = vaults.reduce((sum, v) => sum + parseFloat(v.balanceUsd.replace(',', '')), 0)
    const canCreateVault = kycStatus === 'verified'

    return (
        <div className="dashboard">
            {/* Background */}
            <div className="bg-gradient" />
            <div className="bg-grid" />

            {/* Navigation */}
            <nav className="nav">
                <div className="container nav-container">
                    <Link to="/" className="logo">
                        <Shield className="logo-icon" />
                        <span>Heirloom</span>
                    </Link>
                    <div className="nav-actions">
                        <ConnectButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="container">
                    {!isConnected ? (
                        <div className="connect-prompt">
                            <Wallet size={48} />
                            <h2>Connect Your Wallet</h2>
                            <p>Connect your wallet to view and manage your legacy vaults</p>
                            <ConnectButton />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="dashboard-header">
                                <div>
                                    <h1>Your Vaults</h1>
                                    <p>Manage your legacy vaults and send heartbeats</p>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => canCreateVault && navigate('/create')}
                                    disabled={!canCreateVault}
                                >
                                    <Plus size={20} />
                                    {canCreateVault ? 'Create Vault' : 'Verify to Create'}
                                </button>
                            </div>

                            <div className="kyc-card">
                                <div className="kyc-header">
                                    <div>
                                        <h3>Identity Verification</h3>
                                        <p>One human = one account. Verify once to create vaults.</p>
                                    </div>
                                    <span className={`kyc-status kyc-${kycStatus}`}>
                                        {kycStatus === 'checking' && 'Checking'}
                                        {kycStatus === 'needs_verification' && 'Not verified'}
                                        {kycStatus === 'pending' && 'Pending'}
                                        {kycStatus === 'verified' && 'Verified'}
                                        {kycStatus === 'error' && 'Error'}
                                        {kycStatus === 'idle' && 'Connect wallet'}
                                    </span>
                                </div>

                                {isDevMode && (
                                    <p className="kyc-warning">
                                        Demo mode: verification proof is stubbed.
                                    </p>
                                )}
                                {kycError && <p className="kyc-error">{kycError}</p>}

                                {kycStatus !== 'verified' && (
                                    <div className="kyc-actions">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={startVerification}
                                            disabled={isStarting || !isConnected}
                                        >
                                            {isStarting ? 'Starting...' : 'Start Verification'}
                                        </button>

                                        {requestId && (
                                            <div className="kyc-form">
                                                <div className="kyc-field">
                                                    <label>Request ID</label>
                                                    <input value={requestId} readOnly />
                                                </div>
                                                <div className="kyc-field">
                                                    <label>Nullifier Hash</label>
                                                    <input
                                                        value={nullifierHash}
                                                        onChange={(e) => setNullifierHash(e.target.value)}
                                                    />
                                                </div>
                                                <div className="kyc-field">
                                                    <label>Proof (dev mode)</label>
                                                    <input
                                                        value={proof}
                                                        onChange={(e) => setProof(e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={submitVerification}
                                                    disabled={isVerifying || !nullifierHash || !proof}
                                                >
                                                    {isVerifying ? 'Verifying...' : 'Submit Verification'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stats Overview */}
                            <motion.div
                                className="stats-grid"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                                        <Shield size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{vaults.length}</span>
                                        <span className="stat-label">Active Vaults</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)' }}>
                                        <Clock size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">${totalUsd.toLocaleString()}</span>
                                        <span className="stat-label">Total Protected</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                        <Heart size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{totalBalance.toFixed(1)} ETH</span>
                                        <span className="stat-label">Total Balance</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Vaults List */}
                            <div className="vaults-section">
                                <h2>Your Vaults</h2>
                                {isLoading ? (
                                    <div className="loading">Loading vaults...</div>
                                ) : vaults.length === 0 ? (
                                    <div className="empty-state">
                                        <Shield size={48} />
                                        <h3>No Vaults Yet</h3>
                                        <p>Create your first legacy vault to protect your digital assets</p>
                                        <Link to="/create" className="btn btn-primary">
                                            <Plus size={20} />
                                            Create Vault
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="vaults-list">
                                        {vaults.map((vault) => (
                                            <VaultCard key={vault.id} vault={vault} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Dashboard
