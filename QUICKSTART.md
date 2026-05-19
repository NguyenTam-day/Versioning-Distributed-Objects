# Quick Reference Guide

## Project Structure

```
distributed_cad_versioning/
├── IMPLEMENTATION.md          ← Full technical documentation
├── RESULTS.md                 ← Implementation summary & metrics
├── QUICKSTART.md              ← This file
├── sample-files/              ← Sample OBJ geometry files
│   ├── cube-v1.obj
│   └── cube-v2.obj
├── scripts/shared/            ← Shared utilities & demos
│   ├── pom.xml
│   └── src/main/java/org/example/
│       ├── dv/                ← Core models & utilities
│       │   ├── Geometry3D.java
│       │   ├── Delta.java
│       │   ├── ObjParser.java
│       │   ├── DeltaUtil.java
│       │   ├── Geometry3DDiff.java
│       │   ├── ConflictResolver.java
│       │   └── ...
│       ├── MainDemo.java      ← Conflict resolution demo
│       ├── Geometry3DDemo.java ← In-memory geometry demo
│       ├── FileBasedGeometry3DDemo.java ← File-based geometry demo
│       └── IntegrationDemo.java ← Multi-site integration demo
├── node_a/                    ← Site A (Spring Boot node)
│   └── src/main/java/org/example/cad/
│       ├── service/geometry/Geometry3DService.java
│       ├── controller/GeometryController.java
│       └── dto/response/
│           ├── GeometryVersionResponse.java
│           └── GeometryDiffResponse.java
├── node_b/                    ← Site B (Spring Boot node)
│   └── src/main/java/org/example/cad/
│       ├── service/geometry/Geometry3DService.java
│       ├── controller/GeometryController.java
│       └── dto/response/
│           ├── GeometryVersionResponse.java
│           └── GeometryDiffResponse.java
├── run_demo.py                ← Script to run file-based demo
└── run_integration_demo.py    ← Script to run integration demo
```

## Running Demos

### Setup
```bash
# Download GSON dependency (done automatically in scripts)
cd C:\Users\User\IdeaProjects\distributed_cad_versioning
mkdir lib
# Download: https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar
# Or use: Invoke-WebRequest -Uri ... -OutFile lib/gson-2.10.1.jar

# Compile all Java files
javac -d target -cp "lib/gson-2.10.1.jar" \
  scripts/shared/src/main/java/org/example/dv/*.java \
  scripts/shared/src/main/java/org/example/*.java \
  node_a/src/main/java/org/example/cad/service/geometry/Geometry3DService.java \
  node_a/src/main/java/org/example/cad/controller/GeometryController.java \
  node_a/src/main/java/org/example/cad/dto/response/*.java
```

### Demo 1: Basic Diff Analysis
```bash
# Parse OBJ files and show diff
python run_demo.py

# Output:
# - Loads cube-v1.obj and cube-v2.obj
# - Shows JSON representations
# - Displays 6 vertex modifications, 1 addition, 1 face addition
# - Storage metrics: 10 versions → 49.6% savings with delta storage
```

### Demo 2: In-Memory Geometry
```bash
java -cp target;lib/gson-2.10.1.jar org.example.Geometry3DDemo

# Output:
# - Creates sample geometries programmatically
# - Shows BRANCH vs TIMESTAMP conflict resolution
# - Displays storage comparison for 10 versions
```

### Demo 3: File-Based Integration
```bash
python run_demo.py  # Same as Demo 1

# Output:
# - Loads actual OBJ files from disk
# - Parses geometries into JSON
# - Computes diff between versions
# - Simulates 10-version scenario
```

### Demo 4: Multi-Site Scenario
```bash
python run_integration_demo.py

# Output:
# - Site A uploads cube-v1 (v1) and cube-v2 (v2)
# - Site A computes diff: 6 modifications, 1 addition, 1 face addition
# - Site B attempts checkout: conflict detected
# - Shows TIMESTAMP and BRANCHING resolution strategies
# - Displays storage analysis
```

## Key Metrics

### Storage Savings (10 versions)
| Strategy | Size | Savings |
|----------|------|---------|
| Full Snapshots | 10,460 bytes | baseline |
| Delta Storage | 5,276 bytes | **49.6%** |

### Diff Results (cube-v1 → cube-v2)
| Type | Count |
|------|-------|
| Vertex Modifications | 6 |
| Vertex Additions | 1 |
| Vertex Deletions | 0 |
| Face Additions | 1 |
| Face Deletions | 0 |

### Performance
| Operation | Time |
|-----------|------|
| OBJ Parsing | <1ms |
| Diff Computation | <1ms |
| Delta Creation | <1ms |
| Delta Application | <1ms |

## API Usage (When Integrated with Spring Boot)

### Upload Geometry
```bash
curl -X POST -F "file=@cube.obj" \
  http://localhost:5000/api/geometry/part-001/upload

Response:
{
  "objectId": "part-001",
  "versionNumber": 1,
  "name": "cube.obj",
  "format": "OBJ",
  "vertexCount": 8,
  "faceCount": 6,
  "jsonRepresentation": {...}
}
```

### Get All Versions
```bash
curl http://localhost:5000/api/geometry/part-001/versions

Response:
[
  {"versionNumber": 1, "vertexCount": 8, "faceCount": 6},
  {"versionNumber": 2, "vertexCount": 9, "faceCount": 7}
]
```

### Get Specific Version
```bash
curl http://localhost:5000/api/geometry/part-001/version/1

Response:
{
  "objectId": "part-001",
  "versionNumber": 1,
  "vertexCount": 8,
  "faceCount": 6,
  "jsonRepresentation": {
    "vertices": [...],
    "faces": [...]
  }
}
```

### Compute Diff Between Versions
```bash
curl "http://localhost:5000/api/geometry/part-001/diff?from=1&to=2"

Response:
{
  "objectId": "part-001",
  "fromVersion": 1,
  "toVersion": 2,
  "oldVertexCount": 8,
  "newVertexCount": 9,
  "vertexModifications": 6,
  "vertexAdditions": 1,
  "vertexDeletions": 0,
  "vertexChanges": [
    {
      "index": 1,
      "type": "modified",
      "oldValue": "(1.00, 0.00, 0.00)",
      "newValue": "(1.50, 0.00, 0.00)"
    },
    ...
  ],
  "faceChanges": [...]
}
```

## Key Classes & Methods

### ObjParser
```java
// Parse OBJ content from string
Geometry3D geom = ObjParser.parse(objContent);

// Parse OBJ from file input stream
Geometry3D geom = ObjParser.parseFromInputStream(stream, filename);
```

### Geometry3D
```java
// Serialize to JSON
String json = geometry.toJson();

// Deserialize from JSON
Geometry3D geom = Geometry3D.fromJson(jsonString);

// Access geometry data
List<Vertex> vertices = geometry.getVertices();
List<Face> faces = geometry.getFaces();
```

### Geometry3DDiff
```java
// Compare two geometries
DiffReport report = Geometry3DDiff.diff(geometry1, geometry2);

// Access diff results
report.vertexAdditions      // int count
report.vertexModifications  // int count
report.vertexDeletions      // int count
report.vertexChanges        // List<VertexChange>
report.faceAdditions        // int count
report.faceChanges          // List<FaceChange>

// Serialize to JSON
String json = report.toJson();
```

### DeltaUtil
```java
// Create delta between two versions
Delta delta = DeltaUtil.createDelta(baseGeometry, modifiedGeometry);

// Apply delta to base to reconstruct modified version
Geometry3D reconstructed = DeltaUtil.applyDelta(baseGeometry, delta);

// Get delta size in bytes
int sizeInBytes = delta.getSizeBytes();
```

### ConflictResolver
```java
// Resolve conflicts using branching strategy
List<Version> branches = ConflictResolver.resolve(
    conflictingVersions, 
    ConflictResolutionStrategy.BRANCH
);

// Resolve conflicts using last-writer-wins
List<Version> winner = ConflictResolver.resolve(
    conflictingVersions, 
    ConflictResolutionStrategy.TIMESTAMP
);
```

### Geometry3DService
```java
// Upload and parse geometry
String result = service.uploadGeometry(objectId, inputStream, filename);

// Get specific version
Geometry3D geom = service.getGeometry(objectId, versionNumber);

// Get all versions
List<Geometry3D> versions = service.getAllVersions(objectId);

// Compute diff
DiffReport diff = service.diffVersions(objectId, fromVersion, toVersion);

// Get version count
int count = service.getVersionCount(objectId);
```

## Conflict Resolution Strategies Comparison

### Strategy 1: BRANCHING (Git-like)
```
Pros:
  ✓ No data loss - all changes preserved
  ✓ Deterministic - no ordering issues
  ✓ Allows manual review and merge
  ✓ Good for collaborative editing

Cons:
  ✗ Requires manual intervention
  ✗ Creates complexity with many branches
  ✗ Merge conflicts may be hard to resolve
```

### Strategy 2: TIMESTAMP (Last-Writer-Wins)
```
Pros:
  ✓ Automatic resolution - no user interaction
  ✓ Simple logic - easily understandable
  ✓ Good for distributed systems without strong consistency
  ✓ Fast O(1) resolution

Cons:
  ✗ One version's changes lost (potential data loss)
  ✗ Requires synchronized clocks
  ✗ May lose important edits from earlier committer
  ✗ Not suitable for critical CAD designs
```

## Integration Checklist

- [ ] Copy shared/src/main/java/org/example/dv/*.java to common module
- [ ] Add pom.xml dependency: `com.google.code.gson:gson:2.10.1`
- [ ] Copy Geometry3DService to node_a and node_b
- [ ] Copy GeometryController to node_a and node_b
- [ ] Create DTOs (GeometryVersionResponse, GeometryDiffResponse)
- [ ] Add Spring @RestController annotation to GeometryController
- [ ] Add @RequestMapping("/api/geometry") to controller
- [ ] Wire GeometryService into Spring context
- [ ] Create GeometryRepository (extends MongoRepository)
- [ ] Add database migration for Geometry collection
- [ ] Test API endpoints with curl or Postman
- [ ] Add unit tests for diff accuracy
- [ ] Add performance benchmarks
- [ ] Document custom conflict resolution logic

## Troubleshooting

### Q: GSON jar not found
**A:** Download from: https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar
Place in `lib/` directory

### Q: OBJ file parse error
**A:** Ensure OBJ file format:
- Lines starting with `v` specify vertices (v x y z)
- Lines starting with `f` specify faces (f v1 v2 v3...)
- Check sample files in `sample-files/` for examples

### Q: Diff shows unexpected changes
**A:** This is normal. The diff compares all vertices in order.
If vertex count changes, subsequent indices shift.
Solution: Implement vertex matching by proximity instead of index.

### Q: Delta size larger than full snapshot
**A:** This can happen for completely rewritten objects.
Solution: Implement periodic full snapshots (every N versions)
to reset the delta chain.

## Next Steps

1. Integration with Spring Boot (add @RestController, @Service)
2. MongoDB persistence (add @Document, repository)
3. Network synchronization (push/pull protocol)
4. Three-way merge (for non-conflicting changes)
5. Binary diff (xdelta integration)
6. Web UI (visual diff viewer)
7. Performance optimization (batch operations)
8. Monitoring & metrics (storage tracking)

