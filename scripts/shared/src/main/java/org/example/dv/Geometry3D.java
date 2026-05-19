package org.example.dv;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * JSON-serializable representation of a 3D geometry.
 * Stores vertices, faces (triangles), and metadata.
 */
public class Geometry3D {
    private List<Vertex> vertices;
    private List<Face> faces;
    private String format; // "OBJ", "STL", etc.
    private String name;

    public Geometry3D(String format, String name) {
        this.format = format;
        this.name = name;
        this.vertices = new ArrayList<>();
        this.faces = new ArrayList<>();
    }

    public Geometry3D() {
        this("UNKNOWN", "geometry");
    }

    public List<Vertex> getVertices() {
        return vertices;
    }

    public void setVertices(List<Vertex> vertices) {
        this.vertices = vertices;
    }

    public List<Face> getFaces() {
        return faces;
    }

    public void setFaces(List<Face> faces) {
        this.faces = faces;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void addVertex(Vertex v) {
        vertices.add(v);
    }

    public void addFace(Face f) {
        faces.add(f);
    }

    public String toJson() {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        return gson.toJson(this);
    }

    public static Geometry3D fromJson(String json) {
        Gson gson = new Gson();
        return gson.fromJson(json, Geometry3D.class);
    }

    @Override
    public String toString() {
        return "Geometry3D{" +
                "format='" + format + '\'' +
                ", name='" + name + '\'' +
                ", vertices=" + vertices.size() +
                ", faces=" + faces.size() +
                '}';
    }

    /**
     * Represents a 3D vertex (point in space).
     */
    public static class Vertex {
        private float x;
        private float y;
        private float z;

        public Vertex(float x, float y, float z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public Vertex() {}

        public float getX() { return x; }
        public float getY() { return y; }
        public float getZ() { return z; }

        public void setX(float x) { this.x = x; }
        public void setY(float y) { this.y = y; }
        public void setZ(float z) { this.z = z; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Vertex vertex = (Vertex) o;
            return Float.compare(vertex.x, x) == 0 &&
                    Float.compare(vertex.y, y) == 0 &&
                    Float.compare(vertex.z, z) == 0;
        }

        @Override
        public int hashCode() {
            return Objects.hash(x, y, z);
        }

        @Override
        public String toString() {
            return String.format("(%.2f, %.2f, %.2f)", x, y, z);
        }
    }

    /**
     * Represents a face (triangle or polygon).
     * For simplicity, stores vertex indices that comprise the face.
     */
    public static class Face {
        private List<Integer> vertexIndices; // indices into vertices list

        public Face(List<Integer> vertexIndices) {
            this.vertexIndices = vertexIndices;
        }

        public Face() {
            this.vertexIndices = new ArrayList<>();
        }

        public List<Integer> getVertexIndices() { return vertexIndices; }
        public void setVertexIndices(List<Integer> indices) { this.vertexIndices = indices; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Face face = (Face) o;
            return Objects.equals(vertexIndices, face.vertexIndices);
        }

        @Override
        public int hashCode() {
            return Objects.hash(vertexIndices);
        }

        @Override
        public String toString() {
            return "Face" + vertexIndices;
        }
    }
}

