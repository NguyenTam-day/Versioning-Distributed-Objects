import React, {
    useState,
    useEffect,
    useCallback,
} from "react";

import { useNode } from "../hooks/useNode";

// ======================================================
// VersionHistory
//
// Dùng api từ NodeContext — không còn apiService.setNode()
// ======================================================

const VersionHistory = ({
    objectId,
    onDiffSelect,
}) => {

    const { currentNode, api } = useNode();

    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedVersions, setSelectedVersions] = useState({
        from: null,
        to: null,
    });

    // ─── Load versions ────────────────────────────────

    const loadVersions = useCallback(async () => {

        if (!objectId) return;

        setLoading(true);
        setError("");

        try {

            // api đã được gắn sẵn với currentNode — không cần setNode
            const response = await api.getAllVersions(objectId);

            setVersions(
                Array.isArray(response.data)
                    ? response.data
                    : [response.data]
            );

        } catch (err) {

            console.error(err);

            setError(
                `Failed to load versions: ${err.message}`
            );

        } finally {
            setLoading(false);
        }

    }, [objectId, api]);

    // Reload khi objectId hoặc node thay đổi
    useEffect(() => {
        if (objectId) {
            loadVersions();
        }
    }, [objectId, loadVersions]);

    // ─── Version selection ────────────────────────────

    const handleVersionSelect = (type, versionNumber) => {
        setSelectedVersions((prev) => ({
            ...prev,
            [type]: prev[type] === versionNumber ? null : versionNumber,
        }));
    };

    const handleCompareDiff = () => {
        if (selectedVersions.from && selectedVersions.to && onDiffSelect) {
            onDiffSelect(selectedVersions.from, selectedVersions.to);
        }
    };

    // ─── Render ───────────────────────────────────────

    if (!objectId) {
        return (
            <div className="card">
                <h2>Version History</h2>
                <p style={{ color: "#999" }}>Select object ID first</p>
            </div>
        );
    }

    return (

        <div className="card">

            <h2>
                Version History ({currentNode})
            </h2>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {loading ? (

                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading versions...</p>
                </div>

            ) : versions.length === 0 ? (

                <p style={{ color: "#999" }}>
                    No versions found for{" "}
                    <strong>{objectId}</strong>
                </p>

            ) : (

                <>

                    <div style={{ overflowX: "auto" }}>

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

                                    <tr key={v.versionNumber}>

                                        <td>
                                            <strong>v{v.versionNumber}</strong>
                                        </td>

                                        <td>{v.name}</td>

                                        <td>
                                            <span className="badge badge-info">
                                                {v.format}
                                            </span>
                                        </td>

                                        <td>{v.vertexCount}</td>

                                        <td>{v.faceCount}</td>

                                        <td>
                                            <div style={{ display: "flex", gap: "0.25rem" }}>

                                                <button
                                                    className={`btn ${
                                                        selectedVersions.from === v.versionNumber
                                                            ? "btn-danger"
                                                            : "btn-secondary"
                                                    }`}
                                                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                                                    onClick={() =>
                                                        handleVersionSelect("from", v.versionNumber)
                                                    }
                                                >
                                                    From
                                                </button>

                                                <button
                                                    className={`btn ${
                                                        selectedVersions.to === v.versionNumber
                                                            ? "btn-success"
                                                            : "btn-secondary"
                                                    }`}
                                                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                                                    onClick={() =>
                                                        handleVersionSelect("to", v.versionNumber)
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
                            style={{ marginTop: "1rem" }}
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