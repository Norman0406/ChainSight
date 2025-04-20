import { useCallback, useEffect, useRef, useState } from 'react';
import ForceGraph2D, { LinkObject, NodeObject } from 'react-force-graph-2d';
import { useDataFetching } from '../utils/FetchData';
import { AddressNode, BalanceType, NodeBase, NodeEdge, NodeType, StartNode } from '../utils/Node';
import { dynamicSizeFromValue, satsToBtc } from '../utils/Bitcoin';

interface TransactionInputProps {
    startTransaction: string;
}

export default function TransationGraph(input: TransactionInputProps) {
    const [dataNodes, dataEdges, load, loadAddress] = useDataFetching();
    const [nodes, setNodes] = useState(new Array<NodeObject>());
    const [links, setLinks] = useState(new Array<LinkObject>());

    useEffect(() => {
        const transformedNodes = dataNodes.map((dataNode: NodeBase): NodeObject => {
            if (dataNode.type == NodeType.Start) {
                const startNode = dataNode as StartNode;
                return {
                    id: startNode.id,
                    label: startNode.transaction,
                    color: "red",
                    data: startNode,
                    size: 1
                }
            }
            else if (dataNode.type == NodeType.Address) {
                const addressNode = dataNode as AddressNode;

                const balance = `${satsToBtc(addressNode.balance)} BTC`
                const subLabel = addressNode.balance_type === BalanceType.Estimate ? `~ ${balance}` : balance

                return {
                    id: addressNode.id,
                    label: `${addressNode.address}<br>${subLabel}`,
                    color: addressNode.visited ? "blue" : "gray",
                    data: addressNode,
                    size: dynamicSizeFromValue(addressNode.balance, 1, 20, 100)
                }
            }
            throw TypeError("Not a valid type")
        });
        setNodes(transformedNodes);
    }, [dataNodes]);

    useEffect(() => {
        const transformedEdges = dataEdges.map((dataEdge: NodeEdge): LinkObject => {
            return {
                id: `${dataEdge.from}-${dataEdge.to}`,
                source: dataEdge.from,
                target: dataEdge.to,
                size: dynamicSizeFromValue(dataEdge.amount, 1, 5, 10),
                label: `${satsToBtc(dataEdge.amount)} BTC`,
            }
        })
        setLinks(transformedEdges);
    }, [dataNodes])

    useEffect(() => {
        load(input.startTransaction)
    }, []);

    const tree = { nodes: nodes, links: links };

    const handleNodeClick = useCallback((node: NodeObject) => {
        loadAddress(node.data)
    }, []);

    return (
        <ForceGraph2D
            graphData={tree}
            nodeColor={node => node.color}
            nodeLabel={node => node.label}
            nodeVal={node => node.size}
            linkDirectionalArrowLength={link => link.size * 3}
            linkDirectionalArrowRelPos={1}
            linkWidth={link => link.size}
            linkLabel={link => link.label}
            onNodeClick={handleNodeClick}
        />
    );
};
