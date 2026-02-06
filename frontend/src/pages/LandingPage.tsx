import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Shield,
    Heart,
    Clock,
    Users,
    Zap,
    Lock,
    ArrowRight,
    CheckCircle,
    Sparkles
} from 'lucide-react'
import './LandingPage.css'

const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' }
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
}

function LandingPage() {
    return (
        <div className="landing">
            {/* Animated Background */}
            <div className="bg-gradient" />
            <div className="bg-grid" />
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />
            <div className="bg-glow bg-glow-3" />

            {/* Navigation */}
            <nav className="nav">
                <div className="container nav-container">
                    <Link to="/" className="logo">
                        <Shield className="logo-icon" />
                        <span>Heirloom</span>
                    </Link>
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#tech">Technology</a>
                    </div>
                    <Link to="/dashboard" className="btn btn-primary">
                        Launch App
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero section">
                <div className="container">
                    <motion.div
                        className="hero-content"
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                    >
                        <motion.div className="hero-badge" variants={fadeInUp}>
                            <Sparkles size={16} />
                            <span>Built for ETHGlobal HackMoney 2026</span>
                        </motion.div>

                        <motion.h1 variants={fadeInUp}>
                            Your Legacy,
                            <br />
                            <span className="text-gradient">Forever On-Chain</span>
                        </motion.h1>

                        <motion.p className="hero-description" variants={fadeInUp}>
                            The first cross-chain inheritance protocol with cryptographic proof-of-life.
                            Ensure your digital assets reach your loved ones, automatically.
                        </motion.p>

                        <motion.div className="hero-cta" variants={fadeInUp}>
                            <Link to="/create" className="btn btn-primary btn-lg">
                                Create Your Legacy
                                <ArrowRight size={20} />
                            </Link>
                            <a href="#how-it-works" className="btn btn-secondary btn-lg">
                                Learn More
                            </a>
                        </motion.div>

                        <motion.div className="hero-stats" variants={fadeInUp}>
                            <div className="stat">
                                <span className="stat-value text-gradient">$100B+</span>
                                <span className="stat-label">Lost to forgotten keys</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat">
                                <span className="stat-value text-gold">180 days</span>
                                <span className="stat-label">Default grace period</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat">
                                <span className="stat-value" style={{ color: 'var(--color-success)' }}>100%</span>
                                <span className="stat-label">Self-custodial</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Floating Vault Card */}
                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="vault-card animate-float">
                            <div className="vault-header">
                                <div className="vault-status active">
                                    <Heart className="animate-heartbeat" size={16} />
                                    <span>Active</span>
                                </div>
                                <span className="vault-id">#2847</span>
                            </div>
                            <div className="vault-body">
                                <div className="vault-ens">
                                    <span className="ens-from">grandfather.eth</span>
                                    <ArrowRight size={20} className="ens-arrow" />
                                    <span className="ens-to">grandson.eth</span>
                                </div>
                                <div className="vault-amount">
                                    <span className="amount-value">10.5 ETH</span>
                                    <span className="amount-usd">≈ $42,000</span>
                                </div>
                            </div>
                            <div className="vault-footer">
                                <div className="heartbeat-timer">
                                    <Clock size={14} />
                                    <span>Last heartbeat: 23 days ago</span>
                                </div>
                                <div className="days-remaining">
                                    <span className="days-value">157</span>
                                    <span className="days-label">days left</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>Built for the <span className="text-gradient">Future</span></h2>
                        <p>Everything you need to protect your digital legacy</p>
                    </motion.div>

                    <motion.div
                        className="features-grid"
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.div className="feature-card" variants={fadeInUp}>
                            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}>
                                <Heart size={28} />
                            </div>
                            <h4>Proof of Life</h4>
                            <p>Periodic heartbeat transactions confirm you're still in control. No heartbeat? Your heirs are notified.</p>
                        </motion.div>

                        <motion.div className="feature-card" variants={fadeInUp}>
                            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #4da2ff 0%, #3b82f6 100%)' }}>
                                <Shield size={28} />
                            </div>
                            <h4>Self-Custodial</h4>
                            <p>Your keys, your crypto. We never touch your assets. Everything runs on decentralized smart contracts.</p>
                        </motion.div>

                        <motion.div className="feature-card" variants={fadeInUp}>
                            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #5298ff 0%, #818cf8 100%)' }}>
                                <Users size={28} />
                            </div>
                            <h4>ENS Identity</h4>
                            <p>Inherit by name, not address. grandfather.eth → grandson.eth. Human-readable, mistake-proof.</p>
                        </motion.div>

                        <motion.div className="feature-card" variants={fadeInUp}>
                            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ff007a 0%, #f43f5e 100%)' }}>
                                <Zap size={28} />
                            </div>
                            <h4>Gradual Liquidation</h4>
                            <p>Uniswap v4 hooks enable market-safe distribution. No dumps, best execution for your heirs.</p>
                        </motion.div>

                        <motion.div className="feature-card" variants={fadeInUp}>
                            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)' }}>
                                <Lock size={28} />
                            </div>
                            <h4>Age-Locked Trusts</h4>
                            <p>Set your grandson as heir but lock funds until age 18. Built-in trust management.</p>
                        </motion.div>

                        <motion.div className="feature-card" variants={fadeInUp}>
                            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                <Users size={28} />
                            </div>
                            <h4>Guardian Recovery</h4>
                            <p>3-of-5 guardians can recover access if you lose your keys. Social recovery built in.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>How It <span className="text-gradient">Works</span></h2>
                        <p>Simple steps to secure your digital legacy</p>
                    </motion.div>

                    <div className="steps">
                        <motion.div
                            className="step"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <h4>Create Your Vault</h4>
                                <p>Connect your wallet, designate your heir by ENS name, set your heartbeat interval, and deposit assets.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="step"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <h4>Send Heartbeats</h4>
                                <p>Periodically sign a transaction to prove you're still in control. We'll remind you before deadlines.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="step"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <h4>Automatic Settlement</h4>
                                <p>If you stop sending heartbeats, a grace period begins. After that, assets transfer to your heir automatically.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="step"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="step-number">04</div>
                            <div className="step-content">
                                <h4>Heir Claims</h4>
                                <p>Your heir connects their wallet, verifies their ENS identity, and claims their inheritance. Simple.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section id="tech" className="tech section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>Powered By <span className="text-gradient">The Best</span></h2>
                        <p>Built on battle-tested decentralized infrastructure</p>
                    </motion.div>

                    <motion.div
                        className="tech-grid"
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.div className="tech-card" variants={fadeInUp}>
                            <div className="tech-logo sui">
                                <span>SUI</span>
                            </div>
                            <h4>Sui Network</h4>
                            <p>Core vault logic, heartbeat state machine, and guardian management on Sui's high-performance L1.</p>
                            <ul className="tech-features">
                                <li><CheckCircle size={14} /> Move smart contracts</li>
                                <li><CheckCircle size={14} /> Object-centric model</li>
                                <li><CheckCircle size={14} /> Sub-second finality</li>
                            </ul>
                        </motion.div>

                        <motion.div className="tech-card" variants={fadeInUp}>
                            <div className="tech-logo uniswap">
                                <span>🦄</span>
                            </div>
                            <h4>Uniswap v4</h4>
                            <p>Custom hooks for gradual liquidation, protecting heirs from market impact during settlement.</p>
                            <ul className="tech-features">
                                <li><CheckCircle size={14} /> Agentic execution</li>
                                <li><CheckCircle size={14} /> TWAP distribution</li>
                                <li><CheckCircle size={14} /> Slippage protection</li>
                            </ul>
                        </motion.div>

                        <motion.div className="tech-card" variants={fadeInUp}>
                            <div className="tech-logo ens">
                                <span>ENS</span>
                            </div>
                            <h4>ENS Domains</h4>
                            <p>Human-readable inheritance. Store vault metadata in text records, resolve heirs by name.</p>
                            <ul className="tech-features">
                                <li><CheckCircle size={14} /> Name resolution</li>
                                <li><CheckCircle size={14} /> Text records</li>
                                <li><CheckCircle size={14} /> Social verification</li>
                            </ul>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta section">
                <div className="container">
                    <motion.div
                        className="cta-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2>Ready to Secure Your <span className="text-gradient">Legacy</span>?</h2>
                        <p>Join the future of digital inheritance. Your loved ones will thank you.</p>
                        <Link to="/create" className="btn btn-primary btn-lg">
                            Create Your Vault
                            <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-container">
                    <div className="footer-brand">
                        <Shield size={24} />
                        <span>Heirloom</span>
                    </div>
                    <div className="footer-links">
                        <a href="https://github.com/defi-legacy" target="_blank" rel="noopener">GitHub</a>
                        <a href="https://docs.defilegacy.xyz" target="_blank" rel="noopener">Docs</a>
                        <a href="https://twitter.com/defilegacy" target="_blank" rel="noopener">Twitter</a>
                    </div>
                    <div className="footer-copy">
                        <span>Built for ETHGlobal HackMoney 2026</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
