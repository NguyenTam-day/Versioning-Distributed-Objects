package org.example.cad.service.geometry;

import org.example.dv.Geometry3D;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeometryMergeService {

    public Geometry3D resolveConflict(Geometry3D a, Geometry3D b) {

        if (a == null) return b;
        if (b == null) return a;

        Geometry3D winner =
                (a.getTimestamp() >= b.getTimestamp()) ? a : b;

        // ===== MERGE VERTICES =====
        List<Geometry3D.Vertex> mergedVertices = new ArrayList<>();
        if (a.getVertices() != null) mergedVertices.addAll(a.getVertices());
        if (b.getVertices() != null) mergedVertices.addAll(b.getVertices());

        // ===== MERGE FACES =====
        List<Geometry3D.Face> mergedFaces = new ArrayList<>();
        if (a.getFaces() != null) mergedFaces.addAll(a.getFaces());
        if (b.getFaces() != null) mergedFaces.addAll(b.getFaces());

        winner.setVertices(mergedVertices);
        winner.setFaces(mergedFaces);

        winner.setTimestamp(System.currentTimeMillis());
        winner.setVersion(Math.max(a.getVersion(), b.getVersion()) + 1);
        winner.setSiteId("MERGED");

        return winner;
    }

    public boolean requiresMerge(Geometry3D a, Geometry3D b) {
        if (a == null || b == null) return false;
        return a.getVersion() != b.getVersion();
    }
}