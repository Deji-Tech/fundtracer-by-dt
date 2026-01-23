import React, { useState, useEffect } from 'react';
import './FirstTimeModal.css';

interface FirstTimeModalProps {
    onClose: () => void;
}

const FirstTimeModal: React.FC<FirstTimeModalProps> = ({ onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    return (
        <div className={`first-time-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
            <div className={`first-time-modal ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="first-time-icon">
                    <span className="beta-badge">BETA</span>
                </div>

                <h2 className="first-time-title">Welcome to FundTracer</h2>

                <div className="first-time-content">
                    <div className="notice-item">
                        <span className="notice-icon">⚠️</span>
                        <div>
                            <strong>Beta Mode Active</strong>
                            <p>FundTracer is currently in beta. We're continuously improving!</p>
                        </div>
                    </div>

                    <div className="notice-item">
                        <span className="notice-icon">⏱️</span>
                        <div>
                            <strong>Analysis Time</strong>
                            <p>Wallets with high transaction counts may take a few seconds to minutes to load.</p>
                        </div>
                    </div>

                    <div className="notice-item">
                        <span className="notice-icon">💬</span>
                        <div>
                            <strong>Need Help?</strong>
                            <p>Encountered an issue? Please message us and we'll assist you promptly.</p>
                        </div>
                    </div>
                </div>

                <button
                    className="first-time-button"
                    onClick={handleClose}
                >
                    Got it, Let's Start!
                </button>
            </div>
        </div>
    );
};

export default FirstTimeModal;
