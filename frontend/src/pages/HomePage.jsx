import React from 'react';

const HomePage = ({ onNavigate }) => {
    return (
        <div className="container" style={{ marginTop: '24px' }}>

            {/* Hero */}
            <div className="hero">
                <h1>
                    Distributed CAD
                    <br />
                    Version Control
                </h1>
                <p>
                    Checkout, diff, merge, and synchronize 3D geometry
                    across multiple distributed sites — like Git, but for CAD models.
                </p>
                <div className="hero-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => onNavigate('dashboard-a')}
                    >
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                        </svg>
                        Open Dashboard
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => onNavigate('demo')}
                    >
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                            <path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z" />
                        </svg>
                        Run Demo
                    </button>
                </div>
            </div>

            {/* Features */}
            <div className="feature-grid">
                <div className="feature-card">
                    <span className="feature-icon">📥</span>
                    <h3>Checkout & Upload</h3>
                    <p>Upload OBJ, STL, STEP, IGES files. Parse to JSON for granular version tracking.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">🔀</span>
                    <h3>Geometry Diff</h3>
                    <p>Compare vertices, faces, and transformations across any two versions.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">🌿</span>
                    <h3>Branching</h3>
                    <p>Create and manage branches for parallel development of CAD models.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">⚡</span>
                    <h3>Delta Storage</h3>
                    <p>Store only incremental changes — up to 83% space reduction vs full snapshots.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">⚠️</span>
                    <h3>Conflict Resolution</h3>
                    <p>Automatic detection and resolution via branching, timestamps, or manual merge.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">🔄</span>
                    <h3>Multi-Site Sync</h3>
                    <p>Push and pull between distributed nodes with consistency verification.</p>
                </div>
            </div>

            {/* Info section */}
            <div className="card" style={{ marginTop: '16px' }}>
                <h2>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style={{ color: '#8b949e' }}>
                        <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
                    </svg>
                    Getting Started
                </h2>
                <div style={{ color: '#8b949e', fontSize: '14px', lineHeight: '1.8' }}>
                    <p style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#e6edf3' }}>1.</strong> Navigate to <strong style={{ color: '#58a6ff', cursor: 'pointer' }} onClick={() => onNavigate('dashboard-a')}>Node A</strong> or <strong style={{ color: '#58a6ff', cursor: 'pointer' }} onClick={() => onNavigate('dashboard-b')}>Node B</strong> to access a specific site.
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#e6edf3' }}>2.</strong> Upload 3D files (OBJ, STL, STEP, IGES) to create versioned geometry.
                    </p>
                    <p>
                        <strong style={{ color: '#e6edf3' }}>3.</strong> View version history, create branches, and compare diffs.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
