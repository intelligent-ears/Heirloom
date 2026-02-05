import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
    Shield,
    ArrowLeft,
    ArrowRight,
    User,
    Clock,
    Users,
    Upload,
    CheckCircle
} from 'lucide-react'
import './CreateVault.css'

const steps = [
    { id: 1, title: 'Heir Details', icon: User },
    { id: 2, title: 'Grace Period', icon: Clock },
    { id: 3, title: 'Guardians', icon: Users },
    { id: 4, title: 'Confirmation', icon: CheckCircle },
]

function CreateVault() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({
        heirEns: '',
        gracePeriod: 180,
        guardians: ['', '', ''],
        guardianThreshold: 2,
        maturityDate: '',
        depositAmount: ''
    })

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = () => {
        // TODO: Connect to Sui contract
        console.log('Creating vault:', formData)
        navigate('/dashboard')
    }

    return (
        <div className="create-vault">
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
                    <Link to="/dashboard" className="btn btn-secondary">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                </div>
            </nav>

            <main className="create-main">
                <div className="container">
                    <div className="create-header">
                        <h1>Create Your <span className="text-gradient">Legacy Vault</span></h1>
                        <p>Set up your inheritance in a few simple steps</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="steps-progress">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`step-item ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                            >
                                <div className="step-circle">
                                    {currentStep > step.id ? (
                                        <CheckCircle size={20} />
                                    ) : (
                                        <step.icon size={20} />
                                    )}
                                </div>
                                <span className="step-title">{step.title}</span>
                                {index < steps.length - 1 && <div className="step-line" />}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <motion.div
                        className="step-content"
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {currentStep === 1 && (
                            <div className="form-section">
                                <h2>Who will inherit your assets?</h2>
                                <p>Enter your heir's ENS name. They'll receive your assets when the vault settles.</p>

                                <div className="form-group">
                                    <label>Heir's ENS Name</label>
                                    <div className="input-with-suffix">
                                        <input
                                            type="text"
                                            placeholder="grandson"
                                            value={formData.heirEns.replace('.eth', '')}
                                            onChange={(e) => setFormData({ ...formData, heirEns: e.target.value })}
                                        />
                                        <span className="input-suffix">.eth</span>
                                    </div>
                                    <span className="input-help">Your heir must have an ENS name to claim inheritance</span>
                                </div>

                                <div className="form-group">
                                    <label>Maturity Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.maturityDate}
                                        onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <span className="input-help">Lock assets until heir reaches a certain age/date</span>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="form-section">
                                <h2>Set Your Grace Period</h2>
                                <p>How long should the protocol wait before triggering settlement?</p>

                                <div className="form-group">
                                    <label>Grace Period (Days)</label>
                                    <div className="slider-container">
                                        <input
                                            type="range"
                                            min="30"
                                            max="365"
                                            value={formData.gracePeriod}
                                            onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                                        />
                                        <div className="slider-value">
                                            <span className="value-number">{formData.gracePeriod}</span>
                                            <span className="value-label">days</span>
                                        </div>
                                    </div>
                                    <div className="slider-hints">
                                        <span>30 days</span>
                                        <span>Recommended: 180 days</span>
                                        <span>365 days</span>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <Clock size={24} />
                                    <div>
                                        <h4>How it works</h4>
                                        <p>You must send a heartbeat transaction at least once every {formData.gracePeriod} days.
                                            If you miss this deadline, a 30-day warning period begins before settlement.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="form-section">
                                <h2>Add Guardians (Optional)</h2>
                                <p>Guardians can help with recovery if you lose wallet access.</p>

                                <div className="guardians-list">
                                    {formData.guardians.map((guardian, index) => (
                                        <div key={index} className="form-group">
                                            <label>Guardian {index + 1}</label>
                                            <div className="input-with-suffix">
                                                <input
                                                    type="text"
                                                    placeholder={`guardian${index + 1}`}
                                                    value={guardian.replace('.eth', '')}
                                                    onChange={(e) => {
                                                        const newGuardians = [...formData.guardians]
                                                        newGuardians[index] = e.target.value
                                                        setFormData({ ...formData, guardians: newGuardians })
                                                    }}
                                                />
                                                <span className="input-suffix">.eth</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group">
                                    <label>Required Signatures</label>
                                    <select
                                        value={formData.guardianThreshold}
                                        onChange={(e) => setFormData({ ...formData, guardianThreshold: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>1 of 3 guardians</option>
                                        <option value={2}>2 of 3 guardians</option>
                                        <option value={3}>3 of 3 guardians</option>
                                    </select>
                                </div>

                                <div className="info-card warning">
                                    <Users size={24} />
                                    <div>
                                        <h4>Guardian Powers</h4>
                                        <p>Guardians can reset your heartbeat timer and update the heir address if enough agree.
                                            Choose people you trust completely.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="form-section">
                                <h2>Confirm Your Vault</h2>
                                <p>Review your settings and deposit assets to create your vault.</p>

                                <div className="summary-card">
                                    <div className="summary-row">
                                        <span className="summary-label">Heir</span>
                                        <span className="summary-value">{formData.heirEns || 'Not set'}.eth</span>
                                    </div>
                                    <div className="summary-row">
                                        <span className="summary-label">Grace Period</span>
                                        <span className="summary-value">{formData.gracePeriod} days</span>
                                    </div>
                                    <div className="summary-row">
                                        <span className="summary-label">Guardians</span>
                                        <span className="summary-value">
                                            {formData.guardians.filter(g => g).length || 0} guardians ({formData.guardianThreshold}-of-{formData.guardians.filter(g => g).length || 3} required)
                                        </span>
                                    </div>
                                    {formData.maturityDate && (
                                        <div className="summary-row">
                                            <span className="summary-label">Maturity Date</span>
                                            <span className="summary-value">{formData.maturityDate}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Initial Deposit (ETH)</label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.01"
                                        value={formData.depositAmount}
                                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                    />
                                    <span className="input-help">You can add more assets later</span>
                                </div>

                                <div className="form-group">
                                    <label>Video Will (Optional)</label>
                                    <div className="upload-area">
                                        <Upload size={32} />
                                        <p>Drag & drop a video or click to browse</p>
                                        <span>Encrypted and stored on Walrus/IPFS</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Navigation Buttons */}
                    <div className="step-navigation">
                        {currentStep > 1 && (
                            <button className="btn btn-secondary" onClick={handleBack}>
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}
                        <div className="nav-spacer" />
                        {currentStep < 4 ? (
                            <button className="btn btn-primary" onClick={handleNext}>
                                Continue
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
                                <Shield size={20} />
                                Create Vault
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default CreateVault
