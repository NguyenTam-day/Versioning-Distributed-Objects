import React, { useState, useRef } from 'react';
import { geometryServiceNodeA, geometryServiceNodeB } from '../services/api';

const FileUpload = ({ node = 'A', onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [objectId, setObjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const geometryService = node === 'A' ? geometryServiceNodeA : geometryServiceNodeB;

    const handleDragOver = (e) => {
        e.preventDefault();
        dropZoneRef.current?.classList.add('dragover');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dropZoneRef.current?.classList.remove('dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dropZoneRef.current?.classList.remove('dragover');
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            setFile(droppedFiles[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !objectId.trim()) {
            setError('Please select a file and enter an object ID');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await geometryService.uploadGeometry(objectId, file);
            setSuccess(`✓ File uploaded successfully! Version: ${response.data.versionNumber}`);
            setFile(null);
            setObjectId('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
        } catch (err) {
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2> Upload 3D Model (Node {node})</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-group">
                <label>Object ID</label>
                <input
                    type="text"
                    placeholder="e.g., cube-model, part-001"
                    value={objectId}
                    onChange={(e) => setObjectId(e.target.value)}
                    disabled={loading}
                />
            </div>

            <div
                ref={dropZoneRef}
                className="upload-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <p> Drag and drop your 3D file here, or click to browse</p>
                <small>Supported formats: OBJ, STL, STEP, IGES (up to 50MB)</small>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".obj,.stl,.step,.iges"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {file && (
                <div style={{ marginTop: '1rem' }}>
                    <p>
                        ✓ Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                </div>
            )}

            <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={loading || !file || !objectId.trim()}
                style={{ marginTop: '1rem' }}
            >
                {loading ? '⏳ Uploading...' : 'Upload'} →
            </button>
        </div>
    );
};

export default FileUpload;
