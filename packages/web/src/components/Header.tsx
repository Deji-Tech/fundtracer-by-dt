import React from 'react';
import { Settings, Github, Mail } from 'lucide-react';
import logo from '../assets/logo.png';

interface HeaderProps {
    onSettingsClick?: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="logo">
                    <img
                        src={logo}
                        alt="FundTracer"
                        className="logo-img-blend"
                        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <span className="logo-text">FundTracer <span className="beta-tag">BETA</span></span>
                    <span className="logo-subtext">by DT</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <a
                        href="https://github.com/Deji-Tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-icon"
                        aria-label="GitHub"
                        title="GitHub"
                    >
                        <Github size={18} />
                    </a>
                    <a
                        href="mailto:fundtracerbydt@gmail.com"
                        className="btn btn-ghost btn-icon"
                        aria-label="Email"
                        title="Contact us"
                    >
                        <Mail size={18} />
                    </a>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onSettingsClick}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
