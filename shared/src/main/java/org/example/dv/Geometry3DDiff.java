package org.example.dv;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.ArrayList;
import java.util.List;

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
        public int faceModifications;
        public int faceDeletions;

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
        public Geometry3D.Vertex oldValue;
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
        public Geometry3D.Face oldValue;
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
            for (int i = bv.size(); i < av.size(); i++) {
                r.vertexChanges.add(new VertexChange(i, "deleted", av.get(i), null));
            }
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
            for (int i = bf.size(); i < af.size(); i++) {
                r.faceChanges.add(new FaceChange(i, "deleted", af.get(i), null));
            }
        }

        return r;
    }
}