package org.example.dv;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class ObjParser {

    public static Geometry3D parseFromInputStream(InputStream is, String filename) throws IOException {

        Geometry3D g = new Geometry3D();
        g.setName(filename);
        
        // Extract file format from filename
        String format = "obj";
        if (filename != null && filename.contains(".")) {
            format = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        g.setFormat(format);

        List<Geometry3D.Vertex> vertices = new ArrayList<>();
        List<Geometry3D.Face> faces = new ArrayList<>();

        BufferedReader br = new BufferedReader(new InputStreamReader(is));
        String line;

        while ((line = br.readLine()) != null) {
            line = line.trim();

            if (line.startsWith("v ")) {
                String[] p = line.split("\\s+");
                vertices.add(new Geometry3D.Vertex(
                        Double.parseDouble(p[1]),
                        Double.parseDouble(p[2]),
                        Double.parseDouble(p[3])
                ));
            }

            if (line.startsWith("f ")) {
                String[] p = line.split("\\s+");
                List<Integer> idx = new ArrayList<>();
                for (int i = 1; i < p.length; i++) {
                    String token = p[i];
                    int slashIdx = token.indexOf('/');
                    if (slashIdx != -1) {
                        token = token.substring(0, slashIdx);
                    }
                    if (!token.isEmpty()) {
                        idx.add(Integer.parseInt(token));
                    }
                }
                if (!idx.isEmpty()) {
                    faces.add(new Geometry3D.Face(idx));
                }
            }
        }

        g.setVertices(vertices);
        g.setFaces(faces);

        return g;
    }
}