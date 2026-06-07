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