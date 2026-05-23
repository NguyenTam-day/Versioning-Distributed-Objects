package org.example.cad.config;

import org.example.cad.domain.model.CadModel;
import org.example.cad.domain.model.Version;
import org.example.cad.repository.CadModelRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Data initialization configuration
 * Seeds initial test data into MongoDB on startup
 */
@Configuration
public class DataInitializationConfig {

    @Bean
    public CommandLineRunner initializeData(CadModelRepository repository) {
        return args -> {
            // Check if data already exists
            if (repository.count() > 0) {
                System.out.println("✓ Database already contains data, skipping initialization");
                return;
            }

            System.out.println("🌱 Seeding initial CAD models...");

            // Create test models
            CadModel model1 = new CadModel("cube-v1", "Cube Model - Version 1");
            Version v1 = new Version();
            v1.setVersionNumber(1);
            v1.setGeometryData("v 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0");
            v1.setTimestamp(System.currentTimeMillis());
            v1.setSiteId("node_a");
            v1.setFullSnapshot(true);
            model1.addVersion(v1);

            CadModel model2 = new CadModel("cylinder-v1", "Cylinder Model - Version 1");
            Version v2 = new Version();
            v2.setVersionNumber(1);
            v2.setGeometryData("v 0 0 0\nv 1 0 0\nv 0.5 1 0");
            v2.setTimestamp(System.currentTimeMillis());
            v2.setSiteId("node_a");
            v2.setFullSnapshot(true);
            model2.addVersion(v2);

            repository.save(model1);
            repository.save(model2);

            System.out.println("✓ Database initialized with " + repository.count() + " models");
        };
    }
}

