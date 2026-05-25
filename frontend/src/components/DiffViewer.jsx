import React from "react";

const DiffViewer = ({
    diffData,
    loading = false,
    error = "",
}) => {

    if (!diffData) {

        return (

            <div className="card">

                <h2>
                    Geometry Diff Viewer
                </h2>

                <p style={{ color: "#999" }}>
                    Select two versions to compare
                </p>

            </div>

        );
    }

    return (

        <div className="card">

            <h2>
                Geometry Diff Viewer
            </h2>

            {error && (

                <div className="alert alert-error">
                    {error}
                </div>

            )}

            {loading ? (

                <div className="loading">

                    <div className="spinner"></div>

                    <p>
                        Computing diff...
                    </p>

                </div>

            ) : (

                <>

                    <div className="diff-header">

                        <span>

                            <strong>
                                {diffData.objectId}
                            </strong>

                            {" "}
                            v{diffData.fromVersion}
                            {" → "}
                            v{diffData.toVersion}

                        </span>

                        <span>
                            {diffData.geometryName}
                        </span>

                    </div>

                    <div
                        className="stats-grid"
                        style={{ marginTop: "1rem" }}
                    >

                        <div className="stat-card">
                            <h3>
                                {diffData.vertexAdditions || 0}
                            </h3>
                            <p>
                                Vertices Added
                            </p>
                        </div>

                        <div className="stat-card">
                            <h3>
                                {diffData.vertexModifications || 0}
                            </h3>
                            <p>
                                Vertices Modified
                            </p>
                        </div>

                        <div className="stat-card">
                            <h3>
                                {diffData.vertexDeletions || 0}
                            </h3>
                            <p>
                                Vertices Deleted
                            </p>
                        </div>

                        <div className="stat-card">
                            <h3>
                                {diffData.faceAdditions || 0}
                            </h3>
                            <p>
                                Faces Added
                            </p>
                        </div>

                        <div className="stat-card">
                            <h3>
                                {diffData.faceDeletions || 0}
                            </h3>
                            <p>
                                Faces Deleted
                            </p>
                        </div>

                    </div>

                    <div
                        className="diff-content"
                        style={{ marginTop: "2rem" }}
                    >

                        {/* ===================== */}
                        {/* Vertex Changes */}
                        {/* ===================== */}

                        <div className="diff-section">

                            <h4>
                                Vertex Changes
                            </h4>

                            <p>
                                {diffData.oldVertexCount || 0}
                                {" "}
                                vertices
                                {" → "}
                                {diffData.newVertexCount || 0}
                                {" "}
                                vertices
                            </p>

                            {diffData.vertexChanges?.length > 0 ? (

                                <div
                                    style={{
                                        maxHeight: "400px",
                                        overflowY: "auto",
                                    }}
                                >

                                    {diffData.vertexChanges
                                        .slice(0, 10)
                                        .map((change, idx) => (

                                        <div
                                            key={idx}
                                            className={`diff-stat ${change.type?.toLowerCase()}`}
                                        >

                                            <strong>
                                                [{change.type}]
                                            </strong>

                                            {" "}
                                            Vertex
                                            {" "}
                                            {change.index}

                                            {change.oldValue && (

                                                <div
                                                    style={{
                                                        fontSize: "0.85rem",
                                                    }}
                                                >

                                                    Old:
                                                    {" "}
                                                    {JSON.stringify(
                                                        change.oldValue
                                                    )}

                                                </div>

                                            )}

                                            {change.newValue && (

                                                <div
                                                    style={{
                                                        fontSize: "0.85rem",
                                                    }}
                                                >

                                                    New:
                                                    {" "}
                                                    {JSON.stringify(
                                                        change.newValue
                                                    )}

                                                </div>

                                            )}

                                        </div>

                                    ))}

                                    {diffData.vertexChanges.length > 10 && (

                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#999",
                                            }}
                                        >

                                            ...
                                            {" "}
                                            and
                                            {" "}
                                            {diffData.vertexChanges.length - 10}
                                            {" "}
                                            more

                                        </p>

                                    )}

                                </div>

                            ) : (

                                <p style={{ color: "#999" }}>
                                    No vertex changes
                                </p>

                            )}

                        </div>

                        {/* ===================== */}
                        {/* Face Changes */}
                        {/* ===================== */}

                        <div className="diff-section">

                            <h4>
                                Face Changes
                            </h4>

                            <p>
                                {diffData.oldFaceCount || 0}
                                {" "}
                                faces
                                {" → "}
                                {diffData.newFaceCount || 0}
                                {" "}
                                faces
                            </p>

                            {diffData.faceChanges?.length > 0 ? (

                                <div
                                    style={{
                                        maxHeight: "400px",
                                        overflowY: "auto",
                                    }}
                                >

                                    {diffData.faceChanges
                                        .slice(0, 10)
                                        .map((change, idx) => (

                                        <div
                                            key={idx}
                                            className={`diff-stat ${change.type?.toLowerCase()}`}
                                        >

                                            <strong>
                                                [{change.type}]
                                            </strong>

                                            {" "}
                                            Face
                                            {" "}
                                            {change.index}

                                            {change.oldValue && (

                                                <div
                                                    style={{
                                                        fontSize: "0.85rem",
                                                    }}
                                                >

                                                    Old:
                                                    {" "}
                                                    {JSON.stringify(
                                                        change.oldValue
                                                    )}

                                                </div>

                                            )}

                                            {change.newValue && (

                                                <div
                                                    style={{
                                                        fontSize: "0.85rem",
                                                    }}
                                                >

                                                    New:
                                                    {" "}
                                                    {JSON.stringify(
                                                        change.newValue
                                                    )}

                                                </div>

                                            )}

                                        </div>

                                    ))}

                                    {diffData.faceChanges.length > 10 && (

                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#999",
                                            }}
                                        >

                                            ...
                                            {" "}
                                            and
                                            {" "}
                                            {diffData.faceChanges.length - 10}
                                            {" "}
                                            more

                                        </p>

                                    )}

                                </div>

                            ) : (

                                <p style={{ color: "#999" }}>
                                    No face changes
                                </p>

                            )}

                        </div>

                    </div>

                </>

            )}

        </div>

    );
};

export default DiffViewer;