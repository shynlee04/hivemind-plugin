export interface WikiNode {
    id: string;
    title: string;
    children?: WikiNode[];
}

export class HierarchyWiki {
    rootNode: WikiNode;
    currentNode: WikiNode;
    private nodeMap: Map<string, WikiNode> = new Map();

    constructor(rootNode: WikiNode) {
        this.rootNode = rootNode;
        this.currentNode = rootNode;
        this.buildNodeMap(rootNode);
    }

    private buildNodeMap(node: WikiNode) {
        this.nodeMap.set(node.id, node);
        if (node.children) {
            for (const child of node.children) {
                this.buildNodeMap(child);
            }
        }
    }

    navigate(nodeId: string): void {
        const node = this.nodeMap.get(nodeId);
        if (node) {
            this.currentNode = node;
        }
    }
}
