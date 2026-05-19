package org.example;

import org.example.dv.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Demo: Load 2 OBJ files from disk, parse, compare, and show diff.
 */
public class FileBasedGeometry3DDemo {

    public static void main(String[] args) throws IOException {
        System.out.println("=== File-Based 3D Geometry Parser & Diff Demo ===\n");

        String path1 = "sample-files/cube-v1.obj";
        String path2 = "sample-files/cube-v2.obj";

        // Load and parse OBJ v1
        System.out.println("Loading and parsing: " + path1);
        String content1 = new String(Files.readAllBytes(Paths.get(path1)));
        Geometry3D geom1 = ObjParser.parse(content1);
        geom1.setName("cube-v1");
        System.out.println("✓ Parsed: " + geom1);

        // Load and parse OBJ v2
        System.out.println("\nLoading and parsing: " + path2);
        String content2 = new String(Files.readAllBytes(Paths.get(path2)));
        Geometry3D geom2 = ObjParser.parse(content2);
        geom2.setName("cube-v2");
        System.out.println("✓ Parsed: " + geom2);

        // Show JSON representations
        System.out.println("\n=== V1 JSON ===");
        String json1 = geom1.toJson();
        System.out.println(json1);

        System.out.println("\n=== V2 JSON ===");
        String json2 = geom2.toJson();
        System.out.println(json2);

        // Compute diff
        System.out.println("\n");
        Geometry3DDiff.DiffReport report = Geometry3DDiff.diff(geom1, geom2);
        System.out.println(report);

        // Show diff as JSON
        System.out.println("\n=== Diff Report JSON ===");
        String diffJson = report.toJson();
        System.out.println(diffJson);

        // Storage size comparison
        System.out.println("\n=== Storage Size Analysis ===");
        System.out.println("V1 JSON size: " + json1.getBytes().length + " bytes");
        System.out.println("V2 JSON size: " + json2.getBytes().length + " bytes");
        System.out.println("Diff Report size: " + diffJson.getBytes().length + " bytes");
        System.out.println("Space saved by storing diff instead of full V2: " +
                (json2.getBytes().length - diffJson.getBytes().length) + " bytes (" +
                String.format("%.1f%%", 100.0 * (1 - (double) diffJson.getBytes().length / json2.getBytes().length)) + ")");

        System.out.println("\n=== Delta Storage Strategy ===");
        // Simulate 10 versions
        System.out.println("Simulating 10 incremental versions of a CAD object:");
        long fullSnapshotTotal = json1.getBytes().length;
        long deltaStorageTotal = json1.getBytes().length; // initial snapshot

        // For demo, we simulate versions v3...v10 as minor modifications
        Geometry3D currentGeom = geom2;
        for (int i = 3; i <= 10; i++) {
            // Create a slightly modified version
            Geometry3D modifiedGeom = new Geometry3D("OBJ", "cube-v" + i);
            modifiedGeom.setVertices(new java.util.ArrayList<>(currentGeom.getVertices()));
            modifiedGeom.setFaces(new java.util.ArrayList<>(currentGeom.getFaces()));

            // Add small modification
            if (!modifiedGeom.getVertices().isEmpty()) {
                Geometry3D.Vertex last = modifiedGeom.getVertices().get(modifiedGeom.getVertices().size() - 1);
                modifiedGeom.getVertices().set(modifiedGeom.getVertices().size() - 1,
                        new Geometry3D.Vertex(last.getX() + 0.1f, last.getY() + 0.1f, last.getZ() + 0.1f));
            }

            String modJson = modifiedGeom.toJson();
            fullSnapshotTotal += modJson.getBytes().length;

            // For delta storage: compute diff size
            Geometry3DDiff.DiffReport diffReport = Geometry3DDiff.diff(currentGeom, modifiedGeom);
            String reportJson = diffReport.toJson();
            deltaStorageTotal += reportJson.getBytes().length;

            currentGeom = modifiedGeom;
        }

        System.out.println("Full snapshots total (10 versions): " + fullSnapshotTotal + " bytes");
        System.out.println("Delta storage total (1 initial + 9 diffs): " + deltaStorageTotal + " bytes");
        System.out.println("Space saved: " + (fullSnapshotTotal - deltaStorageTotal) + " bytes (" +
                String.format("%.1f%%", 100.0 * (1 - (double) deltaStorageTotal / fullSnapshotTotal)) + ")");
    }
}

