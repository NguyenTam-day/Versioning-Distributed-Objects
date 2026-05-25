import React, {
    useState,
    useRef,
} from "react";

import { useNode } from "../hooks/useNode";

// ======================================================
// FileUpload
//
// Dùng api từ NodeContext — không còn apiService.setNode()
// Node được xác định 1 lần duy nhất từ NodeProvider cha
// ======================================================

const FileUpload = ({ onUploadSuccess }) => {

    const { currentNode, api } = useNode();

    const [file, setFile] = useState(null);
    const [objectId, setObjectId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // ─── Drag & Drop handlers ─────────────────────────

    const handleDragOver = (e) => {
        e.preventDefault();
        dropZoneRef.current?.classList.add("dragover");
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dropZoneRef.current?.classList.remove("dragover");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dropZoneRef.current?.classList.remove("dragover");

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

    // ─── Upload ───────────────────────────────────────

    const handleUpload = async () => {

        if (!file || !objectId.trim()) {
            setError("Please select a file and enter an object ID");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {

            // api instance được tạo sẵn cho currentNode
            // không cần setNode trước khi gọi
            const response = await api.uploadGeometry(objectId, file);

            setSuccess(
                `✓ File uploaded successfully to ${currentNode}! Version: ${response.data.versionNumber}`
            );

            setFile(null);
            setObjectId("");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }

        } catch (err) {

            console.error(err);

            setError(
                `Upload failed: ${
                    err.response?.data?.message || err.message
                }`
            );

        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="card">

            <h2>
                Upload 3D Model{" "}
                ({currentNode})
            </h2>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            <div className="form-group">

                <label>Object ID</label>

                <input
                    type="text"
                    placeholder="cube-model"
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

                <p>Drag & Drop CAD File</p>
                <small>OBJ, STL, STEP, IGES</small>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".obj,.stl,.step,.iges"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

            </div>

            {file && (
                <div style={{ marginTop: "1rem" }}>
                    <p>
                        ✓ Selected:{" "}
                        <strong>{file.name}</strong>
                        {" "}
                        ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                </div>
            )}

            <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={loading || !file || !objectId.trim()}
                style={{ marginTop: "1rem" }}
            >
                {loading
                    ? "⏳ Uploading..."
                    : `Upload to ${currentNode}`}
                {" →"}
            </button>

        </div>
    );
};

export default FileUpload;