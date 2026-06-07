package org.example.dv;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.ArrayList;
import java.util.List;

public class Geometry3DDiff {

    public static class DiffReport {

        public String geometryName;

        public transient int oldVertexCount;
        public int newVertexCount;
        public transient int vertexAdditions;
        public transient int vertexModifications;
        public transient int vertexDeletions;

        public transient int oldFaceCount;
        public int newFaceCount;
        public transient int faceAdditions;
        public transient int faceModifications;
        public transient int faceDeletions;

        public List<VertexChange> vertexChanges = new ArrayList<>();
        public List<FaceChange> faceChanges = new ArrayList<>();

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder();
            sb.append("=== Geometry3D Diff Report ===\n");
            sb.append("Name: ").append(geometryName).append("\n");

            sb.append("Vertices: ")
                    .append(oldVertexCount).append(" -> ").append(newVertexCount).append("\n");

            sb.append("Faces: ")
                    .append(oldFaceCount).append(" -> ").append(newFaceCount).append("\n");

            return sb.toString();
        }

        public String toJson() {
            return new GsonBuilder().setPrettyPrinting().create().toJson(this);
        }
    }

    // ================= VERTEX CHANGE =================
    public static class VertexChange {
        public int index;
        public String type;
        public transient Geometry3D.Vertex oldValue;
        public Geometry3D.Vertex newValue;

        public VertexChange(int index, String type,
                            Geometry3D.Vertex oldValue,
                            Geometry3D.Vertex newValue) {
            this.index = index;
            this.type = type;
            this.oldValue = oldValue;
            this.newValue = newValue;
        }
    }

    // ================= FACE CHANGE =================
    public static class FaceChange {
        public int index;
        public String type;
        public transient Geometry3D.Face oldValue;
        public Geometry3D.Face newValue;

        public FaceChange(int index, String type,
                          Geometry3D.Face oldValue,
                          Geometry3D.Face newValue) {
            this.index = index;
            this.type = type;
            this.oldValue = oldValue;
            this.newValue = newValue;
        }
    }

    // ================= CORE DIFF =================
    public static DiffReport diff(Geometry3D a, Geometry3D b) {

        DiffReport r = new DiffReport();

        if (a == null) a = new Geometry3D();
        if (b == null) b = new Geometry3D();

        r.geometryName = b.getName();

        List<Geometry3D.Vertex> av = a.getVertices();
        List<Geometry3D.Vertex> bv = b.getVertices();

        List<Geometry3D.Face> af = a.getFaces();
        List<Geometry3D.Face> bf = b.getFaces();

        r.oldVertexCount = av.size();
        r.newVertexCount = bv.size();

        r.oldFaceCount = af.size();
        r.newFaceCount = bf.size();

        // ===== VERTEX DIFF =====
        int minV = Math.min(av.size(), bv.size());

        for (int i = 0; i < minV; i++) {
            if (!av.get(i).equals(bv.get(i))) {
                r.vertexModifications++;
                r.vertexChanges.add(new VertexChange(i, "modified", av.get(i), bv.get(i)));
            }
        }

        if (bv.size() > av.size()) {
            r.vertexAdditions = bv.size() - av.size();
            for (int i = av.size(); i < bv.size(); i++) {
                r.vertexChanges.add(new VertexChange(i, "added", null, bv.get(i)));
            }
        }

        if (av.size() > bv.size()) {
            r.vertexDeletions = av.size() - bv.size();
            // Deletions are implicitly handled by newVertexCount truncation, no need to save in JSON
        }

        // ===== FACE DIFF =====
        int minF = Math.min(af.size(), bf.size());

        for (int i = 0; i < minF; i++) {
            if (!af.get(i).equals(bf.get(i))) {
                r.faceModifications++;
                r.faceChanges.add(new FaceChange(i, "modified", af.get(i), bf.get(i)));
            }
        }

        if (bf.size() > af.size()) {
            r.faceAdditions = bf.size() - af.size();
            for (int i = af.size(); i < bf.size(); i++) {
                r.faceChanges.add(new FaceChange(i, "added", null, bf.get(i)));
            }
        }

        if (af.size() > bf.size()) {
            r.faceDeletions = af.size() - bf.size();
            // Deletions are implicitly handled by newFaceCount truncation, no need to save in JSON
        }

        return r;
    }

    // ================= APPLY DIFF =================
    public static Geometry3D apply(Geometry3D base, DiffReport report) {
        if (base == null) base = new Geometry3D();
        if (report == null) return base;

        Geometry3D result = new Geometry3D();
        result.setName(report.geometryName != null ? report.geometryName : base.getName());
        result.setFormat(base.getFormat() != null ? base.getFormat() : "obj");

        // 1. Rebuild Vertices
        List<Geometry3D.Vertex> vertices = new ArrayList<>();
        if (base.getVertices() != null) {
            vertices.addAll(base.getVertices());
        }
        if (vertices.size() > report.newVertexCount) {
            vertices = new ArrayList<>(vertices.subList(0, report.newVertexCount));
        }
        while (vertices.size() < report.newVertexCount) {
            vertices.add(null);
        }
        if (report.vertexChanges != null) {
            for (VertexChange vc : report.vertexChanges) {
                if ("modified".equals(vc.type) || "added".equals(vc.type)) {
                    if (vc.index >= 0 && vc.index < vertices.size()) {
                        vertices.set(vc.index, vc.newValue);
                    }
                }
            }
        }
        result.setVertices(vertices);

        // 2. Rebuild Faces
        List<Geometry3D.Face> faces = new ArrayList<>();
        if (base.getFaces() != null) {
            faces.addAll(base.getFaces());
        }
        if (faces.size() > report.newFaceCount) {
            faces = new ArrayList<>(faces.subList(0, report.newFaceCount));
        }
        while (faces.size() < report.newFaceCount) {
            faces.add(null);
        }
        if (report.faceChanges != null) {
            for (FaceChange fc : report.faceChanges) {
                if ("modified".equals(fc.type) || "added".equals(fc.type)) {
                    if (fc.index >= 0 && fc.index < faces.size()) {
                        faces.set(fc.index, fc.newValue);
                    }
                }
            }
        }
        result.setFaces(faces);

        return result;
    }
}
