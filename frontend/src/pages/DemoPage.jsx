import React, { useState, useEffect } from 'react';

const DemoPage = () => {
    const [demoOutput, setDemoOutput] = useState('');
    const [running, setRunning] = useState(false);
    const [activeDemo, setActiveDemo] = useState(null);

    const runDemo = async (demoType) => {
        setRunning(true);
        setDemoOutput('');
        setActiveDemo(demoType);

        try {
            // Simulate demo scenarios
            const output = [];

            if (demoType === 'upload-parse') {
                output.push(' Demo: Upload and Parse 3D Model');
                output.push('=' + '='.repeat(50));
                output.push('');
                output.push('Step 1: User uploads cube-v1.obj (1KB)');
                output.push('✓ File detected: cube-v1.obj');
                output.push('✓ Format: OBJ');
                output.push('');
                output.push('Step 2: Parse and convert to JSON');
                output.push('✓ Parsed 8 vertices');
                output.push('✓ Parsed 6 faces');
                output.push('✓ Generated geometry.json (2.5 KB)');
                output.push('');
                output.push('Step 3: Store in version control');
                output.push('✓ Version 1 created (ID: cube-model-v1)');
                output.push('✓ Metadata stored: timestamp, author, branch: main');
                output.push('');
                output.push('✓ Demo completed successfully!');
            } else if (demoType === 'diff') {
                output.push(' Demo: Geometry Diff Comparison');
                output.push('=' + '='.repeat(50));
                output.push('');
                output.push('Comparing v1 vs v2 of cube-model');
                output.push('');
                output.push('Version 1: 8 vertices, 6 faces');
                output.push('Version 2: 10 vertices, 6 faces');
                output.push('');
                output.push(' Diff Report:');
                output.push('  Vertex Changes:');
                output.push('    + 2 vertices added');
                output.push('    - 0 vertices removed');
                output.push('    ~ 0 vertices modified');
                output.push('');
                output.push('  Face Changes:');
                output.push('    + 0 faces added');
                output.push('    - 0 faces removed');
                output.push('');
                output.push(' Storage Impact:');
                output.push('  Full snapshot (v1): 1.0 KB');
                output.push('  Delta (v1→v2): 0.15 KB (85% smaller!)');
                output.push('');
                output.push('✓ Demo completed successfully!');
            } else if (demoType === 'conflict') {
                output.push(' Demo: Conflict Resolution');
                output.push('=' + '='.repeat(50));
                output.push('');
                output.push('Scenario: Two sites checkout same version');
                output.push('');
                output.push('Site A (Node A):');
                output.push('  - Checkout v2 of cube-model');
                output.push('  - Modify: Add 2 vertices (roundness improvement)');
                output.push('  - Checkin: Create v3 at 2024-01-15 10:30 UTC');
                output.push('');
                output.push('Site B (Node B):');
                output.push('  - Checkout v2 of cube-model');
                output.push('  - Modify: Extend faces for structural strength');
                output.push('  - Checkin: Create v3 at 2024-01-15 10:45 UTC');
                output.push('');
                output.push('⚠️  CONFLICT DETECTED!');
                output.push('  Both sites created v3 with different changes');
                output.push('  Conflicting parents: v2');
                output.push('');
                output.push('✓ Applying BRANCH strategy:');
                output.push('  - Site A version → main branch (HEAD)');
                output.push('  - Site B version → feature/roundness branch');
                output.push('  - Users can manually merge or auto-resolve');
                output.push('');
                output.push('✓ Conflict resolved!');
            } else if (demoType === 'storage') {
                output.push(' Demo: Full Snapshot vs Delta Storage');
                output.push('=' + '='.repeat(50));
                output.push('');
                output.push('Scenario: 10 versions of same model');
                output.push('Each version: +0.5KB user edits (incrementally)');
                output.push('');
                output.push(' Storage Comparison:');
                output.push('');
                output.push('❌ Full Snapshot Strategy:');
                output.push('  v1: 1.0 KB');
                output.push('  v2: 1.05 KB');
                output.push('  v3: 1.10 KB');
                output.push('  v4: 1.15 KB');
                output.push('  v5: 1.20 KB');
                output.push('  v6: 1.25 KB');
                output.push('  v7: 1.30 KB');
                output.push('  v8: 1.35 KB');
                output.push('  v9: 1.40 KB');
                output.push('  v10: 1.45 KB');
                output.push('  ─────────────');
                output.push('  TOTAL: 11.25 KB');
                output.push('');
                output.push('✅ Delta Storage Strategy:');
                output.push('  v1 (snapshot): 1.0 KB');
                output.push('  Δ(v1→v2): 0.10 KB');
                output.push('  Δ(v2→v3): 0.08 KB');
                output.push('  Δ(v3→v4): 0.10 KB');
                output.push('  Δ(v4→v5): 0.12 KB');
                output.push('  Δ(v5→v6): 0.09 KB');
                output.push('  Δ(v6→v7): 0.11 KB');
                output.push('  Δ(v7→v8): 0.08 KB');
                output.push('  Δ(v8→v9): 0.10 KB');
                output.push('  Δ(v9→v10): 0.09 KB');
                output.push('  ─────────────');
                output.push('  TOTAL: 1.87 KB');
                output.push('');
                output.push(' SAVINGS: 11.25 - 1.87 = 9.38 KB (83.4% reduction!)');
                output.push('');
                output.push('With checkpointing every 5 versions:');
                output.push('  - v1 snapshot (1.0 KB)');
                output.push('  - Δ1-5 chain (0.47 KB)');
                output.push('  - v6 snapshot (1.25 KB)');
                output.push('  - Δ6-10 chain (0.48 KB)');
                output.push('  ─────────────');
                output.push('  TOTAL: 3.2 KB (71.6% reduction)');
                output.push('');
                output.push('✓ Demo completed successfully!');
            } else if (demoType === 'sync') {
                output.push(' Demo: Multi-Site Synchronization');
                output.push('=' + '='.repeat(50));
                output.push('');
                output.push('Initial State:');
                output.push('  Node A: cube-model v5 (latest)');
                output.push('  Node B: cube-model v3 (outdated)');
                output.push('');
                output.push('Step 1: Node B detects version mismatch');
                output.push('✓ Node B current: v3');
                output.push('✓ Node A remote: v5');
                output.push('✓ Behind by 2 versions');
                output.push('');
                output.push('Step 2: Pull updates from Node A');
                output.push('Fetching delta (v3→v4)...');
                output.push('✓ Received 0.12 KB delta');
                output.push('✓ Applied v4 (8 verts, 6 faces)');
                output.push('');
                output.push('Fetching delta (v4→v5)...');
                output.push('✓ Received 0.15 KB delta');
                output.push('✓ Applied v5 (10 verts, 6 faces)');
                output.push('');
                output.push('Step 3: Verify consistency');
                output.push('✓ Node A: cube-model v5 - HASH: abc123');
                output.push('✓ Node B: cube-model v5 - HASH: abc123');
                output.push('✓ Content verified identical!');
                output.push('');
                output.push('✓ Sync completed! Both nodes synchronized.');
            }

            setDemoOutput(output.join('\n'));
        } catch (err) {
            setDemoOutput(`❌ Demo failed: ${err.message}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            <h1 style={{ color: '#667eea', marginBottom: '2rem' }}> Interactive Demos</h1>

            <div className="card">
                <h2>Demo Scenarios</h2>
                <p style={{ marginBottom: '2rem', color: '#666' }}>
                    Click on any scenario to see a step-by-step simulation of how the system works.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <button
                        className={`btn ${activeDemo === 'upload-parse' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => runDemo('upload-parse')}
                        disabled={running}
                        style={{ textAlign: 'left', padding: '1rem' }}
                    >
                         Upload &amp; Parse
                        <br />
                        <small>Convert 3D files to JSON</small>
                    </button>
                    <button
                        className={`btn ${activeDemo === 'diff' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => runDemo('diff')}
                        disabled={running}
                        style={{ textAlign: 'left', padding: '1rem' }}
                    >
                         Geometry Diff
                        <br />
                        <small>Compare 2 versions</small>
                    </button>
                    <button
                        className={`btn ${activeDemo === 'conflict' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => runDemo('conflict')}
                        disabled={running}
                        style={{ textAlign: 'left', padding: '1rem' }}
                    >
                        ⚠️ Conflict
                        <br />
                        <small>Resolve conflicts</small>
                    </button>
                    <button
                        className={`btn ${activeDemo === 'storage' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => runDemo('storage')}
                        disabled={running}
                        style={{ textAlign: 'left', padding: '1rem' }}
                    >
                         Storage
                        <br />
                        <small>Delta vs Snapshot</small>
                    </button>
                    <button
                        className={`btn ${activeDemo === 'sync' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => runDemo('sync')}
                        disabled={running}
                        style={{ textAlign: 'left', padding: '1rem' }}
                    >
                         Sync
                        <br />
                        <small>Multi-site sync</small>
                    </button>
                </div>
            </div>

            {demoOutput && (
                <div className="card">
                    <pre
                        style={{
                            background: '#1e1e1e',
                            color: '#00ff00',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            overflowX: 'auto',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            fontFamily: "'Courier New', monospace",
                        }}
                    >
                        {demoOutput}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default DemoPage;
