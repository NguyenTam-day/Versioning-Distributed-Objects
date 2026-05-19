package org.example;

import org.example.dv.*;

/**
 * Demo: Parse 2 OBJ files, convert to JSON, and compute diff.
 */
public class Geometry3DDemo {

    static String obj1 = "# Simple cube v1\n" +
            "v 0 0 0\n" +
            "v 1 0 0\n" +
            "v 1 1 0\n" +
            "v 0 1 0\n" +
            "v 0 0 1\n" +
            "v 1 0 1\n" +
            "v 1 1 1\n" +
            "v 0 1 1\n" +
            "f 1 2 3\n" +
            "f 3 4 1\n" +
            "f 5 6 7\n" +
            "f 7 8 5\n";

    static String obj2 = "# Simple cube v2 - modified\n" +
            "v 0 0 0\n" +
            "v 1.5 0 0\n" +  // modified
            "v 1.5 1.5 0\n" +  // modified
            "v 0 1 0\n" +
            "v 0 0 1\n" +
            "v 1 0 1\n" +
            "v 1 1 1\n" +
            "v 0 1 1\n" +
            "v 0.5 0.5 0.5\n" + // added
            "f 1 2 3\n" +
            "f 3 4 1\n" +
            "f 5 6 7\n" +
            "f 7 8 5\n" +
            "f 1 2 9\n"; // added

    public static void main(String[] args) throws Exception {
        System.out.println("=== 3D Geometry Parser & Diff Demo ===\n");

        // Parse OBJ v1
        System.out.println("Parsing OBJ v1...");
        Geometry3D geom1 = ObjParser.parse(obj1);
        geom1.setName("cube-v1");
        System.out.println("✓ Parsed: " + geom1);

        // Parse OBJ v2
        System.out.println("\nParsing OBJ v2...");
        Geometry3D geom2 = ObjParser.parse(obj2);
        geom2.setName("cube-v2");
        System.out.println("✓ Parsed: " + geom2);

        // Show JSON representations
        System.out.println("\n=== V1 JSON ===");
        System.out.println(geom1.toJson());

        System.out.println("\n=== V2 JSON ===");
        System.out.println(geom2.toJson());

        // Compute diff
        System.out.println("\n");
        Geometry3DDiff.DiffReport report = Geometry3DDiff.diff(geom1, geom2);
        System.out.println(report);

        // Show diff as JSON
        System.out.println("\n=== Diff Report JSON ===");
        System.out.println(report.toJson());

        // Storage size comparison
        String json1 = geom1.toJson();
        String json2 = geom2.toJson();
        String diffJson = report.toJson();

        System.out.println("\n=== Storage Size Analysis ===");
        System.out.println("V1 JSON size: " + json1.getBytes().length + " bytes");
        System.out.println("V2 JSON size: " + json2.getBytes().length + " bytes");
        System.out.println("Diff Report size: " + diffJson.getBytes().length + " bytes");
        System.out.println("Space saved by storing diff instead of full V2: " +
                (json2.getBytes().length - diffJson.getBytes().length) + " bytes (" +
                String.format("%.1f%%", 100.0 * (1 - (double) diffJson.getBytes().length / json2.getBytes().length)) + ")");
    }
}

