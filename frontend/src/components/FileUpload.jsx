import React, {
    useState,
    useRef,
    useEffect,
} from "react";

import { useNode } from "../hooks/useNode";

// ======================================================
// FileUpload
//
// Dùng api từ NodeContext — không còn apiService.setNode()
// Node được xác định 1 lần duy nhất từ NodeProvider cha
// ======================================================

const FileUpload = ({
    onUploadSuccess,
    objectIdProp = "",
    baseVersion = null,
    setBaseVersion,
    selectedBranch = "main",
    setSelectedBranch,
}) => {

    const { currentNode, api } = useNode();

    const [file, setFile] = useState(null);
    const [objectId, setObjectId] = useState(objectIdProp || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [availableBranches, setAvailableBranches] = useState(["main"]);

    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Sync objectId with objectIdProp from parent
    useEffect(() => {
        if (objectIdProp) {
            setObjectId(objectIdProp);
        }
    }, [objectIdProp]);

    // Load available branches for autocomplete
    useEffect(() => {
        const loadBranches = async () => {
            if (!objectId || !api) return;
            try {
                const response = await api.getBranches(objectId);
                const resData = response.data;
                const list = resData?.data || (Array.isArray(resData) ? resData : []);
                if (Array.isArray(list)) {
                    setAvailableBranches(list);
                }
            } catch (err) {
                console.error("Failed to load branches in FileUpload:", err);
            }
        };
        loadBranches();
    }, [objectId, api]);

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
            // Gửi parentVersion (baseVersion) và branchName (selectedBranch) theo yêu cầu của user
            const response = await api.uploadGeometry({
                objectId,
                file,
                parentVersion: baseVersion,
                branchName: selectedBranch
            });

            setSuccess(
                `✓ File uploaded successfully to ${currentNode}! Version: ${response.data.versionNumber}`
            );

            setFile(null);
            
            // Clear baseVersion after success (optional/good practice in CAD workflow)
            if (setBaseVersion) {
                setBaseVersion(null);
            }

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

            <div className="form-group" style={{ display: "flex", gap: "16px", marginTop: "1rem" }}>
                <div style={{ flex: 1 }}>
                    <label>Target Branch</label>
                    <input
                        type="text"
                        placeholder="main"
                        value={selectedBranch || ""}
                        onChange={(e) => {
                            if (setSelectedBranch) setSelectedBranch(e.target.value);
                        }}
                        disabled={loading}
                        list="available-branches"
                    />
                    <datalist id="available-branches">
                        {availableBranches.map((br) => (
                            <option key={br} value={br} />
                        ))}
                    </datalist>
                </div>
                <div style={{ flex: 1 }}>
                    <label>Parent Version (Base)</label>
                    <input
                        type="text"
                        placeholder="e.g., v1_A (empty for first)"
                        value={baseVersion || ""}
                        onChange={(e) => {
                            if (setBaseVersion) setBaseVersion(e.target.value || null);
                        }}
                        disabled={loading}
                    />
                </div>
            </div>

            <div
                ref={dropZoneRef}
                className="upload-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: "1.5rem" }}
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
                style={{ marginTop: "1.5rem", width: "100%" }}
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