import React, { useState, useEffect, useCallback, useRef } from "react";

// ======================================================
// BranchSelector
//
// GitHub-style branch picker dropdown.
// Fetches branches from API, shows current branch,
// allows switching.
// ======================================================

const BranchSelector = ({ modelId, api, currentBranch = "main", onBranchSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const filterRef = useRef(null);

    // ─── Load branches ────────────────────────────────

    const loadBranches = useCallback(async () => {
        if (!modelId || !api) return;

        setLoading(true);
        try {
            const response = await api.getBranches(modelId);
            const resData = response.data;
            
            // Extract actual branch list from ApiResponse wrapper
            const list = resData?.data || (Array.isArray(resData) ? resData : []);

            if (Array.isArray(list)) {
                setBranches(list.map(b => typeof b === "string" ? { name: b } : b));
            } else if (list && typeof list === "object") {
                // If API returns { "main": "versionId", "feature/x": "versionId" }
                setBranches(
                    Object.entries(list).map(([name, versionId]) => ({
                        name,
                        versionId,
                    }))
                );
            } else {
                setBranches([{ name: "main" }]);
            }
        } catch (err) {
            console.error("Failed to load branches:", err);
            // Fallback — always show at least main
            setBranches([{ name: "main" }]);
        } finally {
            setLoading(false);
        }
    }, [modelId, api]);

    useEffect(() => {
        if (modelId) {
            loadBranches();
        }
    }, [modelId, loadBranches]);

    // ─── Focus filter on open ─────────────────────────

    useEffect(() => {
        if (isOpen && filterRef.current) {
            filterRef.current.focus();
        }
    }, [isOpen]);

    // ─── Filter logic ─────────────────────────────────

    const filteredBranches = branches.filter((b) => {
        const name = typeof b === "string" ? b : b.name;
        return name.toLowerCase().includes(filter.toLowerCase());
    });

    const handleSelect = (branchName) => {
        setIsOpen(false);
        setFilter("");
        if (onBranchSelect) {
            onBranchSelect(branchName);
        }
    };

    // ─── SVG Icons ────────────────────────────────────

    const BranchIcon = () => (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
        </svg>
    );

    const CaretIcon = () => (
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" className="caret">
            <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z" />
        </svg>
    );

    const CheckIcon = () => (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className="check-icon">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        </svg>
    );

    // ─── Render ───────────────────────────────────────

    if (!modelId) return null;

    return (
        <div className="branch-selector">
            <button
                className="branch-selector-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Switch branches"
            >
                <BranchIcon />
                <span>{currentBranch}</span>
                <CaretIcon />
            </button>

            {isOpen && (
                <>
                    <div
                        className="branch-overlay"
                        onClick={() => {
                            setIsOpen(false);
                            setFilter("");
                        }}
                    />

                    <div className="branch-dropdown">
                        <div className="branch-dropdown-header">
                            Switch branches
                        </div>

                        <div className="branch-dropdown-filter">
                            <input
                                ref={filterRef}
                                type="text"
                                placeholder="Filter branches..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>

                        <div className="branch-dropdown-list">
                            {loading ? (
                                <div className="branch-dropdown-empty">
                                    Loading branches...
                                </div>
                            ) : filteredBranches.length === 0 ? (
                                <div className="branch-dropdown-empty">
                                    No branches found
                                </div>
                            ) : (
                                filteredBranches.map((b) => {
                                    const name = typeof b === "string" ? b : b.name;
                                    const isActive = name === currentBranch;

                                    return (
                                        <button
                                            key={name}
                                            className={`branch-dropdown-item ${isActive ? "active" : ""}`}
                                            onClick={() => handleSelect(name)}
                                        >
                                            <span style={{ width: 16, display: "inline-flex" }}>
                                                {isActive && <CheckIcon />}
                                            </span>
                                            <span className="branch-name">{name}</span>
                                            {name === "main" && (
                                                <span className="branch-badge">default</span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BranchSelector;
