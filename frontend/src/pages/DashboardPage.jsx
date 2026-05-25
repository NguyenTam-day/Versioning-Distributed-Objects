import React, { useState } from "react";

import FileUpload from "../components/FileUpload";
import VersionHistory from "../components/VersionHistory";
import DiffViewer from "../components/DiffViewer";
import GeometryViewer from "../components/GeometryViewer";
import ConflictResolver from "../components/ConflictResolver";

import { useNode } from "../hooks/useNode";

// ======================================================
// DashboardPage
//
// Node được xác định từ NodeProvider cha (App.jsx).
// Tất cả API calls dùng api từ useNode() — không setNode.
// ======================================================

const DashboardPage = () => {

    const { api } = useNode();

    const [objectId, setObjectId] = useState("");
    const [diffData, setDiffData] = useState(null);
    const [selectedGeometry, setSelectedGeometry] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("upload");

    // ─── Handlers ─────────────────────────────────────

    const handleUploadSuccess = (data) => {
        setObjectId(data.objectId);
        setSelectedGeometry(data.jsonRepresentation);
    };

    const handleDiffVersions = async (fromVersion, toVersion) => {

        setLoading(true);
        setError("");
        setDiffData(null);

        try {

            // api đã được gắn với currentNode từ context
            const response = await api.diffVersions(
                objectId,
                fromVersion,
                toVersion
            );

            setDiffData(response.data);
            setActiveTab("diff");

        } catch (err) {

            console.error(err);
            setError(`Failed to compute diff: ${err.message}`);

        } finally {
            setLoading(false);
        }
    };

    const handleVersionSelect = async (versionNumber) => {

        try {

            const response = await api.getVersion(objectId, versionNumber);

            setSelectedGeometry(response.data.jsonRepresentation);

        } catch (err) {

            console.error(err);
            setError(`Failed to load version: ${err.message}`);

        }
    };

    // ─── Render ───────────────────────────────────────

    return (

        <div
            className="container"
            style={{ marginTop: "2rem", marginBottom: "4rem" }}
        >

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* ===================== */}
            {/* Tabs */}
            {/* ===================== */}

            <div className="tabs">

                <button
                    className={`tab ${activeTab === "upload" ? "active" : ""}`}
                    onClick={() => setActiveTab("upload")}
                >
                    Upload
                </button>

                <button
                    className={`tab ${activeTab === "history" ? "active" : ""}`}
                    onClick={() => setActiveTab("history")}
                >
                    History
                </button>

                <button
                    className={`tab ${activeTab === "diff" ? "active" : ""}`}
                    onClick={() => setActiveTab("diff")}
                >
                    Diff
                </button>

                <button
                    className={`tab ${activeTab === "viewer" ? "active" : ""}`}
                    onClick={() => setActiveTab("viewer")}
                >
                    Viewer
                </button>

                <button
                    className={`tab ${activeTab === "conflicts" ? "active" : ""}`}
                    onClick={() => setActiveTab("conflicts")}
                >
                    ⚠️ Conflicts
                </button>

            </div>

            {/* ===================== */}
            {/* Upload */}
            {/* ===================== */}

            {activeTab === "upload" && (
                <FileUpload onUploadSuccess={handleUploadSuccess} />
            )}

            {/* ===================== */}
            {/* History */}
            {/* ===================== */}

            {activeTab === "history" && (

                <>

                    <div className="card">

                        <h2>Select Object</h2>

                        <div className="form-group">

                            <label>Object ID</label>

                            <input
                                type="text"
                                value={objectId}
                                onChange={(e) => setObjectId(e.target.value)}
                                placeholder="cube-model"
                            />

                        </div>

                    </div>

                    <VersionHistory
                        objectId={objectId}
                        onDiffSelect={handleDiffVersions}
                        onVersionSelect={handleVersionSelect}
                    />

                </>

            )}

            {/* ===================== */}
            {/* Diff */}
            {/* ===================== */}

            {activeTab === "diff" && (
                <DiffViewer
                    diffData={diffData}
                    loading={loading}
                    error={error}
                />
            )}

            {/* ===================== */}
            {/* Viewer */}
            {/* ===================== */}

            {activeTab === "viewer" && (
                <GeometryViewer geometryJson={selectedGeometry} />
            )}

            {/* ===================== */}
            {/* Conflicts */}
            {/* ===================== */}

            {activeTab === "conflicts" && objectId && (
                <ConflictResolver modelId={objectId} />
            )}

        </div>

    );
};

export default DashboardPage;