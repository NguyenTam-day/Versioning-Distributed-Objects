import React, { useState, useEffect } from 'react';
import { geometryServiceNodeA, geometryServiceNodeB } from '../services/api';

const VersionHistory = ({ node = 'A', objectId }) => {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedVersions, setSelectedVersions] = useState({ from: null, to: null });
    const [onDiffSelect, setOnDiffSelect] = useState(null);

    const geometryService = node === 'A' ? geometryServiceNodeA : geometryServiceNodeB;

    useEffect(() => {
        if (objectId) {
            loadVersions();
        }
    }, [objectId]);

    const loadVersions = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await geometryService.getAllVersions(objectId);
            setVersions(Array.isArray(response.data) ? response.data : [response.data]);
        } catch (err) {
            setError(`Failed to load versions: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVersionSelect = (type, versionNumber) => {
        setSelectedVersions((prev) => ({
            ...prev,
            [type]: versionNumber,
        }));
    };

    const handleCompareDiff = () => {
        if (selectedVersions.from && selectedVersions.to && onDiffSelect) {
            onDiffSelect(selectedVersions.from, selectedVersions.to);
        }
    };

    if (!objectId) {
        return (
            <div className="card">
                <h2> Version History</h2>
                <p style={{ color: '#999' }}>Select an object ID first to view its version history</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2> Version History (Node {node})</h2>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading versions...</p>
                </div>
            ) : versions.length === 0 ? (
                <p style={{ color: '#999' }}>
                    No versions found for object: <strong>{objectId}</strong>
                </p>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Version</th>
                                    <th>Name</th>
                                    <th>Format</th>
                                    <th>Vertices</th>
                                    <th>Faces</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {versions.map((v) => (
                                    <tr key={v.versionNumber} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <strong>v{v.versionNumber}</strong>
                                        </td>
                                        <td>{v.name}</td>
                                        <td>
                                            <span className="badge badge-info">{v.format}</span>
                                        </td>
                                        <td>{v.vertexCount}</td>
                                        <td>{v.faceCount}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                    className={`btn ${
                                                        selectedVersions.from === v.versionNumber
                                                            ? 'btn-danger'
                                                            : 'btn-secondary'
                                                    }`}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                    onClick={() =>
                                                        handleVersionSelect(
                                                            'from',
                                                            selectedVersions.from === v.versionNumber ? null : v.versionNumber
                                                        )
                                                    }
                                                >
                                                    From
                                                </button>
                                                <button
                                                    className={`btn ${
                                                        selectedVersions.to === v.versionNumber
                                                            ? 'btn-success'
                                                            : 'btn-secondary'
                                                    }`}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                    onClick={() =>
                                                        handleVersionSelect(
                                                            'to',
                                                            selectedVersions.to === v.versionNumber ? null : v.versionNumber
                                                        )
                                                    }
                                                >
                                                    To
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedVersions.from && selectedVersions.to && (
                        <button
                            className="btn btn-primary"
                            onClick={handleCompareDiff}
                            style={{ marginTop: '1rem' }}
                        >
                             Compare Versions →
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default VersionHistory;
