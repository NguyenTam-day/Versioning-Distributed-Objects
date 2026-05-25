import React, {
    useState,
    useEffect,
    useCallback,
} from "react";

import { useNode } from "../hooks/useNode";

// ======================================================
// ConflictResolver
//
// Dùng api từ NodeContext — không còn apiService.setNode()
// ======================================================

const ConflictResolver = ({ modelId }) => {

    const { currentNode, api } = useNode();

    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedConflict, setSelectedConflict] = useState(null);
    const [strategy, setStrategy] = useState("BRANCH");
    const [resolving, setResolving] = useState(false);

    // ─── Load conflicts ───────────────────────────────

    const loadConflicts = useCallback(async () => {

        if (!modelId) return;

        setLoading(true);
        setError("");

        try {

            const response = await api.getConflicts(modelId);

            setConflicts(
                Array.isArray(response.data) ? response.data : []
            );

        } catch (err) {

            console.error(err);
            // Không có conflict cũng xem như bình thường
            setConflicts([]);

        } finally {
            setLoading(false);
        }

    }, [modelId, api]);

    useEffect(() => {
        if (modelId) {
            loadConflicts();
        }
    }, [modelId, loadConflicts]);

    // ─── Resolve conflict ─────────────────────────────

    const handleResolveConflict = async () => {

        if (!selectedConflict) return;

        setResolving(true);
        setError("");

        try {

            await api.resolveConflict(
                selectedConflict.id,
                strategy,
                {}
            );

            await loadConflicts();
            setSelectedConflict(null);

        } catch (err) {

            setError(`Failed to resolve conflict: ${err.message}`);

        } finally {
            setResolving(false);
        }
    };

    // ─── Render ───────────────────────────────────────

    if (!modelId) {
        return (
            <div className="card">
                <h2>⚠️ Conflict Resolution</h2>
                <p style={{ color: "#999" }}>Select a model to view conflicts</p>
            </div>
        );
    }

    return (

        <div className="card">

            <h2>
                ⚠️ Conflict Resolution ({currentNode})
            </h2>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {loading ? (

                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading conflicts...</p>
                </div>

            ) : conflicts.length === 0 ? (

                <div className="alert alert-success">
                    ✓ No conflicts found
                </div>

            ) : (

                <>

                    <ul className="list">

                        {conflicts.map((conflict) => (

                            <li
                                key={conflict.id}
                                className="list-item"
                                onClick={() => setSelectedConflict(conflict)}
                                style={{
                                    cursor: "pointer",
                                    backgroundColor:
                                        selectedConflict?.id === conflict.id
                                            ? "#ffe5e5"
                                            : undefined,
                                    borderRadius: "4px",
                                }}
                            >

                                <div className="list-item-info">
                                    <h3>Conflict: {conflict.type}</h3>
                                    <p>
                                        Between v{conflict.versionA}
                                        {" "}and v{conflict.versionB}
                                    </p>
                                </div>

                                <span className="badge badge-danger">
                                    Needs Resolution
                                </span>

                            </li>

                        ))}

                    </ul>

                    {selectedConflict && (

                        <div
                            style={{
                                marginTop: "2rem",
                                padding: "1.5rem",
                                backgroundColor: "#fff3e0",
                                borderRadius: "8px",
                                border: "2px solid #f39c12",
                            }}
                        >

                            <h3>Resolve Conflict</h3>

                            <p>Type: {selectedConflict.conflictType}</p>

                            <div className="form-group">

                                <label>Resolution Strategy</label>

                                <select
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    disabled={resolving}
                                >
                                    <option value="BRANCH">Keep Both (Branch)</option>
                                    <option value="TIMESTAMP">Latest Timestamp</option>
                                    <option value="VERSION_A">Keep Version A</option>
                                    <option value="VERSION_B">Keep Version B</option>
                                </select>

                            </div>

                            <button
                                className="btn btn-success"
                                onClick={handleResolveConflict}
                                disabled={resolving}
                            >
                                {resolving ? "⏳ Resolving..." : "Resolve Conflict"}
                            </button>

                        </div>

                    )}

                </>

            )}

        </div>
    );
};

export default ConflictResolver;