#!/usr/bin/env mongosh
/**
 * CAD Versioning System - MongoDB Schema Initialization
 * Run on both Node A and Node B MongoDB instances
 * 
 * Usage:
 *   mongosh mongodb://localhost:27017 < mongo-init.js
 *   mongosh mongodb://admin:password@localhost:27017/cad_node_a --authenticationDatabase admin < mongo-init.js
 */

// Use the CAD database
const dbName = process.env.MONGO_INITDB_DATABASE || 'cad_node_a';
const db = db.getSiblingDB(dbName);

console.log(`Initializing ${dbName} database...`);

// ============================================================================
// 1. CAD MODELS COLLECTION
// ============================================================================
db.createCollection("cad_models", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "nodeId", "createdAt", "updatedAt"],
      properties: {
        _id: { bsonType: "string" },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        nodeId: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        currentVersionId: { bsonType: "string" },
        currentBranch: { bsonType: "string" },
        status: { 
          enum: ["active", "archived", "deleted"]
        },
        metadata: {
          bsonType: "object",
          properties: {
            fileFormat: { bsonType: "string" },
            fileSize: { bsonType: "long" },
            vertexCount: { bsonType: "int" },
            faceCount: { bsonType: "int" }
          }
        }
      }
    }
  }
});

console.log("✓ cad_models collection created");

// ============================================================================
// 2. VERSIONS COLLECTION (stores version metadata)
// ============================================================================
db.createCollection("versions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "modelId", "nodeId", "versionNumber", "timestamp"],
      properties: {
        _id: { bsonType: "string" },
        modelId: { bsonType: "string" },
        nodeId: { bsonType: "string" },
        versionNumber: { bsonType: "int" },
        timestamp: { bsonType: "date" },
        branch: { bsonType: "string" },
        parentVersionId: { bsonType: "string" },
        author: { bsonType: "string" },
        message: { bsonType: "string" },
        status: {
          enum: ["committed", "draft", "merged", "conflicted"]
        },
        hasConflict: { bsonType: "bool" },
        conflictWith: { bsonType: "string" },
        deltaId: { bsonType: "string" },
        geometryHash: { bsonType: "string" }
      }
    }
  }
});

console.log("✓ versions collection created");

// ============================================================================
// 3. GEOMETRIES COLLECTION (stores actual 3D geometry data)
// ============================================================================
db.createCollection("geometries", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "modelId", "versionId", "nodeId"],
      properties: {
        _id: { bsonType: "string" },
        modelId: { bsonType: "string" },
        versionId: { bsonType: "string" },
        nodeId: { bsonType: "string" },
        geometryType: { enum: ["full", "delta"] },
        data: { bsonType: "object" },
        checksum: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

console.log("✓ geometries collection created");

// ============================================================================
// 4. DELTAS COLLECTION (stores incremental changes)
// ============================================================================
db.createCollection("deltas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "fromVersionId", "toVersionId", "modelId"],
      properties: {
        _id: { bsonType: "string" },
        fromVersionId: { bsonType: "string" },
        toVersionId: { bsonType: "string" },
        modelId: { bsonType: "string" },
        nodeId: { bsonType: "string" },
        deltaData: { bsonType: "object" },
        sizeBytes: { bsonType: "long" },
        appliedCount: { bsonType: "int" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

console.log("✓ deltas collection created");

// ============================================================================
// 5. BRANCHES COLLECTION
// ============================================================================
db.createCollection("branches", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "modelId", "name"],
      properties: {
        _id: { bsonType: "string" },
        modelId: { bsonType: "string" },
        name: { bsonType: "string" },
        headVersionId: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        createdBy: { bsonType: "string" },
        isMain: { bsonType: "bool" }
      }
    }
  }
});

console.log("✓ branches collection created");

// ============================================================================
// 6. CONFLICTS COLLECTION
// ============================================================================
db.createCollection("conflicts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "modelId", "versionA", "versionB"],
      properties: {
        _id: { bsonType: "string" },
        modelId: { bsonType: "string" },
        versionA: { bsonType: "string" },
        versionB: { bsonType: "string" },
        nodeA: { bsonType: "string" },
        nodeB: { bsonType: "string" },
        status: { enum: ["detected", "resolved", "merged"] },
        resolutionStrategy: { 
          enum: ["BRANCH", "TIMESTAMP", "THREE_WAY_MERGE", "MANUAL"] 
        },
        resolvedVersionId: { bsonType: "string" },
        detectedAt: { bsonType: "date" },
        resolvedAt: { bsonType: "date" }
      }
    }
  }
});

console.log("✓ conflicts collection created");

// ============================================================================
// 7. SYNC HISTORY COLLECTION
// ============================================================================
db.createCollection("sync_history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "modelId", "sourceNode", "targetNode"],
      properties: {
        _id: { bsonType: "string" },
        modelId: { bsonType: "string" },
        sourceNode: { bsonType: "string" },
        targetNode: { bsonType: "string" },
        syncType: { enum: ["push", "pull"] },
        status: { enum: ["success", "failed", "pending"] },
        versionsTransferred: { bsonType: "array" },
        bytesTransferred: { bsonType: "long" },
        startTime: { bsonType: "date" },
        endTime: { bsonType: "date" },
        errorMessage: { bsonType: "string" }
      }
    }
  }
});

console.log("✓ sync_history collection created");

// ============================================================================
// 8. SYSTEM METRICS COLLECTION
// ============================================================================
db.createCollection("metrics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "timestamp", "nodeId"],
      properties: {
        _id: { bsonType: "string" },
        nodeId: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        totalModels: { bsonType: "int" },
        totalVersions: { bsonType: "int" },
        storageSizeBytes: { bsonType: "long" },
        deltaCompressionRatio: { bsonType: "double" },
        avgSyncTimeMs: { bsonType: "long" },
        conflictCount: { bsonType: "int" }
      }
    }
  }
});

console.log("✓ metrics collection created");

// ============================================================================
// CREATE INDEXES
// ============================================================================

// CAD Models Indexes
db.cad_models.createIndex({ nodeId: 1, status: 1 });
db.cad_models.createIndex({ createdAt: -1 });
db.cad_models.createIndex({ name: "text" });

console.log("✓ cad_models indexes created");

// Versions Indexes
db.versions.createIndex({ modelId: 1, versionNumber: 1 });
db.versions.createIndex({ modelId: 1, branch: 1 });
db.versions.createIndex({ nodeId: 1, timestamp: -1 });
db.versions.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
db.versions.createIndex({ geometryHash: 1 });

console.log("✓ versions indexes created");

// Geometries Indexes
db.geometries.createIndex({ modelId: 1, versionId: 1 });
db.geometries.createIndex({ nodeId: 1 });

console.log("✓ geometries indexes created");

// Deltas Indexes
db.deltas.createIndex({ fromVersionId: 1, toVersionId: 1 });
db.deltas.createIndex({ modelId: 1 });

console.log("✓ deltas indexes created");

// Branches Indexes
db.branches.createIndex({ modelId: 1, name: 1 });
db.branches.createIndex({ modelId: 1, isMain: 1 });

console.log("✓ branches indexes created");

// Conflicts Indexes
db.conflicts.createIndex({ modelId: 1, status: 1 });
db.conflicts.createIndex({ detectedAt: -1 });

console.log("✓ conflicts indexes created");

// Sync History Indexes
db.sync_history.createIndex({ modelId: 1, syncType: 1 });
db.sync_history.createIndex({ sourceNode: 1, targetNode: 1 });
db.sync_history.createIndex({ startTime: -1 });

console.log("✓ sync_history indexes created");

// Metrics Indexes
db.metrics.createIndex({ nodeId: 1, timestamp: -1 });

console.log("✓ metrics indexes created");

// ============================================================================
// CREATE VIEWS
// ============================================================================

// Latest versions per model
db.createView(
  "latest_versions",
  "versions",
  [
    { $sort: { modelId: 1, versionNumber: -1 } },
    { $group: { _id: "$modelId", latestVersion: { $first: "$$ROOT" } } }
  ]
);

console.log("✓ latest_versions view created");

// Active conflicts
db.createView(
  "active_conflicts",
  "conflicts",
  [
    { $match: { status: { $in: ["detected", "pending"] } } },
    { $sort: { detectedAt: -1 } }
  ]
);

console.log("✓ active_conflicts view created");

console.log("\n✅ MongoDB initialization complete!");
console.log(`Database: ${dbName}`);
console.log("Collections: 8");
console.log("Indexes: 20+");
console.log("Views: 2");
