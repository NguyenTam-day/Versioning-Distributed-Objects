import React, { useState, useEffect, useMemo } from "react";
import { createNodeApi } from "../services/api";
import ModelViewer3D from "../components/ModelViewer3D";

// ======================================================
// Naive delta utility matching backend DeltaUtil
// ======================================================
function calculateDelta(base, modified) {
    if (!base) base = "";
    if (!modified) modified = "";
    if (base === modified) return { patch: "", sizeBytes: 0 };

    let prefix = 0;
    const minLen = Math.min(base.length(), modified.length());
    while (prefix < minLen && base.charAt(prefix) === modified.charAt(prefix)) {
        prefix++;
    }

    let suffix = 0;
    while (suffix < (base.length() - prefix) && suffix < (modified.length() - prefix)
           && base.charAt(base.length() - 1 - suffix) === modified.charAt(modified.length() - 1 - suffix)) {
        suffix++;
    }

    const removed = base.substring(prefix, base.length() - suffix);
    const added = modified.substring(prefix, modified.length() - suffix);
    const patch = `${prefix}|${removed}|${added}|${suffix}`;
    
    // Size in bytes
    const sizeBytes = new Blob([patch]).size;
    return { patch, sizeBytes };
}

// Convert Geometry3D format to Babylon-compatible ModelViewer3D format
const normalizeGeometryForViewer = (geom) => {
    if (!geom) return null;
    
    // If it's already formatted
    if (geom.objects) return geom;
    
    const vertices = geom.vertices || [];
    const faces = (geom.faces || []).map(f => {
        if (Array.isArray(f)) return f;
        if (f && Array.isArray(f.indices)) return f.indices;
        return [];
    }).filter(f => f.length >= 3);
    
    return {
        objects: [
            {
                id: geom.name || "cad-object",
                type: "mesh",
                vertices: vertices,
                faces: faces,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                color: { r: 88, g: 166, b: 255 } // custom blue
            }
        ]
    };
};

const ComparisonPage = ({ initialParams, clearParams }) => {
    // API instances for both nodes
    const apiA = useMemo(() => createNodeApi("node-a"), []);
    const apiB = useMemo(() => createNodeApi("node-b"), []);

    const [selectedNode, setSelectedNode] = useState("node-a");
    const [objectId, setObjectId] = useState("");
    const [models, setModels] = useState([]);
    const [versions, setVersions] = useState([]);
    
    const [version1, setVersion1] = useState("");
    const [version2, setVersion2] = useState("");

    const [v1Details, setV1Details] = useState(null);
    const [v2Details, setV2Details] = useState(null);
    const [storageAnalysis, setStorageAnalysis] = useState(null);

    const [loading, setLoading] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [error, setError] = useState("");

    const api = selectedNode === "node-a" ? apiA : apiB;

    // Load available models on node change
    useEffect(() => {
        const fetchModels = async () => {
            setLoadingModels(true);
            try {
                const response = await api.listModels();
                const list = response.data?.data || response.data || [];
                setModels(list);
                if (list.length > 0 && !objectId) {
                    setObjectId(list[0].partId);
                }
            } catch (err) {
                console.error("Failed to load models:", err);
                setModels([]);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [selectedNode, api]);

    // Handle initial params redirected from DashboardPage
    useEffect(() => {
        if (initialParams) {
            const { objectId, fromVersion, toVersion, node } = initialParams;
            if (node) {
                setSelectedNode(node === "node-b" ? "node-b" : "node-a");
            }
            if (objectId) {
                setObjectId(objectId);
                setVersion1(fromVersion || "");
                setVersion2(toVersion || "");
                // Trigger auto load versions and compare
                loadVersionsAndCompare(objectId, fromVersion, toVersion);
            }
            if (clearParams) clearParams();
        }
    }, [initialParams]);

    const loadVersionsAndCompare = async (targetObjectId, v1 = null, v2 = null) => {
        const id = targetObjectId || objectId;
        if (!id) return;
        setLoadingVersions(true);
        setError("");
        try {
            const res = await api.getAllVersions(id);
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setVersions(list);

            const activeV1 = v1 || (list.length > 1 ? list[list.length - 2]?.versionNumber : "");
            const activeV2 = v2 || (list.length > 0 ? list[list.length - 1]?.versionNumber : "");
            
            setVersion1(activeV1);
            setVersion2(activeV2);

            if (activeV1 && activeV2) {
                performComparison(id, activeV1, activeV2);
            }
        } catch (err) {
            setError(`Failed to load versions: ${err.message}`);
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleLoadVersions = () => {
        loadVersionsAndCompare(objectId);
    };

    const performComparison = async (targetId, v1, v2) => {
        if (!v1 || !v2) {
            setError("Please select two versions to compare.");
            return;
        }

        setLoading(true);
        setError("");
        setV1Details(null);
        setV2Details(null);
        setStorageAnalysis(null);

        try {
            const [res1, res2] = await Promise.all([
                api.getVersion(targetId, v1),
                api.getVersion(targetId, v2)
            ]);

            const d1 = res1.data?.data || res1.data;
            const d2 = res2.data?.data || res2.data;

            setV1Details(d1);
            setV2Details(d2);

            // Compute storage analysis
            const json1 = d1.jsonRepresentation || JSON.stringify(d1);
            const json2 = d2.jsonRepresentation || JSON.stringify(d2);

            const size1Bytes = new Blob([json1]).size;
            const size2Bytes = new Blob([json2]).size;

            const deltaResult = calculateDelta(json1, json2);

            const totalSnapshotBytes = size1Bytes + size2Bytes;
            const totalDeltaBytes = size1Bytes + deltaResult.sizeBytes;
            const bytesSaved = totalSnapshotBytes - totalDeltaBytes;
            const percentSaved = totalSnapshotBytes > 0 ? (bytesSaved / totalSnapshotBytes) * 100 : 0;

            setStorageAnalysis({
                v1SizeBytes: size1Bytes,
                v2SizeBytes: size2Bytes,
                deltaSizeBytes: deltaResult.sizeBytes,
                totalSnapshotBytes,
                totalDeltaBytes,
                bytesSaved,
                percentSaved
            });

        } catch (err) {
            setError(`Comparison failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = () => {
        performComparison(objectId, version1, version2);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const dm = 2;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    return (
        <div className="container" style={{ marginTop: "2rem", marginBottom: "4rem" }}>
            
            {/* Header section with gradient design */}
            <div className="page-header" style={{ borderBottom: "none", marginBottom: "2rem" }}>
                <h1 style={{ 
                    fontSize: "2.5rem", 
                    fontWeight: 800, 
                    background: "linear-gradient(90deg, #58a6ff 0%, #bc8cf2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.5px"
                }}>
                    Version Comparison & Storage Optimizer
                </h1>
                <p className="page-description" style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem" }}>
                    Analyze changes and database storage footprints between different versions of your 3D geometry.
                </p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: "24px" }}>
                    {error}
                </div>
            )}

            {/* Selection Panel (Glassmorphic) */}
            <div className="card glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", alignItems: "flex-end" }}>
                    
                    {/* Node selector */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Active Node</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                className={`btn ${selectedNode === "node-a" ? "btn-primary" : "btn-secondary"}`}
                                onClick={() => setSelectedNode("node-a")}
                                style={{ flex: 1 }}
                            >
                                <span className="nav-node-indicator" style={{ backgroundColor: "#3fb950", marginRight: "6px" }}></span>
                                Node A
                            </button>
                            <button
                                className={`btn ${selectedNode === "node-b" ? "btn-primary" : "btn-secondary"}`}
                                onClick={() => setSelectedNode("node-b")}
                                style={{ flex: 1 }}
                            >
                                <span className="nav-node-indicator" style={{ backgroundColor: "#58a6ff", marginRight: "6px" }}></span>
                                Node B
                            </button>
                        </div>
                    </div>

                    {/* Model selector dropdown or input fallback */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Model ID</label>
                        {loadingModels ? (
                            <div style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Loading models...</div>
                        ) : models.length > 0 ? (
                            <select
                                value={objectId}
                                onChange={(e) => setObjectId(e.target.value)}
                                style={{ width: "100%" }}
                            >
                                {models.map(m => (
                                    <option key={m.partId} value={m.partId}>{m.partId}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={objectId}
                                onChange={(e) => setObjectId(e.target.value)}
                                placeholder="cube-model"
                            />
                        )}
                    </div>

                    {/* Load button */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleLoadVersions}
                            disabled={!objectId || loadingVersions}
                            style={{ width: "100%", height: "35px" }}
                        >
                            {loadingVersions ? "⏳ Loading..." : "Load Versions"}
                        </button>
                    </div>

                    {/* Compare triggers */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <button
                            className="btn btn-success"
                            onClick={handleCompare}
                            disabled={!version1 || !version2 || loading}
                            style={{ 
                                width: "100%", 
                                height: "35px",
                                background: "linear-gradient(135deg, #238636 0%, #2ea043 100%)",
                                border: "none"
                            }}
                        >
                            {loading ? "⏳ Comparing..." : "Compare & Analyze"}
                        </button>
                    </div>

                </div>

                {/* Dropdowns for Version 1 and Version 2 */}
                {versions.length > 0 && (
                    <div style={{ display: "flex", gap: "24px", marginTop: "20px", borderTop: "1px solid var(--color-border-default)", paddingTop: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>Base Version (V1)</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {versions.map(v => (
                                    <button
                                        key={`v1-${v.versionNumber}`}
                                        className={`btn ${version1 === v.versionNumber ? "btn-primary" : "btn-secondary"} btn-sm`}
                                        onClick={() => setVersion1(v.versionNumber)}
                                    >
                                        v{v.versionNumber}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>Target Version (V2)</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {versions.map(v => (
                                    <button
                                        key={`v2-${v.versionNumber}`}
                                        className={`btn ${version2 === v.versionNumber ? "btn-primary" : "btn-secondary"} btn-sm`}
                                        onClick={() => setVersion2(v.versionNumber)}
                                    >
                                        v{v.versionNumber}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Compare Results Section */}
            {storageAnalysis && v1Details && v2Details && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {/* Storage Footprint Analysis Card */}
                    <div className="card glass-card" style={{ 
                        border: "1px solid rgba(88, 166, 255, 0.4)",
                        background: "rgba(13, 17, 23, 0.75)"
                    }}>
                        <h2 style={{ color: "#58a6ff", borderBottom: "1px solid var(--color-border-default)" }}>
                            Storage Efficiency Analysis
                        </h2>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", marginTop: "16px" }}>
                            <div>
                                <h3 style={{ marginBottom: "12px" }}>Comparison Models</h3>
                                
                                {/* Snapshot progress */}
                                <div style={{ marginBottom: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span><strong>Snapshot Storage Strategy</strong> (Total space for both raw files)</span>
                                        <span className="font-mono">{formatBytes(storageAnalysis.totalSnapshotBytes)}</span>
                                    </div>
                                    <div style={{ 
                                        height: "12px", 
                                        width: "100%", 
                                        background: "var(--color-canvas-inset)", 
                                        borderRadius: "6px",
                                        overflow: "hidden" 
                                    }}>
                                        <div style={{ height: "100%", width: "100%", background: "#f85149" }} />
                                    </div>
                                    <small style={{ color: "var(--color-text-secondary)" }}>
                                        V1 Snapshot ({formatBytes(storageAnalysis.v1SizeBytes)}) + V2 Snapshot ({formatBytes(storageAnalysis.v2SizeBytes)})
                                    </small>
                                </div>

                                {/* Delta progress */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span><strong>Delta Compression Strategy</strong> (Base Snapshot + Increment Delta)</span>
                                        <span className="font-mono">{formatBytes(storageAnalysis.totalDeltaBytes)}</span>
                                    </div>
                                    <div style={{ 
                                        height: "12px", 
                                        width: "100%", 
                                        background: "var(--color-canvas-inset)", 
                                        borderRadius: "6px",
                                        overflow: "hidden" 
                                    }}>
                                        <div style={{ 
                                            height: "100%", 
                                            width: `${(storageAnalysis.totalDeltaBytes / storageAnalysis.totalSnapshotBytes) * 100}%`, 
                                            background: "#3fb950" 
                                        }} />
                                    </div>
                                    <small style={{ color: "var(--color-text-secondary)" }}>
                                        V1 Snapshot ({formatBytes(storageAnalysis.v1SizeBytes)}) + Delta V1→V2 ({formatBytes(storageAnalysis.deltaSizeBytes)})
                                    </small>
                                </div>
                            </div>

                            {/* Efficiency circle / percentage */}
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "center", 
                                justifyContent: "center",
                                background: "rgba(56, 139, 253, 0.08)",
                                border: "1px dashed var(--color-border-default)",
                                borderRadius: "var(--radius-md)",
                                padding: "24px"
                            }}>
                                <div style={{ 
                                    fontSize: "2.8rem", 
                                    fontWeight: 800, 
                                    color: "#3fb950",
                                    lineHeight: 1
                                }}>
                                    {storageAnalysis.percentSaved.toFixed(1)}%
                                </div>
                                <div style={{ 
                                    fontSize: "13px", 
                                    fontWeight: 600, 
                                    color: "var(--color-text-primary)",
                                    marginTop: "8px",
                                    textAlign: "center"
                                }}>
                                    Storage Saved
                                </div>
                                <div style={{ 
                                    fontSize: "11px", 
                                    color: "var(--color-text-secondary)",
                                    marginTop: "4px",
                                    textAlign: "center"
                                }}>
                                    Equivalent to {formatBytes(storageAnalysis.bytesSaved)} freed from database
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata & Geometry details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        
                        {/* Version 1 Details Card */}
                        <div className="card glass-card">
                            <h2 style={{ borderBottom: "1px solid var(--color-border-default)" }}>
                                Version {version1} (Base)
                            </h2>
                            <table className="table" style={{ marginTop: "8px" }}>
                                <tbody>
                                    <tr>
                                        <td><strong>Vertices</strong></td>
                                        <td>{v1Details.vertexCount || (v1Details.vertices?.length) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Faces</strong></td>
                                        <td>{v1Details.faceCount || (v1Details.faces?.length) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Branch</strong></td>
                                        <td>{v1Details.branchName || "main"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Author</strong></td>
                                        <td>{v1Details.author || "system"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Created At</strong></td>
                                        <td>{v1Details.timestamp ? new Date(v1Details.timestamp).toLocaleString() : "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Parent</strong></td>
                                        <td><code>{v1Details.parentVersion || "—"}</code></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Version 2 Details Card */}
                        <div className="card glass-card">
                            <h2 style={{ borderBottom: "1px solid var(--color-border-default)" }}>
                                Version {version2} (Target)
                            </h2>
                            <table className="table" style={{ marginTop: "8px" }}>
                                <tbody>
                                    <tr>
                                        <td><strong>Vertices</strong></td>
                                        <td>{v2Details.vertexCount || (v2Details.vertices?.length) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Faces</strong></td>
                                        <td>{v2Details.faceCount || (v2Details.faces?.length) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Branch</strong></td>
                                        <td>{v2Details.branchName || "main"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Author</strong></td>
                                        <td>{v2Details.author || "system"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Created At</strong></td>
                                        <td>{v2Details.timestamp ? new Date(v2Details.timestamp).toLocaleString() : "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Parent</strong></td>
                                        <td><code>{v2Details.parentVersion || "—"}</code></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>

                    {/* Side-by-side 3D Viewers */}
                    <div className="card glass-card" style={{ padding: "16px" }}>
                        <h2 style={{ marginBottom: "16px", borderBottom: "1px solid var(--color-border-default)" }}>
                            Side-by-Side 3D Preview
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            
                            {/* V1 3D Viewer */}
                            <div>
                                <h3 style={{ marginBottom: "8px", textAlign: "center" }}>Version {version1}</h3>
                                <div style={{ border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                                    <ModelViewer3D 
                                        geometry={normalizeGeometryForViewer(v1Details)} 
                                        height="350px" 
                                    />
                                </div>
                            </div>

                            {/* V2 3D Viewer */}
                            <div>
                                <h3 style={{ marginBottom: "8px", textAlign: "center" }}>Version {version2}</h3>
                                <div style={{ border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                                    <ModelViewer3D 
                                        geometry={normalizeGeometryForViewer(v2Details)} 
                                        height="350px" 
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};

export default ComparisonPage;