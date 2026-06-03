import {
    createContext,
    useState,
    useMemo,
} from "react";

import { createNodeApi, VALID_NODES } from "../services/api";

// ======================================================
// NodeContext — source of truth duy nhất cho node state
// Expose: currentNode, setCurrentNode, api
// ======================================================

export const NodeContext = createContext(null);

export function NodeProvider({ initialNode = "node-a", children }) {

    if (!VALID_NODES.includes(initialNode)) {
        console.warn(
            `NodeProvider: initialNode "${initialNode}" không hợp lệ. Dùng "node-a".`
        );
        initialNode = "node-a";
    }

    const [currentNode, setCurrentNode] = useState(initialNode);

    // api instance được tạo lại khi currentNode thay đổi
    // useMemo đảm bảo không tạo thừa instance
    const api = useMemo(() => createNodeApi(currentNode), [currentNode]);

    const value = {
        currentNode,
        setCurrentNode,
        api,
    };

    return (
        <NodeContext.Provider value={value}>
            {children}
        </NodeContext.Provider>
    );
}