import React, { useState, useCallback, useEffect } from "react";

import FileUpload from "../components/FileUpload";
import VersionHistory from "../components/VersionHistory";
import GeometryViewer from "../components/GeometryViewer";
import BranchSelector from "../components/BranchSelector";

import { useNode } from "../hooks/useNode";

// ======================================================
// DashboardPage — GitHub repo-style layout
//
// Checkout flow:
//   1. User enters objectId
//   2. Clicks Checkout → api.checkout(objectId, branch)
//   3. checkedOutVersion stored in state (parentVersion, branchName, siteId, etc.)
//   4. FileUpload receives parentVersion from checked-out state
//
// Priority display:  parentVersion | branchName | siteId | syncStatus | version graph
// ======================================================

// ── SVG Icons ──────────────────────────────────────────

const GitBranchIcon = () => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
    </svg>
);

const RepoIcon = () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" />
    </svg>
);

const SyncIcon = () => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
);

const CheckoutIcon = () => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
    </svg>
);

// ── Checkout Info Panel ─────────────────────────────────

const CheckoutPanel = ({ version, baseVersion, onClear }) => {
    if (!version && !baseVersion) return null;

    const displayVersion = version || {};

    return (
        <div
            style={{
                padding: "12px 16px",
                background: "var(--color-canvas-subtle)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                marginBottom: "16px",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
                fontSize: "13px",
            }}
        >
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                HEAD
            </span>

            {/* parentVersion */}
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>parent:</span>
                <code
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: displayVersion.parentVersion
                            ? "var(--color-text-link)"
                            : "var(--color-text-muted)",
                        background: "var(--color-canvas-inset)",
                        padding: "1px 6px",
                        borderRadius: 4,
                    }}
                >
                    {displayVersion.parentVersion || "—"}
                </code>
            </span>

            {/* branchName */}
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-secondary)" }}>
                <GitBranchIcon />
                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {displayVersion.branchName || "main"}
                </span>
            </span>

            {/* siteId */}
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>site:</span>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-primary)" }}>
                    {displayVersion.siteId || "—"}
                </code>
            </span>

            {/* syncStatus */}
            {displayVersion.syncStatus && (
                <span
                    className={`sync-status-badge ${displayVersion.syncStatus === "SYNCED" ? "synced" : "pending"}`}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                    <SyncIcon />
                    {displayVersion.syncStatus}
                </span>
            )}

            {/* baseVersion */}
            <span style={{ color: "var(--color-text-secondary)" }}>
                base version:{" "}
                <strong style={{ color: "var(--color-success-fg)", fontFamily: "var(--font-mono)" }}>
                    {baseVersion || displayVersion.versionName || (displayVersion.versionNumber ? `v${displayVersion.versionNumber}` : "—")}
                </strong>
            </span>

            <button
                className="btn btn-secondary"
                style={{ padding: "3px 10px", fontSize: 12, marginLeft: "auto" }}
                onClick={onClear}
            >
                ✕ Clear checkout
            </button>
        </div>
    );
};

// ── Main Component ──────────────────────────────────────

const DashboardPage = ({ onNavigate }) => {
    const { currentNode, api } = useNode();

    const [objectId, setObjectId]                   = useState("");
    const [objectIdInput, setObjectIdInput]         = useState("");
    const [currentBranch, setCurrentBranch]         = useState("main");
    const [checkedOutVersion, setCheckedOutVersion] = useState(null); // from checkout API
    const [baseVersion, setBaseVersion]             = useState(null); // baseVersion state
    const [selectedGeometry, setSelectedGeometry]   = useState(null);
    const [loading, setLoading]                     = useState(false);
    const [checkoutLoading, setCheckoutLoading]     = useState(false);
    const [error, setError]                         = useState("");
    const [activeTab, setActiveTab]                 = useState("upload");
    const [syncEnabled, setSyncEnabled]             = useState(true);

    // ─── Sync Toggle Logic ─────────────────────────────

    const fetchSyncStatus = useCallback(async () => {
        try {
            const response = await api.getSyncStatus();
            setSyncEnabled(response.data?.syncEnabled ?? true);
        } catch (err) {
            console.error("Failed to fetch sync status", err);
        }
    }, [api]);

    useEffect(() => {
        fetchSyncStatus();
    }, [fetchSyncStatus]);

    const handleToggleSync = async () => {
        try {
            if (syncEnabled) {
                await api.disableSync();
                setSyncEnabled(false);
            } else {
                await api.enableSync();
                setSyncEnabled(true);
            }
        } catch (err) {
            setError(`Failed to toggle sync: ${err.message}`);
        }
    };

    // ─── Checkout ──────────────────────────────────────

    const handleCheckout = async () => {
        const id = objectIdInput.trim();
        if (!id) return;

        setCheckoutLoading(true);
        setError("");
        setCheckedOutVersion(null);
        setBaseVersion(null);

        try {
            const response = await api.checkout(id, currentBranch);
            const version = response.data?.data || response.data;
            setObjectId(id);
            setCheckedOutVersion(version);
            setBaseVersion(version.versionName || `v${version.versionNumber}`);
            setActiveTab("history");
        } catch (err) {
            // If no version found, still set objectId for first upload
            setObjectId(id);
            setCheckedOutVersion(null);
            setBaseVersion(null);
            setError(`No existing version on branch "${currentBranch}" — this is the first upload.`);
            setActiveTab("upload");
        } finally {
            setCheckoutLoading(false);
        }
    };

    // ─── Upload success ────────────────────────────────

    const handleUploadSuccess = useCallback((data) => {
        setObjectId(data.objectId || objectId);
        setSelectedGeometry(data.jsonRepresentation);
        setCheckedOutVersion(null);
        setBaseVersion(null); // clear after successful commit
    }, [objectId]);



    // ─── Version select ────────────────────────────────

    const handleVersionSelect = async (versionNumber) => {
        try {
            const response = await api.getVersion(objectId, versionNumber);
            setSelectedGeometry(response.data.jsonRepresentation);
        } catch (err) {
            setError(`Failed to load version: ${err.message}`);
        }
    };

    // ─── Branch switch ─────────────────────────────────

    const handleBranchSelect = (branchName) => {
        setCurrentBranch(branchName);
        setCheckedOutVersion(null);
        setBaseVersion(null);
    };

    // ─── Tabs definition ───────────────────────────────

    const TABS = [
        { id: "upload",    label: "Upload" },
        { id: "history",   label: "History" },
        { id: "viewer",    label: "Viewer" },
    ];

    // ─── Render ────────────────────────────────────────

    return (
        <div className="container" style={{ marginTop: "24px", marginBottom: "48px" }}>

            {/* ─── Repo Header ─────────────────────────── */}

            <div className="repo-header">
                <div className="repo-title">
                    <span className="repo-icon"><RepoIcon /></span>
                    <span className="repo-owner">{currentNode}</span>
                    <span className="repo-separator">/</span>
                    <span className="repo-name">
                        {objectId || <span style={{ color: "var(--color-text-muted)" }}>no model selected</span>}
                    </span>
                    <span className="repo-badge">distributed</span>
                </div>

                <div className="repo-sync-actions">
                    <button
                        className={`btn ${syncEnabled ? 'btn-success' : 'btn-danger'}`}
                        onClick={handleToggleSync}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                        title={syncEnabled ? "Click to disable synchronization with other node" : "Click to enable synchronization with other node"}
                    >
                        <SyncIcon />
                        {syncEnabled ? "Sync: On" : "Sync: Off"}
                    </button>

                    {objectId && (
                        <BranchSelector
                            modelId={objectId}
                            api={api}
                            currentBranch={currentBranch}
                            onBranchSelect={handleBranchSelect}
                        />
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleCheckout}
                        disabled={checkoutLoading || !objectIdInput.trim()}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <CheckoutIcon />
                        {checkoutLoading ? "Checking out…" : "Checkout"}
                    </button>
                </div>
            </div>

            {/* ─── Object ID input ─────────────────────── */}

            <div
                className="card"
                style={{ padding: "12px 16px", marginBottom: "16px", display: "flex", gap: 8, alignItems: "center" }}
            >
                <label style={{ color: "var(--color-text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>
                    Model ID
                </label>
                <input
                    type="text"
                    value={objectIdInput}
                    onChange={(e) => setObjectIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                    placeholder="cube-model"
                    style={{ flex: 1 }}
                />
            </div>

            {/* ─── Checkout panel (parentVersion, branch, siteId, syncStatus) */}

            {(checkedOutVersion || baseVersion) && (
                <CheckoutPanel
                    version={checkedOutVersion}
                    baseVersion={baseVersion}
                    onClear={() => {
                        setCheckedOutVersion(null);
                        setBaseVersion(null);
                    }}
                />
            )}

            {/* ─── Error ───────────────────────────────── */}

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {/* ─── Tabs ────────────────────────────────── */}

            <div className="tabs" style={{ marginBottom: 16 }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Upload ──────────────────────────────── */}

            {activeTab === "upload" && (
                <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    objectIdProp={objectId || objectIdInput}
                    baseVersion={baseVersion}
                    setBaseVersion={setBaseVersion}
                    selectedBranch={currentBranch}
                    setSelectedBranch={setCurrentBranch}
                />
            )}

            {/* ─── History + Version Graph ──────────────── */}

            {activeTab === "history" && (
                <>
                    {!objectId && (
                        <div className="card">
                            <p style={{ color: "var(--color-text-secondary)" }}>
                                Enter a Model ID and Checkout to view version history.
                            </p>
                        </div>
                    )}
                    {objectId && (
                        <VersionHistory
                            objectId={objectId}
                            onVersionSelect={handleVersionSelect}
                            baseVersion={baseVersion}
                            setBaseVersion={setBaseVersion}
                        />
                    )}
                </>
            )}

            {/* ─── Viewer ──────────────────────────────── */}

            {activeTab === "viewer" && (
                <GeometryViewer geometryJson={selectedGeometry} />
            )}

        </div>
    );
};

export default DashboardPage;