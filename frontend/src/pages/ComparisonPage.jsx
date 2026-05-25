import React, { useState, useMemo } from "react";

import DiffViewer from "../components/DiffViewer";
import { createNodeApi } from "../services/api";

// ======================================================
// ComparisonPage
//
// Page đặc biệt: cần gọi CẢ HAI nodes đồng thời.
// Không dùng NodeContext — tự tạo 2 api instances riêng.
//
// - apiA: gắn với node-a (cố định)
// - apiB: gắn với node-b (cố định)
// - Promise.all: gọi song song, không race condition
// ======================================================

const ComparisonPage = () => {

    // 2 api instances cố định — không thay đổi trong suốt lifecycle
    const apiA = useMemo(() => createNodeApi("node-a"), []);
    const apiB = useMemo(() => createNodeApi("node-b"), []);

    const [objectIdA, setObjectIdA] = useState("");
    const [objectIdB, setObjectIdB] = useState("");
    const [versionA, setVersionA] = useState(null);
    const [versionB, setVersionB] = useState(null);
    const [diffData, setDiffData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ─── Fetch versions from each node ────────────────

    const [versionsA, setVersionsA] = useState([]);
    const [versionsB, setVersionsB] = useState([]);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);

    const loadVersionsA = async () => {
        if (!objectIdA.trim()) return;
        setLoadingA(true);
        try {
            const res = await apiA.getAllVersions(objectIdA);
            setVersionsA(Array.isArray(res.data) ? res.data : [res.data]);
        } catch (err) {
            console.error("Node A:", err);
            setVersionsA([]);
        } finally {
            setLoadingA(false);
        }
    };

    const loadVersionsB = async () => {
        if (!objectIdB.trim()) return;
        setLoadingB(true);
        try {
            const res = await apiB.getAllVersions(objectIdB);
            setVersionsB(Array.isArray(res.data) ? res.data : [res.data]);
        } catch (err) {
            console.error("Node B:", err);
            setVersionsB([]);
        } finally {
            setLoadingB(false);
        }
    };

    // ─── Compute diff ─────────────────────────────────

    const handleComputeDiff = async () => {

        if (!objectIdA || !versionA || !objectIdB || !versionB) {
            setError("Please select versions from both nodes");
            return;
        }

        if (objectIdA !== objectIdB) {
            setError("Object IDs must match");
            return;
        }

        setLoading(true);
        setError("");

        try {

            // Gọi song song — không race condition
            const [responseA, responseB] = await Promise.all([
                apiA.getVersion(objectIdA, versionA),
                apiB.getVersion(objectIdB, versionB),
            ]);

            setDiffData({
                objectId: objectIdA,
                fromVersion: versionA,
                toVersion: versionB,
                fromNode: "Node A",
                toNode: "Node B",
                geometryName: responseA.data.name,
                oldVertexCount: responseA.data.vertexCount,
                newVertexCount: responseB.data.vertexCount,
                oldFaceCount: responseA.data.faceCount,
                newFaceCount: responseB.data.faceCount,
                vertexAdditions: Math.abs(
                    responseB.data.vertexCount - responseA.data.vertexCount
                ),
                vertexModifications: 0,
                vertexDeletions: 0,
                faceAdditions: Math.abs(
                    responseB.data.faceCount - responseA.data.faceCount
                ),
                faceDeletions: 0,
                vertexChanges: [],
                faceChanges: [],
            });

        } catch (err) {

            console.error(err);
            setError(`Failed to compare: ${err.message}`);

        } finally {
            setLoading(false);
        }
    };

    // ─── Version selector helper ──────────────────────

    const VersionSelector = ({ label, versions, loadingVersions, selected, onSelect }) => (
        <div style={{ marginTop: "1rem" }}>
            <strong>{label}</strong>
            {loadingVersions ? (
                <p style={{ color: "#999", fontSize: "0.9rem" }}>Loading...</p>
            ) : versions.length === 0 ? (
                <p style={{ color: "#999", fontSize: "0.9rem" }}>No versions loaded</p>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {versions.map((v) => (
                        <button
                            key={v.versionNumber}
                            className={`btn ${selected === v.versionNumber ? "btn-primary" : "btn-secondary"}`}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                            onClick={() => onSelect(v.versionNumber)}
                        >
                            v{v.versionNumber}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    // ─── Render ───────────────────────────────────────

    return (

        <div
            className="container"
            style={{ marginTop: "2rem", marginBottom: "4rem" }}
        >

            <h1 style={{ color: "#667eea", marginBottom: "2rem" }}>
                Compare Nodes
            </h1>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2rem",
                    marginBottom: "2rem",
                }}
            >

                {/* ===================== */}
                {/* Node A */}
                {/* ===================== */}

                <div className="card">

                    <h2>Node A</h2>

                    <div className="form-group">
                        <label>Object ID</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                type="text"
                                value={objectIdA}
                                onChange={(e) => setObjectIdA(e.target.value)}
                                placeholder="cube-model"
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={loadVersionsA}
                                disabled={!objectIdA.trim() || loadingA}
                            >
                                Load
                            </button>
                        </div>
                    </div>

                    <VersionSelector
                        label="Select version from Node A:"
                        versions={versionsA}
                        loadingVersions={loadingA}
                        selected={versionA}
                        onSelect={setVersionA}
                    />

                    {versionA && (
                        <p style={{ marginTop: "0.5rem", color: "#667eea" }}>
                            ✓ Selected: v{versionA}
                        </p>
                    )}

                </div>

                {/* ===================== */}
                {/* Node B */}
                {/* ===================== */}

                <div className="card">

                    <h2>Node B</h2>

                    <div className="form-group">
                        <label>Object ID</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                type="text"
                                value={objectIdB}
                                onChange={(e) => setObjectIdB(e.target.value)}
                                placeholder="cube-model"
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={loadVersionsB}
                                disabled={!objectIdB.trim() || loadingB}
                            >
                                Load
                            </button>
                        </div>
                    </div>

                    <VersionSelector
                        label="Select version from Node B:"
                        versions={versionsB}
                        loadingVersions={loadingB}
                        selected={versionB}
                        onSelect={setVersionB}
                    />

                    {versionB && (
                        <p style={{ marginTop: "0.5rem", color: "#667eea" }}>
                            ✓ Selected: v{versionB}
                        </p>
                    )}

                </div>

            </div>

            {/* ===================== */}
            {/* Compare */}
            {/* ===================== */}

            <div className="card">

                <h2>Comparison</h2>

                {(versionA === null || versionB === null) ? (

                    <p style={{ color: "#999" }}>
                        Select versions from both nodes
                    </p>

                ) : (

                    <div>

                        <p>
                            <strong>Comparing:</strong>
                            {" "}
                            {objectIdA} v{versionA} (Node A)
                            {" ↔ "}
                            v{versionB} (Node B)
                        </p>

                        <button
                            className="btn btn-primary"
                            onClick={handleComputeDiff}
                            disabled={loading}
                        >
                            {loading ? "⏳ Computing..." : "Compute Diff"}
                            {" →"}
                        </button>

                    </div>

                )}

            </div>

            <DiffViewer
                diffData={diffData}
                loading={loading}
                error={error}
            />

        </div>

    );
};

export default ComparisonPage;