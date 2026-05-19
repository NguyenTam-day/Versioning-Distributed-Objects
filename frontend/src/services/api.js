import axios from 'axios';

const API_NODE_A = process.env.REACT_APP_API_NODE_A || 'http://localhost:5000/api';
const API_NODE_B = process.env.REACT_APP_API_NODE_B || 'http://localhost:5001/api';

class GeometryService {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.api = axios.create({
            baseURL: apiBase,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Upload a 3D file (OBJ, STL, etc.)
     */
    uploadGeometry(objectId, file) {
        const formData = new FormData();
        formData.append('objectId', objectId);
        formData.append('file', file);

        return axios.post(`${this.apiBase}/geometry/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
        });
    }

    /**
     * Get all versions of a geometry object
     */
    getAllVersions(objectId) {
        return this.api.get(`/geometry/${objectId}/versions`);
    }

    /**
     * Get a specific version
     */
    getVersion(objectId, versionNumber) {
        return this.api.get(`/geometry/${objectId}/version/${versionNumber}`);
    }

    /**
     * Compute diff between two versions
     */
    diffVersions(objectId, fromVersion, toVersion) {
        return this.api.get(`/geometry/${objectId}/diff`, {
            params: {
                from: fromVersion,
                to: toVersion,
            },
        });
    }

    /**
     * Get geometry count (total versions)
     */
    getGeometryCount(objectId) {
        return this.api.get(`/geometry/${objectId}/count`);
    }
}

class VersionService {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.api = axios.create({
            baseURL: apiBase,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Create a new CAD model
     */
    createModel(data) {
        return this.api.post('/cad/create', data);
    }

    /**
     * Get model info
     */
    getModel(modelId) {
        return this.api.get(`/cad/${modelId}`);
    }

    /**
     * List all models
     */
    listModels() {
        return this.api.get('/cad/list');
    }

    /**
     * Checkout model (get for editing)
     */
    checkout(modelId, branchName = 'main') {
        return this.api.post('/version/checkout', {
            modelId,
            branchName,
        });
    }

    /**
     * Checkin model (submit changes)
     */
    checkin(modelId, version, commitMessage, geometry) {
        return this.api.post('/version/checkin', {
            modelId,
            version,
            commitMessage,
            geometry,
        });
    }

    /**
     * Get version history
     */
    getHistory(modelId) {
        return this.api.get(`/version/${modelId}/history`);
    }

    /**
     * Get branches
     */
    getBranches(modelId) {
        return this.api.get(`/version/${modelId}/branches`);
    }
}

class ConflictService {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.api = axios.create({
            baseURL: apiBase,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get conflicts for a model
     */
    getConflicts(modelId) {
        return this.api.get(`/conflict/${modelId}/list`);
    }

    /**
     * Resolve conflict (with strategy: BRANCH, TIMESTAMP, MANUAL)
     */
    resolveConflict(conflictId, strategy, data) {
        return this.api.post(`/conflict/${conflictId}/resolve`, {
            strategy,
            ...data,
        });
    }

    /**
     * Get conflict details
     */
    getConflictDetails(conflictId) {
        return this.api.get(`/conflict/${conflictId}`);
    }
}

class SyncService {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.api = axios.create({
            baseURL: apiBase,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Push changes to remote node
     */
    push(modelId, targetNode) {
        return this.api.post('/sync/push', {
            modelId,
            targetNode,
        });
    }

    /**
     * Pull changes from remote node
     */
    pull(modelId, sourceNode) {
        return this.api.post('/sync/pull', {
            modelId,
            sourceNode,
        });
    }

    /**
     * Get sync status
     */
    getSyncStatus(modelId) {
        return this.api.get(`/sync/status/${modelId}`);
    }
}

// Export instances for both nodes
export const geometryServiceNodeA = new GeometryService(API_NODE_A);
export const geometryServiceNodeB = new GeometryService(API_NODE_B);

export const versionServiceNodeA = new VersionService(API_NODE_A);
export const versionServiceNodeB = new VersionService(API_NODE_B);

export const conflictServiceNodeA = new ConflictService(API_NODE_A);
export const conflictServiceNodeB = new ConflictService(API_NODE_B);

export const syncServiceNodeA = new SyncService(API_NODE_A);
export const syncServiceNodeB = new SyncService(API_NODE_B);

export default {
    nodeA: {
        geometry: geometryServiceNodeA,
        version: versionServiceNodeA,
        conflict: conflictServiceNodeA,
        sync: syncServiceNodeA,
    },
    nodeB: {
        geometry: geometryServiceNodeB,
        version: versionServiceNodeB,
        conflict: conflictServiceNodeB,
        sync: syncServiceNodeB,
    },
};
