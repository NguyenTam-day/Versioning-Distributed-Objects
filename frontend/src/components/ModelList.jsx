import React, { useState, useEffect } from 'react';
import { versionServiceNodeA, versionServiceNodeB } from '../services/api';

const ModelList = ({ node = 'A', onModelSelect }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const versionService = node === 'A' ? versionServiceNodeA : versionServiceNodeB;

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await versionService.listModels();
            setModels(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError(`Failed to load models: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2> CAD Models (Node {node})</h2>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading models...</p>
                </div>
            ) : models.length === 0 ? (
                <p style={{ color: '#999' }}>No models found. Upload a new 3D file to create a model.</p>
            ) : (
                <ul className="list">
                    {models.map((model) => (
                        <li
                            key={model.id}
                            className="list-item"
                            style={{
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease',
                            }}
                            onClick={() => onModelSelect && onModelSelect(model.id)}
                        >
                            <div className="list-item-info">
                                <h3> {model.name || model.id}</h3>
                                <p>
                                    ID: {model.id} | Versions: {model.versionCount} | Updated:{' '}
                                    {new Date(model.updatedAt).toLocaleString()}
                                </p>
                            </div>
                            <span className="badge badge-success">View →</span>
                        </li>
                    ))}
                </ul>
            )}

            <button className="btn btn-primary" onClick={loadModels} style={{ marginTop: '1rem' }}>
                 Refresh
            </button>
        </div>
    );
};

export default ModelList;
