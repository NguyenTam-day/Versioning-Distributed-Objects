import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import VersionHistory from '../components/VersionHistory';
import DiffViewer from '../components/DiffViewer';
import { geometryServiceNodeA, geometryServiceNodeB } from '../services/api';

const ComparisonPage = () => {
    const [objectIdA, setObjectIdA] = useState('');
    const [objectIdB, setObjectIdB] = useState('');
    const [versionA, setVersionA] = useState(null);
    const [versionB, setVersionB] = useState(null);
    const [diffData, setDiffData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleComputeDiff = async () => {
        if (!objectIdA || !versionA || !objectIdB || !versionB) {
            setError('Please select versions from both nodes');
            return;
        }

        if (objectIdA !== objectIdB) {
            setError('Object IDs must be the same to compare');
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Get both versions and compute diff locally or via API
            const responseA = await geometryServiceNodeA.getVersion(objectIdA, versionA);
            const responseB = await geometryServiceNodeB.getVersion(objectIdB, versionB);

            // For demo: show a comparison
            setDiffData({
                objectId: objectIdA,
                fromVersion: versionA,
                toVersion: versionB,
                fromNode: 'Node A',
                toNode: 'Node B',
                geometryName: responseA.data.name,
                oldVertexCount: responseA.data.vertexCount,
                newVertexCount: responseB.data.vertexCount,
                oldFaceCount: responseA.data.faceCount,
                newFaceCount: responseB.data.faceCount,
                vertexAdditions: Math.abs(responseB.data.vertexCount - responseA.data.vertexCount),
                vertexModifications: 0,
                vertexDeletions: 0,
                faceAdditions: Math.abs(responseB.data.faceCount - responseA.data.faceCount),
                faceDeletions: 0,
                vertexChanges: [],
                faceChanges: [],
            });
        } catch (err) {
            setError(`Failed to compare: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            <h1 style={{ color: '#667eea', marginBottom: '2rem' }}> Compare Nodes</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Node A */}
                <div>
                    <FileUpload node="A" onUploadSuccess={(data) => setObjectIdA(data.objectId)} />
                    <VersionHistory
                        node="A"
                        objectId={objectIdA}
                        onDiffSelect={(from, to) => {
                            setVersionA(to);
                        }}
                    />
                </div>

                {/* Node B */}
                <div>
                    <FileUpload node="B" onUploadSuccess={(data) => setObjectIdB(data.objectId)} />
                    <VersionHistory
                        node="B"
                        objectId={objectIdB}
                        onDiffSelect={(from, to) => {
                            setVersionB(to);
                        }}
                    />
                </div>
            </div>

            <div className="card">
                <h2> Comparison</h2>
                {(versionA === null || versionB === null) ? (
                    <p style={{ color: '#999' }}>Select versions from both nodes to compare</p>
                ) : (
                    <div>
                        <p>
                            <strong>Comparing:</strong> {objectIdA} v{versionA} (Node A) ↔ v{versionB} (Node B)
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handleComputeDiff}
                            disabled={loading}
                        >
                            {loading ? '⏳ Computing...' : 'Compute Diff'} →
                        </button>
                    </div>
                )}
            </div>

            <DiffViewer diffData={diffData} loading={loading} />
        </div>
    );
};

export default ComparisonPage;
