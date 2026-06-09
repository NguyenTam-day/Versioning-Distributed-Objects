import React, {
    useState,
    useEffect,
    useCallback,
} from "react";

import { useNode } from "../hooks/useNode";
import VersionDAG from "./VersionDAG";

// ======================================================
// VersionHistory
//
// Dùng api từ NodeContext — hiển thị danh sách các phiên bản
// và đồ thị DAG (VersionDAG) cho mô hình CAD.
// Cho phép chọn phiên bản cơ sở (baseVersion).
// ======================================================

const VersionHistory = ({
    objectId,
    onDiffSelect,
    onVersionSelect,
    baseVersion,
    setBaseVersion,
}) => {

    const { currentNode, api } = useNode();

    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadingVersion, setDownloadingVersion] = useState(null);

    // ─── Conflict download warning state ──────────────
    const [conflictDialog, setConflictDialog] = useState(null);
    // conflictDialog = { objectId, versionNumber, branchName, blobUrl, filename } | null

    // ─── Load versions history ─────────────────────────

    const loadVersions = useCallback(async () => {

        // QUAN TRỌNG:
        // objectId rỗng thì clear state luôn
        if (!objectId) {
            setVersions([]);
            return;
        }

        setLoading(true);
        setError("");

        try {

            // Lấy lịch sử version từ backend
            const response = await api.getHistory(objectId);

            // Parse an toàn
            const historyList = Array.isArray(response.data?.data)
                ? response.data.data
                : [];

            // Sort để DAG render đúng
            const sortedHistory = [...historyList].sort(
                (a, b) => a.versionNumber - b.versionNumber
            );

            // QUAN TRỌNG:
            // replace hoàn toàn state cũ
            setVersions(sortedHistory);

        } catch (err) {

            console.error(err);

            // QUAN TRỌNG:
            // clear stale state khi API fail
            setVersions([]);

            setError(
                `Failed to load version history: ${err.response?.data?.message || err.message
                }`
            );

        } finally {

            setLoading(false);

        }

    }, [objectId, api]);

    // ─── Download handler (reads headers, shows warning) ──

    const handleDownload = useCallback(async (objectId, versionNumber, branchName, versionName) => {
        setDownloadingVersion(versionName);
        try {
            const url = api.getDownloadUrl(objectId, versionNumber, branchName);
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }

            const isConflict = res.headers.get("X-Conflict-Warning") === "true";
            const actualBranchName  = res.headers.get("X-Conflict-Branch") || branchName || "conflict";

            // Extract filename from Content-Disposition
            const cd = res.headers.get("Content-Disposition") || "";
            const nameMatch = cd.match(/filename="?([^"]+)"?/);
            const filename = nameMatch ? nameMatch[1] : `model_v${versionNumber}.obj`;

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            if (isConflict) {
                // Show confirm dialog before saving
                setConflictDialog({ objectId, versionNumber, branchName: actualBranchName, blobUrl, filename, versionName });
            } else {
                // Download immediately
                triggerDownload(blobUrl, filename);
                localStorage.setItem(`downloaded_version_${objectId}`, versionName);
                if (setBaseVersion) {
                    setBaseVersion(versionName);
                }
            }
        } catch (err) {
            setError(`Download failed: ${err.message}`);
        } finally {
            setDownloadingVersion(null);
        }
    }, [api, setBaseVersion]);

    const triggerDownload = (blobUrl, filename) => {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    };

    // ─── Reload khi objectId đổi ──────────────────────

    useEffect(() => {

        // reset stale versions trước khi load mới
        setVersions([]);

        if (objectId) {
            loadVersions();
        }

    }, [objectId, loadVersions]);



    // ─── Compute branches for DAG ─────────────────────

    const getBranchesMap = () => {

        const branches = {};

        versions.forEach((v) => {

            if (v.branchName && v.versionName) {

                branches[v.branchName] = v.versionName;

            }

        });

        return branches;

    };

    // ─── Render ───────────────────────────────────────

    if (!objectId) {

        return (
            <div className="card">
                <h2>Version History</h2>

                <p style={{ color: "#999" }}>
                    Select object ID first
                </p>
            </div>
        );

    }

    return (

        <div
            className="card"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
            }}
        >

            {/* ─── Conflict Warning Dialog ────────── */}
            {conflictDialog && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.65)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}>
                    <div style={{
                        background: "var(--color-canvas-default, #161b22)",
                        border: "1px solid #f85149",
                        borderRadius: "12px",
                        padding: "28px 32px",
                        maxWidth: "420px",
                        width: "90%",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <span style={{ fontSize: "22px" }}>⚠️</span>
                            <h3 style={{ margin: 0, color: "#f85149", fontSize: "16px" }}>
                                Conflict Version Warning
                            </h3>
                        </div>
                        <p style={{ color: "var(--color-text-primary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "8px" }}>
                            Version <strong style={{ fontFamily: "var(--font-mono)" }}>v{conflictDialog.versionNumber}</strong> has a{" "}
                            <strong style={{ color: "#f85149" }}>CONFLICT</strong> status and lives on branch{" "}
                            <code style={{ background: "rgba(248,81,73,0.15)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                                {conflictDialog.branchName}
                            </code>.
                        </p>
                        <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
                            This file may differ from the accepted main-branch version. Proceed only if you intend to review the conflicting geometry.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                id="conflict-dialog-cancel"
                                onClick={() => {
                                    URL.revokeObjectURL(conflictDialog.blobUrl);
                                    setConflictDialog(null);
                                }}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border-default)",
                                    background: "transparent",
                                    color: "var(--color-text-primary)",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                id="conflict-dialog-confirm"
                                onClick={() => {
                                    triggerDownload(conflictDialog.blobUrl, conflictDialog.filename);
                                    localStorage.setItem(`downloaded_version_${conflictDialog.objectId}`, conflictDialog.versionName);
                                    if (setBaseVersion) {
                                        setBaseVersion(conflictDialog.versionName);
                                    }
                                    setConflictDialog(null);
                                }}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: "#f85149",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                }}
                            >
                                Download Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>

                <h2>
                    Version History & Graph ({currentNode})
                </h2>

                <p
                    style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "13px",
                        marginTop: "4px",
                    }}
                >
                    Click a node in the graph or click the
                    version name in the table to select it
                    as the active <strong>base version</strong>
                    for subsequent uploads.
                </p>

            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {loading ? (

                <div className="loading">

                    <div className="spinner"></div>

                    <p>Loading version history...</p>

                </div>

            ) : versions.length === 0 ? (

                <p style={{ color: "#999" }}>
                    No versions found for{" "}
                    <strong>{objectId}</strong>
                </p>

            ) : (

                <>

                    {/* ─── DAG ───────────────────────── */}

                    <div
                        style={{
                            background:
                                "var(--color-canvas-inset)",
                            padding: "12px",
                            borderRadius:
                                "var(--radius-md)",
                            border:
                                "1px solid var(--color-border-default)",
                        }}
                    >

                        <h3
                            style={{
                                fontSize: "14px",
                                marginBottom: "12px",
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                            }}
                        >

                            <span>
                                Interactive Version Graph
                                (DAG)
                            </span>

                            {baseVersion && (

                                <span
                                    style={{
                                        fontSize: "12px",
                                        color:
                                            "var(--color-success-fg)",
                                    }}
                                >

                                    Active Base:{" "}

                                    <code
                                        style={{
                                            background:
                                                "rgba(63,185,80,0.1)",
                                            padding: "2px 6px",
                                            borderRadius:
                                                "4px",
                                        }}
                                    >
                                        {baseVersion}
                                    </code>

                                </span>

                            )}

                        </h3>

                        <VersionDAG
                            versions={versions}
                            branches={getBranchesMap()}
                            currentVersionId={baseVersion}
                            onVersionSelect={(node) => {

                                const v = node.version;

                                if (v) {

                                    if (setBaseVersion) {
                                        setBaseVersion(
                                            v.versionName
                                        );
                                    }

                                    if (onVersionSelect) {
                                        onVersionSelect(
                                            v.versionNumber
                                        );
                                    }

                                }

                            }}
                            height="350px"
                        />

                    </div>

                    {/* ─── Table ─────────────────────── */}

                    <div style={{ overflowX: "auto" }}>

                        <table className="table">

                            <thead>

                                <tr>
                                    <th>Version Name</th>
                                    <th>Version No.</th>
                                    <th>Commit Message</th>
                                    <th>Parent</th>
                                    <th>Branch</th>
                                    <th>Site ID</th>
                                    <th>Sync Status</th>
                                    <th>Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {[...versions]
                                    .reverse()
                                    .map((v) => {

                                        const isBase =
                                            baseVersion ===
                                            v.versionName;

                                        return (

                                            <tr
                                                key={
                                                    v.id ||
                                                    v.versionName
                                                }
                                                style={
                                                    isBase
                                                        ? {
                                                            background:
                                                                "rgba(63,185,80,0.05)",
                                                        }
                                                        : {}
                                                }
                                            >

                                                <td>

                                                    <button
                                                        onClick={() => {

                                                            if (
                                                                setBaseVersion
                                                            ) {
                                                                setBaseVersion(
                                                                    v.versionName
                                                                );
                                                            }

                                                            if (
                                                                onVersionSelect
                                                            ) {
                                                                onVersionSelect(
                                                                    v.versionNumber
                                                                );
                                                            }

                                                        }}
                                                        style={{
                                                            fontFamily:
                                                                "var(--font-mono)",
                                                            fontWeight:
                                                                "bold",
                                                            color:
                                                                isBase
                                                                    ? "var(--color-success-fg)"
                                                                    : "var(--color-text-link)",
                                                            background:
                                                                "none",
                                                            border:
                                                                "none",
                                                            padding:
                                                                0,
                                                            cursor:
                                                                "pointer",
                                                            textDecoration:
                                                                "underline",
                                                            textAlign:
                                                                "left",
                                                        }}
                                                    >
                                                        {v.versionName}
                                                    </button>

                                                </td>

                                                <td>
                                                    <strong>
                                                        v{
                                                            v.versionNumber
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {v.commitMessage}
                                                </td>

                                                <td>
                                                    <code>
                                                        {v.parentVersion ||
                                                            "—"}
                                                    </code>
                                                </td>

                                                <td>
                                                    {v.branchName ||
                                                        "main"}
                                                </td>

                                                <td>
                                                    {v.siteId}
                                                </td>

                                                <td>
                                                    {v.syncStatus}
                                                </td>

                                                <td>
                                                    <button
                                                        id={`download-btn-${v.versionNumber}-${v.branchName || "main"}`}
                                                        onClick={() => handleDownload(objectId, v.versionNumber, v.branchName, v.versionName)}
                                                        disabled={downloadingVersion === v.versionName}
                                                        style={{
                                                            fontSize: "11px",
                                                            padding: "4px 8px",
                                                            margin: 0,
                                                            cursor: downloadingVersion === v.versionName ? "not-allowed" : "pointer",
                                                            background: v.syncStatus === "CONFLICT" || v.conflicted
                                                                ? "rgba(248,81,73,0.12)"
                                                                : "rgba(255, 255, 255, 0.05)",
                                                            border: v.syncStatus === "CONFLICT" || v.conflicted
                                                                ? "1px solid #f85149"
                                                                : "1px solid var(--color-border-default)",
                                                            borderRadius: "4px",
                                                            color: v.syncStatus === "CONFLICT" || v.conflicted
                                                                ? "#f85149"
                                                                : "var(--color-text-primary)",
                                                            opacity: downloadingVersion === v.versionName ? 0.6 : 1,
                                                            transition: "all 0.2s",
                                                        }}
                                                        title={v.syncStatus === "CONFLICT" || v.conflicted
                                                            ? "⚠️ CONFLICT version — you will be asked to confirm\nDownloading will set this as your base version."
                                                            : "Download as .OBJ file — sets as base version for next upload"}
                                                    >
                                                        {downloadingVersion === v.versionName
                                                            ? "↓ Loading..."
                                                            : v.syncStatus === "CONFLICT" || v.conflicted
                                                                ? "⚠️ Download .OBJ"
                                                                : "Download .OBJ"}
                                                    </button>
                                                </td>



                                            </tr>

                                        );

                                    })}

                            </tbody>

                        </table>

                    </div>



                </>

            )}

        </div>

    );

};

export default VersionHistory;