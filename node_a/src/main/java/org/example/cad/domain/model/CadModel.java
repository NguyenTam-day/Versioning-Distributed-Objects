package org.example.cad.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * CAD Model for Distributed Versioning System
 * Supports:
 * - PartID + Geometry
 * - Version history
 * - Foundation for conflict resolution (branching/timestamp later)
 */
@Document(collection = "cad_models")
public class CadModel {

    /**
     * PartID of CAD object (primary key in distributed system)
     */
    @Id
    private String partId;

    /**
     * Current/base geometry (full snapshot of latest stable version)
     */
    private String geometry;

    /**
     * Version history (supports snapshot or delta versions)
     */
    private List<Version> versions = new ArrayList<>();

    /**
     * Optional: track which site currently holds lock (checkout)
     */
    private String lockedBySite;

    public CadModel() {}

    public CadModel(String partId, String geometry) {
        this.partId = partId;
        this.geometry = geometry;
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public String getPartId() {
        return partId;
    }

    public void setPartId(String partId) {
        this.partId = partId;
    }

    public String getGeometry() {
        return geometry;
    }

    public void setGeometry(String geometry) {
        this.geometry = geometry;
    }

    public List<Version> getVersions() {
        return versions;
    }

    public void setVersions(List<Version> versions) {
        this.versions = versions;
    }

    public String getLockedBySite() {
        return lockedBySite;
    }

    public void setLockedBySite(String lockedBySite) {
        this.lockedBySite = lockedBySite;
    }

    // =========================
    // VERSION MANAGEMENT
    // =========================

    public void addVersion(Version version) {
        this.versions.add(version);

        // update current geometry if this is full snapshot
        if (version.isFullSnapshot()) {
            this.geometry = version.getGeometryData();
        }
    }

    public Version getLatestVersion() {
        if (versions.isEmpty()) return null;
        return versions.get(versions.size() - 1);
    }
}