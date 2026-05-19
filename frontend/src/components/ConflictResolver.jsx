import React, { useState, useEffect } from 'react';
import { conflictServiceNodeA, conflictServiceNodeB } from '../services/api';

const ConflictResolver = ({ node = 'A', modelId }) => {
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedConflict, setSelectedConflict] = useState(null);
    const [strategy, setStrategy] = useState('BRANCH');
    const [resolving, setResolving] = useState(false);

    const conflictService = node === 'A' ? conflictServiceNodeA : conflictServiceNodeB;

    useEffect(() => {
        if (modelId) {
            loadConflicts();
        }
    }, [modelId]);

    const loadConflicts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await conflictService.getConflicts(modelId);
            setConflicts(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            // Conflicts might not exist yet, which is normal
            setConflicts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveConflict = async () => {
        if (!selectedConflict) return;

        setResolving(true);
        setError('');
        try {
            await conflictService.resolveConflict(selectedConflict.id, strategy, {});
            // Reload conflicts after resolution
            loadConflicts();
            setSelectedConflict(null);
        } catch (err) {
            setError(`Failed to resolve conflict: ${err.message}`);
        } finally {
            setResolving(false);
        }
    };

    if (!modelId) {
        return (
            <div className="card">
                <h2>⚠️ Conflict Resolution</h2>
                <p style={{ color: '#999' }}>Select a model to view its conflicts</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2>⚠️ Conflict Resolution (Node {node})</h2>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading conflicts...</p>
                </div>
            ) : conflicts.length === 0 ? (
                <div className="alert alert-success">✓ No conflicts found. Model is in sync!</div>
            ) : (
                <>
                    <ul className="list">
                        {conflicts.map((conflict) => (
                            <li
                                key={conflict.id}
                                className="list-item"
                                onClick={() => setSelectedConflict(conflict)}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: selectedConflict?.id === conflict.id ? '#ffe5e5' : undefined,
                                    borderRadius: '4px',
                                }}
                            >
                                <div className="list-item-info">
                                    <h3>Conflict: {conflict.type}</h3>
                                    <p>
                                        Between v{conflict.versionA} and v{conflict.versionB} | Type:{' '}
                                        {conflict.conflictType}
                                    </p>
                                </div>
                                <span className="badge badge-danger">Needs Resolution</span>
                            </li>
                        ))}
                    </ul>

                    {selectedConflict && (
                        <div
                            style={{
                                marginTop: '2rem',
                                padding: '1.5rem',
                                backgroundColor: '#fff3e0',
                                borderRadius: '8px',
                                border: '2px solid #f39c12',
                            }}
                        >
                            <h3>Resolve Conflict</h3>
                            <p>Conflict Type: {selectedConflict.conflictType}</p>

                            <div className="form-group">
                                <label>Resolution Strategy</label>
                                <select
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    disabled={resolving}
                                >
                                    <option value="BRANCH">Keep Both (Create Branch)</option>
                                    <option value="TIMESTAMP">Use Latest (Timestamp-based)</option>
                                    <option value="VERSION_A">Use Version A</option>
                                    <option value="VERSION_B">Use Version B</option>
                                </select>
                            </div>

                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                {strategy === 'BRANCH' && (
                                    <p>✓ Both versions will be kept as separate branches</p>
                                )}
                                {strategy === 'TIMESTAMP' && (
                                    <p>✓ Latest version (by timestamp) will be used</p>
                                )}
                                {strategy === 'VERSION_A' && <p>✓ Version A will be kept</p>}
                                {strategy === 'VERSION_B' && <p>✓ Version B will be kept</p>}
                            </div>

                            <button
                                className="btn btn-success"
                                onClick={handleResolveConflict}
                                disabled={resolving}
                            >
                                {resolving ? '⏳ Resolving...' : 'Resolve Conflict'} →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ConflictResolver;
