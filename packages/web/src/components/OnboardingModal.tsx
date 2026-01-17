import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Wallet, Search, Shield, Zap, Check } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    const handleComplete = () => {
        localStorage.setItem('fundtracer_onboarding_complete', 'true');
        onClose();
    };

    const steps = [
        // Step 1: Welcome
        <div key="welcome" className="onboarding-step animate-fade-in">
            <div className="onboarding-icon">
                <Search size={48} strokeWidth={1.5} />
            </div>
            <h2>Welcome to FundTracer</h2>
            <p className="onboarding-subtitle">
                Blockchain forensics made simple. Trace wallet funding sources,
                detect suspicious patterns, and uncover Sybil clusters.
            </p>
            <div className="onboarding-features">
                <div className="feature-item">
                    <Wallet size={20} />
                    <span>Analyze any EVM wallet</span>
                </div>
                <div className="feature-item">
                    <Search size={20} />
                    <span>Trace funding origins</span>
                </div>
                <div className="feature-item">
                    <Shield size={20} />
                    <span>Detect Sybil clusters</span>
                </div>
            </div>
        </div>,

        // Step 2: How To Use
        <div key="howto" className="onboarding-step animate-fade-in">
            <h2>How To Use</h2>
            <div className="onboarding-steps-list">
                <div className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                        <strong>Connect Wallet</strong>
                        <p>Sign in with your wallet to verify ownership</p>
                    </div>
                </div>
                <div className="step-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                        <strong>Choose Analysis Mode</strong>
                        <p>Wallet, Contract, Compare, or Sybil detection</p>
                    </div>
                </div>
                <div className="step-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                        <strong>Enter Address</strong>
                        <p>Paste the wallet or contract address to analyze</p>
                    </div>
                </div>
                <div className="step-item">
                    <div className="step-number">4</div>
                    <div className="step-content">
                        <strong>View Results</strong>
                        <p>Explore funding trees, risk scores, and patterns</p>
                    </div>
                </div>
            </div>
        </div>,

        // Step 3: Privacy
        <div key="privacy" className="onboarding-step animate-fade-in">
            <h2>Your Privacy Matters</h2>
            <div className="privacy-summary">
                <div className="privacy-item">
                    <Check size={18} className="check-icon" />
                    <span>We only analyze <strong>public blockchain data</strong></span>
                </div>
                <div className="privacy-item">
                    <Check size={18} className="check-icon" />
                    <span>We <strong>never</strong> access your private keys or funds</span>
                </div>
                <div className="privacy-item">
                    <Check size={18} className="check-icon" />
                    <span>Wallet connection is for <strong>verification only</strong></span>
                </div>
                <div className="privacy-item">
                    <Check size={18} className="check-icon" />
                    <span>No tracking, no ads, no data selling</span>
                </div>
            </div>
            <p className="privacy-note">
                Read our full <button className="link-btn" onClick={() => { }}>Privacy Policy</button> for details.
            </p>
        </div>,

        // Step 4: Pricing
        <div key="pricing" className="onboarding-step animate-fade-in">
            <h2>Choose Your Plan</h2>
            <div className="pricing-grid">
                <div className="pricing-card">
                    <div className="pricing-header">
                        <h3>Free</h3>
                        <div className="pricing-price">$0</div>
                    </div>
                    <ul className="pricing-features">
                        <li><Check size={16} /> Basic wallet analysis</li>
                        <li><Check size={16} /> Pay-per-analysis (gas only)</li>
                        <li><Check size={16} /> Community support</li>
                    </ul>
                </div>
                <div className="pricing-card featured">
                    <div className="pricing-badge">Popular</div>
                    <div className="pricing-header">
                        <h3>Pro</h3>
                        <div className="pricing-price">$10<span>/mo</span></div>
                    </div>
                    <ul className="pricing-features">
                        <li><Check size={16} /> Unlimited analyses</li>
                        <li><Check size={16} /> Contract analysis</li>
                        <li><Check size={16} /> Priority support</li>
                        <li><Check size={16} /> Export reports</li>
                    </ul>
                </div>
                <div className="pricing-card">
                    <div className="pricing-header">
                        <h3>Max</h3>
                        <div className="pricing-price">$17<span>/mo</span></div>
                    </div>
                    <ul className="pricing-features">
                        <li><Check size={16} /> Everything in Pro</li>
                        <li><Check size={16} /> Sybil detection</li>
                        <li><Check size={16} /> API access</li>
                        <li><Check size={16} /> Custom integrations</li>
                    </ul>
                </div>
            </div>
        </div>
    ];

    return (
        <div className="modal-overlay" onClick={handleComplete}>
            <div className="modal-content onboarding-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={handleComplete}>
                    <X size={20} />
                </button>

                <div className="onboarding-content">
                    {steps[step]}
                </div>

                <div className="onboarding-footer">
                    <div className="onboarding-dots">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                className={`dot ${i === step ? 'active' : ''}`}
                                onClick={() => setStep(i)}
                            />
                        ))}
                    </div>

                    <div className="onboarding-nav">
                        {step > 0 && (
                            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                                <ChevronLeft size={18} /> Back
                            </button>
                        )}
                        {step < steps.length - 1 ? (
                            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleComplete}>
                                Get Started <Zap size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
