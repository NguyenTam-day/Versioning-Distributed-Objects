import axios from "axios";

// ======================================================
// Node URL registry
// ======================================================

export const NODE_URLS = {
    "node-a": process.env.REACT_APP_API_NODE_A || "http://localhost:5000/api",
    "node-b": process.env.REACT_APP_API_NODE_B || "http://localhost:5001/api",
};

export const VALID_NODES = Object.keys(NODE_URLS);

// ======================================================
// API factory — trả về một axios instance bất biến
// Không còn setNode(), không còn singleton mutable
// ======================================================

export function createApiForNode(nodeName) {
    if (!NODE_URLS[nodeName]) {
        throw new Error(`Unknown node: ${nodeName}. Valid nodes: ${VALID_NODES.join(", ")}`);
    }

    return axios.create({
        baseURL: NODE_URLS[nodeName],
        timeout: 10000,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

// ======================================================
// Node API builder — đóng gói tất cả API calls
// vào một object gắn với một node cụ thể
// ======================================================

export function createNodeApi(nodeName) {
    const api = createApiForNode(nodeName);

    return {

        // ─── Metadata ────────────────────────────────
        nodeName,
        baseURL: NODE_URLS[nodeName],

        // ─── Geometry APIs ────────────────────────────

        uploadGeometry(arg1, file, parentVersion = null, branchName = null) {
            let objectId = arg1;
            let finalFile = file;
            let finalParent = parentVersion;
            let finalBranch = branchName;

            // Support object signature: api.uploadGeometry({ objectId, file, parentVersion, branchName })
            if (typeof arg1 === "object" && arg1 !== null && file === undefined) {
                objectId = arg1.objectId;
                finalFile = arg1.file;
                finalParent = arg1.parentVersion;
                finalBranch = arg1.branchName;
            }

            const formData = new FormData();
            formData.append("objectId", objectId);
            formData.append("file", finalFile);
            if (finalParent) {
                formData.append("parentVersion", finalParent);
            }
            if (finalBranch) {
                formData.append("branchName", finalBranch);
            }

            return api.post("/geometry/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000,
            });
        },

        getAllVersions(objectId) {
            return api.get(`/geometry/${objectId}/versions`);
        },

        getVersion(objectId, versionNumber) {
            return api.get(`/geometry/${objectId}/version/${versionNumber}`);
        },

        diffVersions(objectId, fromVersion, toVersion) {
            return api.get(`/geometry/${objectId}/diff`, {
                params: { from: fromVersion, to: toVersion },
            });
        },

        // ─── CAD Model APIs ───────────────────────────

        createModel(data) {
            return api.post("/cad/create", data);
        },

        getModel(modelId) {
            return api.get(`/cad/${modelId}`);
        },

        listModels() {
            return api.get("/cad/list");
        },

        // ─── Version APIs ─────────────────────────────

        checkout(modelId, branchName = "main") {
            return api.post("/version/checkout", { modelId, branchName });
        },

        checkin(modelId, version, commitMessage, geometry) {
            return api.post("/version/checkin", {
                modelId,
                version,
                commitMessage,
                geometry,
            });
        },

        getHistory(modelId) {
            return api.get(`/version/${modelId}/history`);
        },

        getBranches(modelId) {
            return api.get(`/version/${modelId}/branches`);
        },

        // ─── Conflict APIs ────────────────────────────

        getConflicts(modelId) {
            return api.get(`/conflict/${modelId}/list`);
        },

        resolveConflict(conflictId, strategy, data = {}) {
            return api.post(`/conflict/${conflictId}/resolve`, {
                strategy,
                ...data,
            });
        },

        getConflictDetails(conflictId) {
            return api.get(`/conflict/${conflictId}`);
        },

        // ─── Sync APIs ────────────────────────────────

        push(modelId, targetNode) {
            return api.post("/sync/push", { modelId, targetNode });
        },

        pull(modelId, sourceNode) {
            return api.post("/sync/pull", { modelId, sourceNode });
        },

        getSyncStatus() {
            return api.get("/sync/status");
        },

        enableSync() {
            return api.post("/sync/enable");
        },

        disableSync() {
            return api.post("/sync/disable");
        },

        // ─── Demo / Analysis APIs ─────────────────────────────

        getVersionChain(modelId) {
            return api.get(`/version/${modelId}/chain`);
        },

        restoreVersion(modelId, versionNumber) {
            return api.get(`/version/${modelId}/restore/${versionNumber}`);
        },

        benchmarkVersion(modelId, versionNumber) {
            return api.get(`/version/${modelId}/benchmark/${versionNumber}`);
        },

        getVersionDelta(modelId, versionNumber) {
            return api.get(`/version/${modelId}/delta/${versionNumber}`);
        },
    };
}