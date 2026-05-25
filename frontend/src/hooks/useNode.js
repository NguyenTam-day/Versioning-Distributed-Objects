import { useContext } from "react";
import { NodeContext } from "../context/NodeContext";

// ======================================================
// useNode — hook đọc NodeContext
//
// Trả về: { currentNode, setCurrentNode, api }
//
// - currentNode: "node-a" | "node-b"
// - api: object chứa tất cả API methods cho node hiện tại
// - setCurrentNode: fn để đổi node (nếu cần)
// ======================================================

export const useNode = () => {

    const context = useContext(NodeContext);

    if (!context) {
        throw new Error(
            "useNode phải được gọi bên trong <NodeProvider>. " +
            "Hãy đảm bảo component được wrap bởi NodeProvider."
        );
    }

    return context;
};