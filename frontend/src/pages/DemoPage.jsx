import React, { useState, useEffect } from 'react';
import { createNodeApi } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? '—' : n.toLocaleString());
const fmtBytes = (b) => {
    if (b == null) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(2)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
};
const fmtMs = (ms) => `${ms} ms`;

// ─── Terminal-style log output ─────────────────────────────────────────
const Terminal = ({ lines, loading, title }) => (
    <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(124,77,255,0.25)',
        borderRadius: '10px',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: '0.82rem',
        marginTop: '1rem',
        overflow: 'hidden',
    }}>
        <div style={{
            background: 'rgba(124,77,255,0.12)',
            borderBottom: '1px solid rgba(124,77,255,0.2)',
            padding: '0.4rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#a78bfa',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
        }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca41', display: 'inline-block' }} />
            <span style={{ marginLeft: '0.5rem' }}>{title || 'output'}</span>
        </div>
        <div style={{ padding: '1rem 1.2rem', minHeight: 80, maxHeight: 420, overflowY: 'auto' }}>
            {loading && (
                <div style={{ color: '#a78bfa', animation: 'pulse 1.2s ease-in-out infinite' }}>
                    ⟳ Processing...
                </div>
            )}
            {lines.map((line, i) => (
                <div key={i} style={{ color: line.color || '#e2e8f0', marginBottom: '2px', whiteSpace: 'pre' }}>
                    {line.text}
                </div>
            ))}
        </div>
    </div>
);

// ─── Section Card ──────────────────────────────────────────────────────
const Panel = ({ icon, title, badge, children }) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '1.6rem',
        marginBottom: '1.6rem',
        transition: 'border-color 0.2s',
    }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,77,255,0.4)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
            {badge && (
                <span style={{
                    background: 'rgba(124,77,255,0.2)',
                    color: '#a78bfa',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    border: '1px solid rgba(124,77,255,0.3)',
                    letterSpacing: '0.05em',
                }}>{badge}</span>
            )}
        </div>
        {children}
    </div>
);

// ─── Shared input row ──────────────────────────────────────────────────
const InputRow = ({ children }) => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
        {children}
    </div>
);

const styledInput = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    color: '#e2e8f0',
    padding: '0.5rem 0.9rem',
    fontSize: '0.9rem',
    outline: 'none',
    minWidth: 140,
};

const Btn = ({ onClick, disabled, children, variant = 'primary' }) => {
    const colors = {
        primary: { bg: 'rgba(124,77,255,0.2)', border: 'rgba(124,77,255,0.5)', color: '#c4b5fd', hover: 'rgba(124,77,255,0.35)' },
        success: { bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.4)', color: '#6ee7b7', hover: 'rgba(0,230,118,0.22)' },
        danger:  { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)',  color: '#fca5a5', hover: 'rgba(239,68,68,0.22)' },
    };
    const c = colors[variant] || colors.primary;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.color,
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = c.hover; }}
            onMouseLeave={e => { e.currentTarget.style.background = c.bg; }}
        >{children}</button>
    );
};

// ─── Node selector ─────────────────────────────────────────────────────
const NODE_OPTIONS = ['node-a', 'node-b'];

// ═══════════════════════════════════════════════════════════════════════
// PANEL 1 — View Version Chain
// ═══════════════════════════════════════════════════════════════════════
const VersionChainPanel = () => {
    const [node, setNode] = useState('node-a');
    const [modelId, setModelId] = useState('');
    const [chain, setChain] = useState([]);
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        if (!modelId.trim()) { setLines([{ text: '❌ Enter a Model ID', color: '#f87171' }]); return; }
        setLoading(true); setLines([]); setChain([]);
        try {
            const api = createNodeApi(node);
            const res = await api.getVersionChain(modelId.trim());
            const data = res.data?.data || [];
            setChain(data);
            const out = [];
            out.push({ text: `📦 Model: ${modelId.trim()}  (${node})`, color: '#a78bfa' });
            out.push({ text: `    ${data.length} version(s) found`, color: '#6b7280' });
            out.push({ text: '' });
            data.forEach(v => {
                const isSnap = v.type === 'Snapshot';
                out.push({
                    text: `  ${isSnap ? '🟦' : '🟩'} ${v.versionName.padEnd(10)} [${v.type.padEnd(8)}]  ${fmtBytes(v.storageBytes).padStart(10)}  ← ${v.parentVersion || 'root'}`,
                    color: isSnap ? '#93c5fd' : '#6ee7b7',
                });
            });
            out.push({ text: '' });
            const snaps = data.filter(v => v.type === 'Snapshot').length;
            const deltas = data.filter(v => v.type === 'Delta').length;
            out.push({ text: `  Snapshots: ${snaps}   Deltas: ${deltas}`, color: '#94a3b8' });
            setLines(out);
        } catch (e) {
            setLines([{ text: `❌ Error: ${e.response?.data?.message || e.message}`, color: '#f87171' }]);
        }
        setLoading(false);
    };

    return (
        <Panel icon="🔗" title="View Version Chain" badge="⭐">
            <InputRow>
                <select style={styledInput} value={node} onChange={e => setNode(e.target.value)}>
                    {NODE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input style={{ ...styledInput, width: 180 }} placeholder="Model ID" value={modelId} onChange={e => setModelId(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
                <Btn onClick={run} disabled={loading}>View Chain</Btn>
            </InputRow>

            {/* Visual chain grid */}
            {chain.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '1rem' }}>
                    {chain.map((v, i) => {
                        const isSnap = v.type === 'Snapshot';
                        return (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}>
                                <div style={{
                                    background: isSnap ? 'rgba(59,130,246,0.2)' : 'rgba(0,230,118,0.12)',
                                    border: `1px solid ${isSnap ? 'rgba(59,130,246,0.5)' : 'rgba(0,230,118,0.4)'}`,
                                    borderRadius: '8px',
                                    padding: '4px 8px',
                                    fontSize: '0.7rem',
                                    color: isSnap ? '#93c5fd' : '#6ee7b7',
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    textAlign: 'center',
                                    minWidth: 60,
                                }}>
                                    {v.versionName}<br />
                                    <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 400 }}>
                                        {isSnap ? '📷 Snap' : '⚡ Delta'}
                                    </span>
                                </div>
                                {i < chain.length - 1 && (
                                    <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>↓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Terminal lines={lines} loading={loading} title="version-chain.log" />
        </Panel>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// PANEL 2 — Restore Version
// ═══════════════════════════════════════════════════════════════════════
const RestoreVersionPanel = () => {
    const [node, setNode] = useState('node-a');
    const [modelId, setModelId] = useState('');
    const [version, setVersion] = useState('');
    const [lines, setLines] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        if (!modelId.trim() || !version.trim()) { setLines([{ text: '❌ Enter Model ID and version number', color: '#f87171' }]); return; }
        setLoading(true); setLines([]); setSteps([]);
        try {
            const api = createNodeApi(node);
            const res = await api.restoreVersion(modelId.trim(), parseInt(version));
            const d = res.data?.data;
            setSteps(d?.restoreSteps || []);
            const out = [];
            out.push({ text: `▶ Restoring ${d.targetVersionName} on ${node}`, color: '#a78bfa' });
            out.push({ text: '' });
            out.push({ text: `  Found nearest snapshot: ${d.baseSnapshot || 'N/A'}`, color: '#fbbf24' });
            out.push({ text: '' });
            if (d.deltaStepsApplied > 0) {
                out.push({ text: '  Applying Deltas:', color: '#94a3b8' });
                (d.restoreSteps || []).filter(s => s.action === 'APPLY_DELTA').forEach(s => {
                    out.push({ text: `    → ${s.versionName}  (${fmtBytes(s.storageBytes)})`, color: '#6ee7b7' });
                });
            } else {
                out.push({ text: '  Version is a snapshot — no deltas needed.', color: '#6ee7b7' });
            }
            out.push({ text: '' });
            out.push({ text: `  Restore completed ✓`, color: '#34d399' });
            out.push({ text: `  Vertices: ${fmt(d.vertexCount)}   Faces: ${fmt(d.faceCount)}`, color: '#94a3b8' });
            out.push({ text: `  Delta chain time: ${fmtMs(d.restoreTimeMs)}   Snapshot-only: ${fmtMs(d.snapshotOnlyTimeMs)}`, color: '#94a3b8' });
            setLines(out);
        } catch (e) {
            setLines([{ text: `❌ Error: ${e.response?.data?.message || e.message}`, color: '#f87171' }]);
        }
        setLoading(false);
    };

    return (
        <Panel icon="⏪" title="Restore Version" badge="⭐⭐⭐ Most Important">
            <InputRow>
                <select style={styledInput} value={node} onChange={e => setNode(e.target.value)}>
                    {NODE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input style={{ ...styledInput, width: 180 }} placeholder="Model ID" value={modelId} onChange={e => setModelId(e.target.value)} />
                <input style={{ ...styledInput, width: 100 }} placeholder="Version #" type="number" min={1} value={version} onChange={e => setVersion(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
                <Btn onClick={run} disabled={loading} variant="success">Restore</Btn>
            </InputRow>
            <Terminal lines={lines} loading={loading} title="restore.log" />
        </Panel>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// PANEL 3 — Show Restore Steps (visual flowchart)
// ═══════════════════════════════════════════════════════════════════════
const RestoreStepsPanel = () => {
    const [node, setNode] = useState('node-a');
    const [modelId, setModelId] = useState('');
    const [version, setVersion] = useState('');
    const [steps, setSteps] = useState([]);
    const [targetName, setTargetName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const run = async () => {
        if (!modelId.trim() || !version.trim()) { setError('Enter Model ID and version number'); return; }
        setLoading(true); setSteps([]); setError('');
        try {
            const api = createNodeApi(node);
            const res = await api.restoreVersion(modelId.trim(), parseInt(version));
            const d = res.data?.data;
            setSteps(d?.restoreSteps || []);
            setTargetName(d?.targetVersionName || '');
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        }
        setLoading(false);
    };

    return (
        <Panel icon="📋" title="Show Restore Steps">
            <InputRow>
                <select style={styledInput} value={node} onChange={e => setNode(e.target.value)}>
                    {NODE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input style={{ ...styledInput, width: 180 }} placeholder="Model ID" value={modelId} onChange={e => setModelId(e.target.value)} />
                <input style={{ ...styledInput, width: 100 }} placeholder="Version #" type="number" min={1} value={version} onChange={e => setVersion(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
                <Btn onClick={run} disabled={loading}>Show Steps</Btn>
            </InputRow>

            {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>❌ {error}</div>}
            {loading && <div style={{ color: '#a78bfa', marginTop: '1rem' }}>⟳ Computing restore path...</div>}

            {steps.length > 0 && (
                <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                    {steps.map((s, i) => {
                        const isSnap = s.action === 'LOAD_SNAPSHOT';
                        return (
                            <React.Fragment key={i}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: isSnap ? 'rgba(59,130,246,0.12)' : 'rgba(0,230,118,0.08)',
                                    border: `1px solid ${isSnap ? 'rgba(59,130,246,0.35)' : 'rgba(0,230,118,0.3)'}`,
                                    borderRadius: '10px',
                                    padding: '0.6rem 1.1rem',
                                    minWidth: 320,
                                }}>
                                    <span style={{ fontSize: '1.1rem' }}>{isSnap ? '📷' : '⚡'}</span>
                                    <div>
                                        <div style={{ color: isSnap ? '#93c5fd' : '#6ee7b7', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                            {isSnap ? 'Load Snapshot' : 'Apply Delta'} — {s.versionName}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                            {fmtBytes(s.storageBytes)} stored
                                        </div>
                                    </div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div style={{ paddingLeft: 20, color: '#6b7280', fontSize: '1.2rem', lineHeight: 1.1 }}>↓</div>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {/* Final output */}
                    <div style={{ paddingLeft: 20, color: '#6b7280', fontSize: '1.2rem', lineHeight: 1.1 }}>↓</div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.35)',
                        borderRadius: '10px', padding: '0.6rem 1.1rem', minWidth: 320,
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>🎯</span>
                        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>
                            Geometry {targetName} — Restored ✓
                        </div>
                    </div>
                </div>
            )}
        </Panel>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// PANEL 4 — Benchmark
// ═══════════════════════════════════════════════════════════════════════
const BenchmarkPanel = () => {
    const [node, setNode] = useState('node-a');
    const [modelId, setModelId] = useState('');
    const [version, setVersion] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lines, setLines] = useState([]);

    const run = async () => {
        if (!modelId.trim() || !version.trim()) { setLines([{ text: '❌ Enter Model ID and version number', color: '#f87171' }]); return; }
        setLoading(true); setLines([]); setResult(null);
        try {
            const api = createNodeApi(node);
            const res = await api.benchmarkVersion(modelId.trim(), parseInt(version));
            const d = res.data?.data;
            setResult(d);
            const savedPct = d.snapshotSizeBytes > 0
                ? (100 * (1 - d.totalStorageBytes / (d.snapshotSizeBytes * (1 + d.deltaCount)))).toFixed(1)
                : 0;
            const out = [];
            out.push({ text: `⚡ Benchmark: ${modelId.trim()} → v${d.targetVersionNumber}  (${node})`, color: '#a78bfa' });
            out.push({ text: '' });
            out.push({ text: '  ─── Storage Comparison ────────────────────────', color: '#475569' });
            out.push({ text: `  Snapshot (base)  : ${fmtBytes(d.snapshotSizeBytes).padStart(10)}`, color: '#93c5fd' });
            out.push({ text: `  Delta chain total: ${fmtBytes(d.deltaTotalBytes).padStart(10)}  (${d.deltaCount} delta(s))`, color: '#6ee7b7' });
            out.push({ text: `  Total stored     : ${fmtBytes(d.totalStorageBytes).padStart(10)}`, color: '#e2e8f0' });
            out.push({ text: `  If all snapshots : ${fmtBytes(d.snapshotSizeBytes * (1 + d.deltaCount)).padStart(10)}`, color: '#f87171' });
            out.push({ text: `  Saved            : ${fmtBytes(d.storageSavedBytes).padStart(10)}  (${savedPct}% reduction)`, color: '#34d399' });
            out.push({ text: '' });
            out.push({ text: '  ─── Restore Time ──────────────────────────────', color: '#475569' });
            out.push({ text: `  Snapshot only   : ${fmtMs(d.snapshotRestoreMs).padStart(8)}`, color: '#93c5fd' });
            out.push({ text: `  Delta chain     : ${fmtMs(d.deltaChainRestoreMs).padStart(8)}`, color: '#6ee7b7' });
            out.push({ text: '' });
            out.push({ text: `  Vertices: ${fmt(d.vertexCount)}   Faces: ${fmt(d.faceCount)}`, color: '#94a3b8' });
            setLines(out);
        } catch (e) {
            setLines([{ text: `❌ Error: ${e.response?.data?.message || e.message}`, color: '#f87171' }]);
        }
        setLoading(false);
    };

    const pct = result && result.snapshotSizeBytes > 0
        ? Math.max(0, Math.min(100, 100 * (1 - result.totalStorageBytes / (result.snapshotSizeBytes * (1 + result.deltaCount)))))
        : 0;

    return (
        <Panel icon="📊" title="Benchmark — Size &amp; Restore Time">
            <InputRow>
                <select style={styledInput} value={node} onChange={e => setNode(e.target.value)}>
                    {NODE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input style={{ ...styledInput, width: 180 }} placeholder="Model ID" value={modelId} onChange={e => setModelId(e.target.value)} />
                <input style={{ ...styledInput, width: 100 }} placeholder="Version #" type="number" min={1} value={version} onChange={e => setVersion(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
                <Btn onClick={run} disabled={loading} variant="success">Run Benchmark</Btn>
            </InputRow>

            {result && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                    {[
                        { label: 'Snapshot Size', value: fmtBytes(result.snapshotSizeBytes), color: '#93c5fd', icon: '📷' },
                        { label: 'Delta Total', value: fmtBytes(result.deltaTotalBytes), color: '#6ee7b7', icon: '⚡' },
                        { label: 'Snapshot-Only Restore', value: fmtMs(result.snapshotRestoreMs), color: '#fbbf24', icon: '⏱' },
                        { label: 'Delta Chain Restore', value: fmtMs(result.deltaChainRestoreMs), color: '#f97316', icon: '⏱' },
                        { label: 'Storage Saved', value: `${pct.toFixed(1)}%`, color: '#34d399', icon: '💾' },
                        { label: 'Deltas Applied', value: result.deltaCount, color: '#c4b5fd', icon: '🔢' },
                    ].map(({ label, value, color, icon }) => (
                        <div key={label} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '0.8rem 1rem',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '1.2rem' }}>{icon}</div>
                            <div style={{ color, fontSize: '1.15rem', fontWeight: 700, fontFamily: 'monospace', marginTop: 4 }}>{value}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.72rem', marginTop: 2 }}>{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {result && result.snapshotSizeBytes > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 6 }}>Storage reduction</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, height: 14, overflow: 'hidden' }}>
                        <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #7c3aed, #34d399)',
                            borderRadius: 20,
                            transition: 'width 0.6s ease',
                        }} />
                    </div>
                    <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: 4 }}>{pct.toFixed(1)}% saved vs full snapshots</div>
                </div>
            )}

            <Terminal lines={lines} loading={loading} title="benchmark.log" />
        </Panel>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// PANEL 5 — Show Delta
// ═══════════════════════════════════════════════════════════════════════
const ShowDeltaPanel = () => {
    const [node, setNode] = useState('node-a');
    const [modelId, setModelId] = useState('');
    const [version, setVersion] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lines, setLines] = useState([]);

    const run = async () => {
        if (!modelId.trim() || !version.trim()) { setLines([{ text: '❌ Enter Model ID and version number', color: '#f87171' }]); return; }
        setLoading(true); setLines([]); setResult(null);
        try {
            const api = createNodeApi(node);
            const res = await api.getVersionDelta(modelId.trim(), parseInt(version));
            const d = res.data?.data;
            setResult(d);
            const out = [];
            out.push({ text: `🔬 Delta View: ${d.versionName}  (${node})`, color: '#a78bfa' });
            out.push({ text: '' });
            if (d.isSnapshot) {
                out.push({ text: '  📷 This is a FULL SNAPSHOT', color: '#93c5fd' });
                out.push({ text: `  All geometry data stored: ${fmt(d.vertexCount)} vertices, ${fmt(d.faceCount)} faces`, color: '#94a3b8' });
                out.push({ text: `  Storage: ${fmtBytes(d.storageBytes)}`, color: '#6b7280' });
            } else {
                out.push({ text: `  ⚡ This is a DELTA — only changes are stored`, color: '#6ee7b7' });
                out.push({ text: `  Storage: ${fmtBytes(d.storageSizeBytes)}`, color: '#6b7280' });
                out.push({ text: '' });
                if (d.vertexChanges && d.vertexChanges.length > 0) {
                    out.push({ text: '  Vertex Changes:', color: '#fbbf24' });
                    d.vertexChanges.forEach(vc => {
                        const nv = vc.newValue;
                        const nvStr = nv ? `[${[nv.x, nv.y, nv.z].map(v => (v ?? '?').toString()).join(', ')}]` : '?';
                        out.push({ text: `    Vertex #${vc.index}  [${vc.type}]  → ${nvStr}`, color: '#6ee7b7' });
                    });
                    out.push({ text: '' });
                }
                if (d.faceChanges && d.faceChanges.length > 0) {
                    out.push({ text: '  Face Changes:', color: '#fbbf24' });
                    d.faceChanges.forEach(fc => {
                        const nv = fc.newValue;
                        const nvStr = nv ? `[${(nv.indices || nv.vertexIndices || Object.values(nv)).join(', ')}]` : '?';
                        out.push({ text: `    Face #${fc.index}  [${fc.type}]  → ${nvStr}`, color: '#6ee7b7' });
                    });
                }
                if ((!d.vertexChanges || d.vertexChanges.length === 0) && (!d.faceChanges || d.faceChanges.length === 0)) {
                    out.push({ text: '  No changes recorded in this delta.', color: '#6b7280' });
                }
            }
            setLines(out);
        } catch (e) {
            setLines([{ text: `❌ Error: ${e.response?.data?.message || e.message}`, color: '#f87171' }]);
        }
        setLoading(false);
    };

    return (
        <Panel icon="🔬" title="Show Delta — Raw Changes">
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.9rem 0' }}>
                Proves the system stores <em>only changes</em>, not the full model, for delta versions.
            </p>
            <InputRow>
                <select style={styledInput} value={node} onChange={e => setNode(e.target.value)}>
                    {NODE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input style={{ ...styledInput, width: 180 }} placeholder="Model ID" value={modelId} onChange={e => setModelId(e.target.value)} />
                <input style={{ ...styledInput, width: 100 }} placeholder="Version #" type="number" min={1} value={version} onChange={e => setVersion(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
                <Btn onClick={run} disabled={loading} variant="primary">Show Delta</Btn>
            </InputRow>

            {/* Visual change cards */}
            {result && !result.isSnapshot && result.faceChanges && result.faceChanges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                    {result.faceChanges.slice(0, 6).map((fc, i) => {
                        const nv = fc.newValue;
                        const indices = nv ? Object.values(nv).filter(v => typeof v === 'number') : [];
                        return (
                            <div key={i} style={{
                                background: 'rgba(0,230,118,0.07)',
                                border: '1px solid rgba(0,230,118,0.25)',
                                borderRadius: '10px',
                                padding: '0.7rem 1rem',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace',
                            }}>
                                <div style={{ color: '#6b7280', marginBottom: 4 }}>Face #{fc.index}</div>
                                <div style={{ color: '#6ee7b7' }}>
                                    [{fc.type}] → [{indices.join(', ')}]
                                </div>
                            </div>
                        );
                    })}
                    {result.vertexChanges && result.vertexChanges.slice(0, 4).map((vc, i) => {
                        const nv = vc.newValue;
                        return (
                            <div key={`v${i}`} style={{
                                background: 'rgba(251,191,36,0.07)',
                                border: '1px solid rgba(251,191,36,0.25)',
                                borderRadius: '10px',
                                padding: '0.7rem 1rem',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace',
                            }}>
                                <div style={{ color: '#6b7280', marginBottom: 4 }}>Vertex #{vc.index}</div>
                                <div style={{ color: '#fbbf24' }}>
                                    [{vc.type}] → {nv ? `(${nv.x?.toFixed(3)}, ${nv.y?.toFixed(3)}, ${nv.z?.toFixed(3)})` : '?'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Terminal lines={lines} loading={loading} title="delta-inspector.log" />
        </Panel>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN DemoPage
// ═══════════════════════════════════════════════════════════════════════
const DemoPage = () => {
    return (
        <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            {/* Page header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #a78bfa, #34d399)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem',
                }}>
                    Algorithm Demo Lab
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                    Live demonstrations connected to real backend nodes. Prove the Snapshot + Delta versioning algorithm works.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {[
                        { icon: '📷', label: 'Snapshot = full geometry stored every 5 versions', color: '#93c5fd' },
                        { icon: '⚡', label: 'Delta = only changes stored (v2–v5, v7–v10, ...)', color: '#6ee7b7' },
                    ].map(({ icon, label, color }) => (
                        <div key={label} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', padding: '0.4rem 0.9rem',
                            fontSize: '0.82rem', color,
                        }}>
                            <span>{icon}</span><span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <VersionChainPanel />
            <RestoreVersionPanel />
            <RestoreStepsPanel />
            <BenchmarkPanel />
            <ShowDeltaPanel />
        </div>
    );
};

export default DemoPage;
