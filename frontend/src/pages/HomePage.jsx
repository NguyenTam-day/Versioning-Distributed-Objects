import React from 'react';

const HomePage = ({ onNavigate }) => {
    return (
        <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h1 style={{ fontSize: '3rem', color: '#667eea', marginBottom: '1rem' }}>
                     CAD Versioning System
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
                    Distributed Version Control for 3D Models
                </p>

                <div className="stats-grid" style={{ marginBottom: '3rem' }}>
                    <div className="stat-card">
                        <h3>Checkout</h3>
                        <p>Clone models to multiple sites</p>
                    </div>
                    <div className="stat-card">
                        <h3>Diff</h3>
                        <p>Compare geometry versions</p>
                    </div>
                    <div className="stat-card">
                        <h3>Merge</h3>
                        <p>Resolve conflicts intelligently</p>
                    </div>
                    <div className="stat-card">
                        <h3>Sync</h3>
                        <p>Synchronize across sites</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => onNavigate('dashboard-a')}
                        style={{ padding: '1.5rem', fontSize: '1.1rem', height: 'auto' }}
                    >
                        ️ Dashboard
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onNavigate('compare')}
                        style={{ padding: '1.5rem', fontSize: '1.1rem', height: 'auto' }}
                    >
                         Compare Nodes
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onNavigate('demo')}
                        style={{ padding: '1.5rem', fontSize: '1.1rem', height: 'auto' }}
                    >
                         Run Demo
                    </button>
                </div>

                <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'left' }}>
                    <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>✨ Features</h3>
                    <ul style={{ listStyle: 'none', paddingStart: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Upload 3D files (OBJ, STL, STEP, IGES)</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Parse geometry to JSON for comparison</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Compute detailed diffs (vertices, faces, transformations)</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Track version history with branching</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Delta storage to minimize space usage</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Intelligent conflict resolution (branching, timestamp-based)</li>
                        <li style={{ marginBottom: '0.5rem' }}>✓ Multi-node synchronization</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
