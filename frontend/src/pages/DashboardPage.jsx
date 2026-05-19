import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import VersionHistory from '../components/VersionHistory';
import DiffViewer from '../components/DiffViewer';
import GeometryViewer from '../components/GeometryViewer';
import ConflictResolver from '../components/ConflictResolver';
import { geometryServiceNodeA } from '../services/api';

const DashboardPage = ({ node = 'A' }) => {
    const [objectId, setObjectId] = useState('');
    const [diffData, setDiffData] = useState(null);
    const [selectedGeometry, setSelectedGeometry] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('upload');

    const geometryService = node === 'A' ? geometryServiceNodeA : geometryServiceNodeA;

    const handleUploadSuccess = (data) => {
        setObjectId(data.objectId);
        setSelectedGeometry(data.jsonRepresentation);
    };

    const handleDiffVersions = async (fromVersion, toVersion) => {
        setLoading(true);
        setError('');
        setDiffData(null);
        try {
            const response = await geometryService.diffVersions(objectId, fromVersion, toVersion);
            setDiffData(response.data);
            setActiveTab('diff');
        } catch (err) {
            setError(`Failed to compute diff: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVersionSelect = async (versionNumber) => {
        try {
            const response = await geometryService.getVersion(objectId, versionNumber);
            setSelectedGeometry(response.data.jsonRepresentation);
        } catch (err) {
            setError(`Failed to load version: ${err.message}`);
        }
    };

    return (
        <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                     Upload
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                     History
                </button>
                <button
                    className={`tab ${activeTab === 'diff' ? 'active' : ''}`}
                    onClick={() => setActiveTab('diff')}
                >
                     Diff
                </button>
                <button
                    className={`tab ${activeTab === 'viewer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('viewer')}
                >
                     Viewer
                </button>
                <button
                    className={`tab ${activeTab === 'conflicts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('conflicts')}
                >
                    ⚠️ Conflicts
                </button>
            </div>

            {activeTab === 'upload' && <FileUpload node={node === 'A' ? 'A' : 'B'} onUploadSuccess={handleUploadSuccess} />}

            {activeTab === 'history' && (
                <>
                    <div className="card">
                        <h2> Select Object</h2>
                        <div className="form-group">
                            <label>Object ID (or paste from upload)</label>
                            <input
                                type="text"
                                value={objectId}
                                onChange={(e) => setObjectId(e.target.value)}
                                placeholder="e.g., cube-model"
                            />
                        </div>
                    </div>
                    <VersionHistory
                        node={node === 'A' ? 'A' : 'B'}
                        objectId={objectId}
                        onDiffSelect={(from, to) => {
                            handleDiffVersions(from, to);
                        }}
                    />
                </>
            )}

            {activeTab === 'diff' && (
                <DiffViewer diffData={diffData} loading={loading} error={error} />
            )}

            {activeTab === 'viewer' && (
                <GeometryViewer geometryJson={selectedGeometry} />
            )}

            {activeTab === 'conflicts' && objectId && (
                <ConflictResolver node={node === 'A' ? 'A' : 'B'} modelId={objectId} />
            )}
        </div>
    );
};

export default DashboardPage;
