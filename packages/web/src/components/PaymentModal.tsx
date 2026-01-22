import React from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
    const [copied, setCopied] = React.useState(false);
    const paymentAddress = '0x5F3a8F5F50dCaEF0727cF5541513bb59edb2C377';

    const handleCopy = () => {
        navigator.clipboard.writeText(paymentAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="payment-modal-header">
                    <h2>Upgrade to Premium</h2>
                    <p className="payment-subtitle">Choose your tier and send USDT on Linea Mainnet</p>
                </div>

                <div className="payment-tiers">
                    <div className="payment-tier animate-card-1">
                        <div className="tier-header">
                            <span className="tier-label">PRO TIER</span>
                            <span className="tier-price">10 USDT</span>
                        </div>
                        <div className="tier-features">
                            <span>✓ 30 days access</span>
                            <span>✓ No gas fees</span>
                            <span>✓ Unlimited analyses</span>
                        </div>
                    </div>

                    <div className="payment-tier payment-tier-featured animate-card-2">
                        <div className="tier-badge">BEST VALUE</div>
                        <div className="tier-header">
                            <span className="tier-label">MAX TIER</span>
                            <span className="tier-price">17 USDT</span>
                        </div>
                        <div className="tier-features">
                            <span>✓ 30 days access</span>
                            <span>✓ Premium perks</span>
                            <span>✓ Sybil detection</span>
                            <span>✓ API access</span>
                        </div>
                    </div>
                </div>

                <div className="payment-address-section">
                    <label className="payment-label">Payment Address (Linea USDT)</label>
                    <div className="payment-address-box">
                        <code className="payment-address">{paymentAddress}</code>
                        <button
                            className="copy-btn"
                            onClick={handleCopy}
                            title="Copy address"
                        >
                            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                    <p className="payment-instructions">
                        Send USDT on <strong>Linea Mainnet</strong> to this address.
                        Your tier upgrades automatically within 2 minutes.
                    </p>
                </div>

                <div className="payment-warning">
                    <strong>⚠️ Important:</strong> Only send USDT on Linea Mainnet. Sending on other networks will result in loss of funds.
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
