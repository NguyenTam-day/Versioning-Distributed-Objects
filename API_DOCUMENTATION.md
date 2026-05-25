# Distributed CAD Versioning System - REST API Documentation

## Base URLs
- **Node A**: `http://localhost:5000/api`
- **Node B**: `http://localhost:5001/api`
- **Docker**: `http://node-a:5000/api`, `http://node-b:5001/api`

---

## CAD Model Management

### List All Models
```
GET /cad/list
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cube-model",
      "name": "Cube Model",
      "nodeId": "node_a",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:45:00Z",
      "currentVersionId": "v5",
      "currentBranch": "main",
      "status": "active",
      "metadata": {
        "fileFormat": "obj",
        "fileSize": 1024,
        "vertexCount": 8,
        "faceCount": 6
      }
    }
  ]
}
```

---

### Get Model Details
```
GET /cad/{modelId}
```

**Path Parameters**:
- `modelId` (string, required): Model identifier

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cube-model",
    "name": "Cube Model",
    "description": "A 3D cube model",
    "nodeId": "node_a",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z",
    "currentVersionId": "v5",
    "currentBranch": "main",
    "status": "active"
  }
}
```

---

### Create Model
```
POST /cad/create
```

**Request Body**:
```json
{
  "name": "Sphere Model",
  "description": "A 3D sphere",
  "fileFormat": "obj"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "sphere-model-1234",
    "name": "Sphere Model",
    "nodeId": "node_a",
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## File Upload & Geometry

### Upload OBJ File
```
POST /geometry/upload
```

**Parameters**:
- `objectId` (string, required): Model ID
- `file` (file, required): OBJ file
- `siteId` (string, optional): Node identifier (default: node_a)

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/geometry/upload \
  -F "objectId=cube-model" \
  -F "siteId=node_a" \
  -F "file=@cube-v1.obj"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "objectId": "cube-model",
    "versionNumber": 1,
    "versionId": "v1",
    "timestamp": "2024-01-15T10:30:00Z",
    "geometryData": {
      "vertices": [
        {"x": 0, "y": 0, "z": 0},
        {"x": 1, "y": 0, "z": 0},
        ...
      ],
      "faces": [
        [0, 1, 2],
        [1, 2, 3],
        ...
      ]
    },
    "metadata": {
      "vertexCount": 8,
      "faceCount": 6,
      "fileSize": 1024
    }
  }
}
```

---

### Parse OBJ to Structured JSON
```
POST /geometry/parse
```

**Request Body**:
```json
{
  "objContent": "v 0 0 0\nv 1 0 0\n...",
  "modelId": "cube-model"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "objects": [
      {
        "id": "cube_1",
        "type": "mesh",
        "vertices": [...],
        "faces": [...],
        "metadata": {
          "vertexCount": 8,
          "faceCount": 6
        }
      }
    ]
  }
}
```

---

### Get Geometry Data
```
GET /geometry/{modelId}/{versionId}
```

**Path Parameters**:
- `modelId` (string, required): Model ID
- `versionId` (string, required): Version ID (e.g., "v1")

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "modelId": "cube-model",
    "versionId": "v1",
    "geometryType": "full",
    "data": {
      "objects": [...]
    },
    "checksum": "a1b2c3d4e5f6"
  }
}
```

---

## Version Management

### Get Version History
```
GET /version/{modelId}/history
```

**Query Parameters**:
- `branch` (string, optional): Filter by branch name
- `limit` (integer, optional): Max results (default: 50)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "versionId": "v1",
      "versionNumber": 1,
      "timestamp": "2024-01-15T10:30:00Z",
      "branch": "main",
      "parentVersionId": null,
      "author": "user@example.com",
      "message": "Initial commit",
      "status": "committed",
      "hasConflict": false
    },
    {
      "versionId": "v2",
      "versionNumber": 2,
      "timestamp": "2024-01-15T11:00:00Z",
      "branch": "main",
      "parentVersionId": "v1",
      "author": "user@example.com",
      "message": "Updated vertices",
      "status": "committed",
      "hasConflict": false
    }
  ],
  "total": 2
}
```

---

### Get Current Version
```
GET /version/{modelId}/current
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "versionId": "v2",
    "versionNumber": 2,
    "branch": "main",
    "timestamp": "2024-01-15T11:00:00Z"
  }
}
```

---

### Commit Changes
```
POST /version/commit
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "message": "Updated cube dimensions",
  "author": "user@example.com",
  "geometryData": {
    "objects": [...]
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "versionId": "v3",
    "versionNumber": 3,
    "timestamp": "2024-01-15T12:00:00Z",
    "message": "Updated cube dimensions",
    "parentVersionId": "v2",
    "deltaSize": 256
  }
}
```

---

### Checkout Version
```
POST /version/checkout
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "versionId": "v1"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "modelId": "cube-model",
    "checkedOutVersionId": "v1",
    "geometryData": {
      "objects": [...]
    }
  }
}
```

---

## Geometry Diff

### Compare Two Versions
```
POST /geometry/diff
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "fromVersionId": "v1",
  "toVersionId": "v2"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "fromVersion": "v1",
    "toVersion": "v2",
    "summary": {
      "verticesAdded": 2,
      "verticesRemoved": 0,
      "verticesModified": 1,
      "facesAdded": 0,
      "facesRemoved": 0,
      "facesModified": 2
    },
    "changes": {
      "vertices": [
        {
          "type": "ADDED",
          "index": 8,
          "value": {"x": 1, "y": 1, "z": 1}
        },
        {
          "type": "MODIFIED",
          "index": 0,
          "oldValue": {"x": 0, "y": 0, "z": 0},
          "newValue": {"x": 0.1, "y": 0, "z": 0}
        }
      ],
      "faces": [...]
    },
    "deltaSize": 256
  }
}
```

---

## Branching & Merging

### List Branches
```
GET /branch/{modelId}/list
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "branchId": "main",
      "name": "main",
      "headVersionId": "v3",
      "createdAt": "2024-01-15T10:30:00Z",
      "isMain": true
    },
    {
      "branchId": "feature/enhanced",
      "name": "feature/enhanced",
      "headVersionId": "v2b",
      "createdAt": "2024-01-15T11:00:00Z",
      "isMain": false
    }
  ]
}
```

---

### Create Branch
```
POST /branch/create
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "branchName": "feature/enhanced",
  "fromVersionId": "v2"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "branchId": "feature/enhanced",
    "name": "feature/enhanced",
    "headVersionId": "v2",
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### Merge Branches
```
POST /branch/merge
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "sourceBranch": "feature/enhanced",
  "targetBranch": "main",
  "strategy": "THREE_WAY_MERGE"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "mergeStatus": "SUCCESS",
    "resultVersionId": "v4",
    "mergedBranches": ["feature/enhanced", "main"],
    "timestamp": "2024-01-15T12:30:00Z"
  }
}
```

---

## Conflict Management

### Get Conflicts
```
GET /conflict/list
```

**Query Parameters**:
- `modelId` (string, optional): Filter by model
- `status` (string, optional): "detected", "resolved", "merged"

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "conflictId": "conflict_1",
      "modelId": "cube-model",
      "versionA": "v2a",
      "versionB": "v2b",
      "nodeA": "node_a",
      "nodeB": "node_b",
      "status": "detected",
      "detectedAt": "2024-01-15T11:45:00Z"
    }
  ]
}
```

---

### Resolve Conflict
```
POST /conflict/resolve
```

**Request Body**:
```json
{
  "conflictId": "conflict_1",
  "strategy": "THREE_WAY_MERGE"
}
```

**Supported Strategies**:
- `BRANCH` - Create separate branches
- `TIMESTAMP` - Use latest version
- `THREE_WAY_MERGE` - Intelligent merge

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conflictId": "conflict_1",
    "status": "resolved",
    "resolutionStrategy": "THREE_WAY_MERGE",
    "resultVersionId": "v3_merged",
    "resolvedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## Synchronization

### Push to Remote Node
```
POST /sync/push
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "targetNode": "node_b",
  "fromVersionId": "v1"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "syncId": "sync_push_123",
    "modelId": "cube-model",
    "sourceNode": "node_a",
    "targetNode": "node_b",
    "syncType": "push",
    "status": "success",
    "versionsTransferred": ["v1", "v2", "v3"],
    "bytesTransferred": 2048,
    "startTime": "2024-01-15T12:00:00Z",
    "endTime": "2024-01-15T12:00:05Z"
  }
}
```

---

### Pull from Remote Node
```
POST /sync/pull
```

**Request Body**:
```json
{
  "modelId": "cube-model",
  "sourceNode": "node_a"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "syncId": "sync_pull_456",
    "modelId": "cube-model",
    "sourceNode": "node_a",
    "targetNode": "node_b",
    "syncType": "pull",
    "status": "success",
    "versionsTransferred": ["v1", "v2"],
    "bytesTransferred": 512,
    "previousVersion": "v1",
    "currentVersion": "v2",
    "startTime": "2024-01-15T12:05:00Z",
    "endTime": "2024-01-15T12:05:03Z"
  }
}
```

---

### Get Sync History
```
GET /sync-history
```

**Query Parameters**:
- `modelId` (string, optional): Filter by model
- `syncType` (string, optional): "push" or "pull"
- `status` (string, optional): "success", "failed", "pending"
- `limit` (integer, optional): Max results (default: 50)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "syncId": "sync_pull_456",
      "modelId": "cube-model",
      "sourceNode": "node_a",
      "targetNode": "node_b",
      "syncType": "pull",
      "status": "success",
      "bytesTransferred": 512,
      "startTime": "2024-01-15T12:05:00Z",
      "endTime": "2024-01-15T12:05:03Z"
    }
  ]
}
```

---

## Delta Operations

### Get Delta Between Versions
```
GET /delta/{modelId}/{fromVersionId}/{toVersionId}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deltaId": "delta_v1_v2",
    "fromVersionId": "v1",
    "toVersionId": "v2",
    "deltaData": {
      "vertexChanges": [
        {"type": "ADD", "index": 8, "value": {"x": 1, "y": 1, "z": 1}},
        {"type": "MODIFY", "index": 0, "oldValue": {...}, "newValue": {...}}
      ],
      "faceChanges": [...]
    },
    "sizeBytes": 256,
    "compressionRatio": 0.85
  }
}
```

---

### Apply Delta
```
POST /delta/apply
```

**Request Body**:
```json
{
  "toVersionId": "v2",
  "currentVersionData": {...}
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "resultGeometry": {...},
    "appliedChanges": 5,
    "verifiedChecksum": true
  }
}
```

---

## Metrics & Monitoring

### Get Node Health
```
GET /health
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "nodeId": "node_a",
    "timestamp": "2024-01-15T12:00:00Z",
    "database": "CONNECTED",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

---

### Get Storage Metrics
```
GET /metrics/storage
```

**Query Parameters**:
- `modelId` (string, optional): Filter by model

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalModels": 5,
    "totalVersions": 25,
    "totalStorage": {
      "fullSnapshotSize": 12800,
      "deltaStorageSize": 2048,
      "indexSize": 1024
    },
    "compressionRatio": 0.84,
    "averageVersionSize": 512
  }
}
```

---

### Get Sync Performance Metrics
```
GET /metrics/sync
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalSyncOperations": 42,
    "successfulSyncs": 40,
    "failedSyncs": 2,
    "averageSyncTime": 2500,
    "totalBytesTransferred": 102400,
    "averageBytesPerSync": 2438
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "Model with ID 'cube-model' not found",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `MODEL_NOT_FOUND` | 404 | Model does not exist |
| `VERSION_NOT_FOUND` | 404 | Version not found |
| `CONFLICT_DETECTED` | 409 | Conflict needs resolution |
| `INVALID_FILE_FORMAT` | 400 | File format not supported |
| `SYNC_FAILED` | 500 | Synchronization error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting & Quotas

- **Requests/minute**: 1000 per node
- **Upload size limit**: 100MB per file
- **Concurrent syncs**: 10 per node
- **Storage limit**: 10GB per node (configurable)

---

## Example Workflows

### Complete Sync Workflow
```bash
# 1. Upload model on Node A
curl -X POST http://localhost:5000/api/geometry/upload \
  -F "objectId=my-model" \
  -F "file=@model.obj"

# 2. Make changes and commit
curl -X POST http://localhost:5000/api/version/commit \
  -H "Content-Type: application/json" \
  -d '{"modelId":"my-model","message":"Update v1","geometryData":{...}}'

# 3. Push to Node B
curl -X POST http://localhost:5000/api/sync/push \
  -H "Content-Type: application/json" \
  -d '{"modelId":"my-model","targetNode":"node_b"}'

# 4. Verify Node B has latest version
curl http://localhost:5001/api/version/my-model/current
```

---

## Authentication (Future Enhancement)
Future versions will include JWT token authentication:
```
Authorization: Bearer <token>
```

