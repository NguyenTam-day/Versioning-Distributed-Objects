package org.example.dv;

import java.util.ArrayList;
import java.util.List;

public class Geometry3D {

    private String name;
    private int version;
    private String siteId;
    private long timestamp;
    private String format;

    private List<Vertex> vertices = new ArrayList<>();
    private List<Face> faces = new ArrayList<>();

    // ===== INNER CLASS VERTEX =====
    public static class Vertex {
        public double x, y, z;

        public Vertex() {}

        public Vertex(double x, double y, double z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof Vertex)) return false;
            Vertex v = (Vertex) o;
            return x == v.x && y == v.y && z == v.z;
        }

        @Override
        public String toString() {
            return "(" + x + "," + y + "," + z + ")";
        }
    }

    // ===== INNER CLASS FACE =====
    public static class Face {
        public List<Integer> indices = new ArrayList<>();

        public Face() {}

        public Face(List<Integer> indices) {
            this.indices = indices;
        }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof Face)) return false;
            Face f = (Face) o;
            return indices.equals(f.indices);
        }

        @Override
        public String toString() {
            return indices.toString();
        }
    }

    // ===== GET/SET =====

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public List<Vertex> getVertices() { return vertices; }
    public void setVertices(List<Vertex> vertices) { this.vertices = vertices; }

    public List<Face> getFaces() { return faces; }
    public void setFaces(List<Face> faces) { this.faces = faces; }

    public String toJson() {
        return "{"
                + "\"name\":\"" + name + "\","
                + "\"version\":" + version + ","
                + "\"siteId\":\"" + siteId + "\","
                + "\"timestamp\":" + timestamp
                + "}";
    }
}