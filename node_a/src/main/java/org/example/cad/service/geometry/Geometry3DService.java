package org.example.cad.service.geometry;

import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.repository.Geometry3DRepository;
import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;
import org.example.dv.ObjParser;
import org.springframework.stereotype.Service;
import com.google.gson.Gson;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class Geometry3DService {

    private final Geometry3DRepository geometry3DRepository;

    public Geometry3DService(Geometry3DRepository geometry3DRepository) {
        this.geometry3DRepository = geometry3DRepository;
    }

    // =========================
    // REAL PARSER (OBJ)
    // =========================
    private Geometry3D parse(InputStream in, String filename) throws IOException {
        return ObjParser.parseFromInputStream(in, filename);
    }

    // =========================
    // UPLOAD VERSION
    // =========================
    public Geometry3D uploadGeometry(String objectId,
                                     String siteId,
                                     InputStream inputStream,
                                     String filename) throws IOException {

        Geometry3D geometry = parse(inputStream, filename);

        List<Geometry3DModel> versions = geometry3DRepository.findByObjectId(objectId);
        int newVersion = versions.isEmpty() ? 1 : versions.size() + 1;

        geometry.setVersion(newVersion);
        geometry.setSiteId(siteId);
        geometry.setTimestamp(System.currentTimeMillis());

        // Save to database
        Geometry3DModel model = Geometry3DModel.createNew(
                objectId,
                newVersion,
                geometry.getName(),
                geometry.getFormat(),
                new Gson().toJson(geometry.getVertices()),
                new Gson().toJson(geometry.getFaces()),
                new Gson().toJson(geometry),
                siteId
        );

        geometry3DRepository.save(model);

        return geometry;
    }

    // =========================
    // GET VERSION
    // =========================
    public Geometry3D getGeometry(String objectId, int version) {
        Optional<Geometry3DModel> model = geometry3DRepository.findByObjectIdAndVersion(objectId, version);
        if (model.isEmpty()) return null;
        return new Gson().fromJson(model.get().getGeometryJson(), Geometry3D.class);
    }

    // =========================
    // LIST ALL
    // =========================
    public List<Geometry3D> getAllVersions(String objectId) {
        List<Geometry3DModel> models = geometry3DRepository.findByObjectId(objectId);
        List<Geometry3D> result = new ArrayList<>();
        Gson gson = new Gson();
        for (Geometry3DModel model : models) {
            result.add(gson.fromJson(model.getGeometryJson(), Geometry3D.class));
        }
        return result;
    }

    // =========================
    // DIFF
    // =========================
    public Geometry3DDiff.DiffReport diffVersions(String objectId, int from, int to) {
        Geometry3D a = getGeometry(objectId, from);
        Geometry3D b = getGeometry(objectId, to);
        if (a == null || b == null) return null;
        return Geometry3DDiff.diff(a, b);
    }

    // =========================
    // JSON SNAPSHOT
    // =========================
    public String getGeometryAsJson(String objectId, int version) {
        Optional<Geometry3DModel> model = geometry3DRepository.findByObjectIdAndVersion(objectId, version);
        return model.map(Geometry3DModel::getGeometryJson).orElse(null);
    }

    // =========================
    // VERSION COUNT
    // =========================
    public int getVersionCount(String objectId) {
        return (int) geometry3DRepository.findByObjectId(objectId).size();
    }

    // =========================
    // CONFLICT CHECK
    // =========================
    public boolean hasConflict(String objectId, String siteId, int baseVersion) {
        List<Geometry3DModel> siteVersions = geometry3DRepository.findByObjectIdAndSiteId(objectId, siteId);
        if (siteVersions.isEmpty()) return false;
        
        int latestSiteVersion = siteVersions.stream()
                .mapToInt(Geometry3DModel::getVersion)
                .max()
                .orElse(0);
        
        return latestSiteVersion > baseVersion;
    }
}