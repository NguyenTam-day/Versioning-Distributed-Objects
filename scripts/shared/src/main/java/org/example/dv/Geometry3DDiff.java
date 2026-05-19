package org.example.dv;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.ArrayList;
import java.util.List;

/**
 * Compares two Geometry3D objects and generates a diff report.
 */
public class Geometry3DDiff {

    public static class DiffReport {
        public String geometryName;
        public int oldVertexCount;
        public int newVertexCount;
        public int vertexAdditions;
        public int vertexModifications;
        public int vertexDeletions;
        public int oldFaceCount;
        public int newFaceCount;
        public int faceAdditions;
        public int faceDeletions;
        public List<VertexChange> vertexChanges;
        public List<FaceChange> faceChanges;

        public DiffReport() {
            this.vertexChanges = new ArrayList<>();
            this.faceChanges = new ArrayList<>();
        }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder();
            sb.append("=== Geometry3D Diff Report ===\n");
            sb.append("Name: ").append(geometryName).append("\n");
            sb.append("Vertices: ").append(oldVertexCount).append(" -> ").append(newVertexCount).append("\n");
            sb.append("  Additions: ").append(vertexAdditions).append("\n");
            sb.append("  Modifications: ").append(vertexModifications).append("\n");
            sb.append("  Deletions: ").append(vertexDeletions).append("\n");
            sb.append("Faces: ").append(oldFaceCount).append(" -> ").append(newFaceCount).append("\n");
            sb.append("  Additions: ").append(faceAdditions).append("\n");
            sb.append("  Deletions: ").append(faceDeletions).append("\n");
            if (!vertexChanges.isEmpty()) {
                sb.append("\nVertex Changes:\n");
                for (VertexChange vc : vertexChanges) {
                    sb.append("  ").append(vc).append("\n");
                }
            }
            if (!faceChanges.isEmpty()) {
                sb.append("\nFace Changes:\n");
                for (FaceChange fc : faceChanges) {
                    sb.append("  ").append(fc).append("\n");
                }
            }
            return sb.toString();
        }

        public String toJson() {
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            return gson.toJson(this);
        }
    }

    public static class VertexChange {
        public int index;
        public String type; // "added", "modified", "deleted"
        public Geometry3D.Vertex oldValue;
        public Geometry3D.Vertex newValue;

        public VertexChange(int index, String type, Geometry3D.Vertex oldValue, Geometry3D.Vertex newValue) {
            this.index = index;
            this.type = type;
            this.oldValue = oldValue;
            this.newValue = newValue;
        }

        @Override
        public String toString() {
            switch (type) {
                case "added":
                    return String.format("Vertex %d ADDED: %s", index, newValue);
                case "deleted":
                    return String.format("Vertex %d DELETED: %s", index, oldValue);
                case "modified":
                    return String.format("Vertex %d MODIFIED: %s -> %s", index, oldValue, newValue);
                default:
                    return String.format("Vertex %d: unknown change", index);
            }
        }
    }

    public static class FaceChange {
        public int index;
        public String type; // "added", "deleted", "modified"
        public Geometry3D.Face oldValue;
        public Geometry3D.Face newValue;

        public FaceChange(int index, String type, Geometry3D.Face oldValue, Geometry3D.Face newValue) {
            this.index = index;
            this.type = type;
            this.oldValue = oldValue;
            this.newValue = newValue;
        }

        @Override
        public String toString() {
            switch (type) {
                case "added":
                    return String.format("Face %d ADDED: %s", index, newValue);
                case "deleted":
                    return String.format("Face %d DELETED: %s", index, oldValue);
                case "modified":
                    return String.format("Face %d MODIFIED: %s -> %s", index, oldValue, newValue);
                default:
                    return String.format("Face %d: unknown change", index);
            }
        }
    }

    public static DiffReport diff(Geometry3D oldGeom, Geometry3D newGeom) {
        DiffReport report = new DiffReport();

        report.geometryName = newGeom != null ? newGeom.getName() : "unknown";
        report.oldVertexCount = oldGeom != null ? oldGeom.getVertices().size() : 0;
        report.newVertexCount = newGeom != null ? newGeom.getVertices().size() : 0;
        report.oldFaceCount = oldGeom != null ? oldGeom.getFaces().size() : 0;
        report.newFaceCount = newGeom != null ? newGeom.getFaces().size() : 0;

        // Compare vertices
        List<Geometry3D.Vertex> oldVerts = oldGeom != null ? oldGeom.getVertices() : new ArrayList<>();
        List<Geometry3D.Vertex> newVerts = newGeom != null ? newGeom.getVertices() : new ArrayList<>();

        int minVertCount = Math.min(oldVerts.size(), newVerts.size());
        for (int i = 0; i < minVertCount; i++) {
            Geometry3D.Vertex oldV = oldVerts.get(i);
            Geometry3D.Vertex newV = newVerts.get(i);
            if (!oldV.equals(newV)) {
                report.vertexModifications++;
                report.vertexChanges.add(new VertexChange(i, "modified", oldV, newV));
            }
        }

        // Added vertices
        if (newVerts.size() > oldVerts.size()) {
            report.vertexAdditions = newVerts.size() - oldVerts.size();
            for (int i = oldVerts.size(); i < newVerts.size(); i++) {
                report.vertexChanges.add(new VertexChange(i, "added", null, newVerts.get(i)));
            }
        }

        // Deleted vertices
        if (oldVerts.size() > newVerts.size()) {
            report.vertexDeletions = oldVerts.size() - newVerts.size();
            for (int i = newVerts.size(); i < oldVerts.size(); i++) {
                report.vertexChanges.add(new VertexChange(i, "deleted", oldVerts.get(i), null));
            }
        }

        // Compare faces
        List<Geometry3D.Face> oldFaces = oldGeom != null ? oldGeom.getFaces() : new ArrayList<>();
        List<Geometry3D.Face> newFaces = newGeom != null ? newGeom.getFaces() : new ArrayList<>();

        int minFaceCount = Math.min(oldFaces.size(), newFaces.size());
        for (int i = 0; i < minFaceCount; i++) {
            Geometry3D.Face oldF = oldFaces.get(i);
            Geometry3D.Face newF = newFaces.get(i);
            if (!oldF.equals(newF)) {
                report.faceChanges.add(new FaceChange(i, "modified", oldF, newF));
            }
        }

        // Added faces
        if (newFaces.size() > oldFaces.size()) {
            report.faceAdditions = newFaces.size() - oldFaces.size();
            for (int i = oldFaces.size(); i < newFaces.size(); i++) {
                report.faceChanges.add(new FaceChange(i, "added", null, newFaces.get(i)));
            }
        }

        // Deleted faces
        if (oldFaces.size() > newFaces.size()) {
            report.faceDeletions = oldFaces.size() - newFaces.size();
            for (int i = newFaces.size(); i < oldFaces.size(); i++) {
                report.faceChanges.add(new FaceChange(i, "deleted", oldFaces.get(i), null));
            }
        }

        return report;
    }
}

