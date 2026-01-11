import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Globe, Shield, Zap } from 'lucide-react';

interface HowToUseProps {
    isOpen: boolean;
    onToggle: () => void;
}

function HowToUse({ isOpen, onToggle }: HowToUseProps) {
    return (
        <div className="how-to-use">
            <button className="how-to-use-toggle" onClick={onToggle}>
                <span>How to Use FundTracer</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isOpen && (
                <div className="how-to-use-content">
                    <div className="use-section">
                        <div className="use-icon">
                            <Globe size={24} />
                        </div>
                        <div className="use-details">
                            <h3>Web Dashboard</h3>
                            <ol>
                                <li>Sign in with your Google account</li>
                                <li>Select the blockchain network (Ethereum, Linea, etc.)</li>
                                <li>Enter a wallet address to analyze</li>
                                <li>View funding sources, destinations, and risk indicators</li>
                            </ol>
                            <p className="use-note">Free tier: 7 analyses per day. Add your own API key for unlimited access.</p>
                        </div>
                    </div>

                    <div className="use-section">
                        <div className="use-icon">
                            <Terminal size={24} />
                        </div>
                        <div className="use-details">
                            <h3>CLI Tool</h3>
                            <div className="code-block">
                                <code>
                                    <span className="code-comment"># Install and configure</span><br />
                                    npm install -g @fundtracer/cli<br />
                                    fundtracer config --set-key YOUR_API_KEY<br /><br />
                                    <span className="code-comment"># Analyze a wallet</span><br />
                                    fundtracer analyze 0x742d35Cc...<br /><br />
                                    <span className="code-comment"># Compare wallets for Sybil detection</span><br />
                                    fundtracer compare 0xAddr1 0xAddr2 0xAddr3
                                </code>
                            </div>
                        </div>
                    </div>

                    <div className="use-section">
                        <div className="use-icon">
                            <Shield size={24} />
                        </div>
                        <div className="use-details">
                            <h3>What We Detect</h3>
                            <ul className="detection-list">
                                <li><Zap size={14} /> Rapid fund movement (flash loans, MEV)</li>
                                <li><Zap size={14} /> Same-block transactions (bot activity)</li>
                                <li><Zap size={14} /> Circular fund flows (wash trading)</li>
                                <li><Zap size={14} /> Sybil farming patterns</li>
                                <li><Zap size={14} /> Fresh wallet with high activity</li>
                                <li><Zap size={14} /> Dust attacks</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HowToUse;
