import React, { useState } from "react";

const GeometryViewer = ({ geometryJson }) => {

    const [expanded, setExpanded] =
        useState(false);

    if (!geometryJson) {

        return (

            <div className="card">

                <h2>
                    Geometry Data (JSON)
                </h2>

                <p style={{ color: "#999" }}>
                    Select a version to view geometry
                </p>

            </div>

        );
    }

    let parsedData;

    try {

        parsedData =
            typeof geometryJson === "string"
                ? JSON.parse(geometryJson)
                : geometryJson;

    } catch {

        parsedData = {
            error: "Invalid JSON data",
        };

    }

    return (

        <div className="card">

            <h2>
                Geometry Data (JSON)
            </h2>

            <div
                style={{
                    marginBottom: "1rem",
                }}
            >

                <button
                    className="btn btn-secondary"
                    onClick={() =>
                        setExpanded(!expanded)
                    }
                >

                    {expanded
                        ? "Collapse JSON"
                        : "Expand JSON"}

                </button>

            </div>

            {expanded ? (

                <pre
                    style={{
                        background: "#f5f5f5",
                        padding: "1rem",
                        borderRadius: "4px",
                        overflowX: "auto",
                        fontSize: "0.85rem",
                        lineHeight: "1.4",
                        maxHeight: "500px",
                        overflowY: "auto",
                    }}
                >

                    {JSON.stringify(
                        parsedData,
                        null,
                        2
                    )}

                </pre>

            ) : (

                <div
                    style={{
                        background: "#f5f5f5",
                        padding: "1rem",
                        borderRadius: "4px",
                    }}
                >

                    <p>

                        <strong>
                            Name:
                        </strong>

                        {" "}

                        {parsedData.name || "N/A"}

                    </p>

                    <p>

                        <strong>
                            Format:
                        </strong>

                        {" "}

                        {parsedData.format || "N/A"}

                    </p>

                    <p>

                        <strong>
                            Vertices:
                        </strong>

                        {" "}

                        {parsedData.vertices?.length || 0}

                    </p>

                    <p>

                        <strong>
                            Faces:
                        </strong>

                        {" "}

                        {parsedData.faces?.length || 0}

                    </p>

                    <p>

                        <strong>
                            Objects:
                        </strong>

                        {" "}

                        {parsedData.objects?.length || 0}

                    </p>

                </div>

            )}

        </div>

    );
};

export default GeometryViewer;