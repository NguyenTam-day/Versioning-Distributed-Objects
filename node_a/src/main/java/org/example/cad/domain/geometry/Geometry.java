package org.example.cad.domain.geometry;

import java.util.List;

public class Geometry {

    private String id;
    private List<Shape> shapes;

    // versioning metadata (IMPORTANT for distributed system)
    private int version;
    private long timestamp;
    private String siteId;

    public Geometry() {}

    public Geometry(String id, List<Shape> shapes) {
        this.id = id;
        this.shapes = shapes;
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<Shape> getShapes() {
        return shapes;
    }

    public void setShapes(List<Shape> shapes) {
        this.shapes = shapes;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getSiteId() {
        return siteId;
    }

    public void setSiteId(String siteId) {
        this.siteId = siteId;
    }

    // =========================
    // SAFE JSON EXPORT
    // =========================

    public String toJson() {
        if (shapes == null) {
            return "{\"id\":\"" + id + "\",\"shapes\":[]}";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{")
                .append("\"id\":\"").append(id).append("\",")
                .append("\"version\":").append(version).append(",")
                .append("\"siteId\":\"").append(siteId).append("\",")
                .append("\"shapes\":[");

        for (int i = 0; i < shapes.size(); i++) {
            sb.append(shapes.get(i).toJson());
            if (i < shapes.size() - 1) sb.append(",");
        }

        sb.append("]}");
        return sb.toString();
    }
}