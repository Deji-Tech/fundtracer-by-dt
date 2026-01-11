import React from 'react';
import { Settings, Github } from 'lucide-react';

interface HeaderProps {
    onSettingsClick?: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="logo">
                    <img
                        src="/logo.png"
                        alt="Cyber-Nanna"
                        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <span className="logo-text">FundTracer</span>
                    <span className="logo-subtext">by DT</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-icon"
                        aria-label="GitHub"
                    >
                        <Github size={18} />
                    </a>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onSettingsClick}
                        aria-label="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
