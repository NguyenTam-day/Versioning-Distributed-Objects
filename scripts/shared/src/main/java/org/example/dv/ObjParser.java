package org.example.dv;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Simple OBJ file parser.
 * Supports:
 *  - v x y z (vertices)
 *  - f v1 v2 v3 ... (faces/triangles)
 * Converts OBJ to Geometry3D JSON model.
 */
public class ObjParser {

    public static Geometry3D parse(String objContent) throws IOException {
        Geometry3D geometry = new Geometry3D("OBJ", "parsed_object");
        List<Geometry3D.Vertex> vertices = new ArrayList<>();
        List<Geometry3D.Face> faces = new ArrayList<>();

        BufferedReader reader = new BufferedReader(new StringReader(objContent));
        String line;

        while ((line = reader.readLine()) != null) {
            line = line.trim();

            // skip comments and empty lines
            if (line.isEmpty() || line.startsWith("#")) continue;

            String[] parts = line.split("\\s+");

            if (parts[0].equals("v") && parts.length >= 4) {
                // vertex: v x y z
                float x = Float.parseFloat(parts[1]);
                float y = Float.parseFloat(parts[2]);
                float z = Float.parseFloat(parts[3]);
                vertices.add(new Geometry3D.Vertex(x, y, z));
            }
            else if (parts[0].equals("f") && parts.length >= 4) {
                // face: f v1 v2 v3 (we only support simple vertex indices for now)
                List<Integer> faceIndices = new ArrayList<>();
                for (int i = 1; i < parts.length; i++) {
                    String vertexData = parts[i];
                    // handle "v", "v/vt", "v/vt/vn", "v//vn" formats by taking only the vertex index
                    int vertexIdx = Integer.parseInt(vertexData.split("/")[0]);
                    // OBJ indices are 1-based, convert to 0-based
                    faceIndices.add(vertexIdx - 1);
                }
                faces.add(new Geometry3D.Face(faceIndices));
            }
        }

        geometry.setVertices(vertices);
        geometry.setFaces(faces);
        return geometry;
    }

    public static Geometry3D parseFromInputStream(InputStream inputStream, String name) throws IOException {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }
        Geometry3D geometry = parse(content.toString());
        geometry.setName(name);
        return geometry;
    }
}

