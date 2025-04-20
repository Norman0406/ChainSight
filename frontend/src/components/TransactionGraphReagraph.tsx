import { useEffect, useRef, useState } from 'react';
import { darkTheme, GraphCanvas, GraphCanvasRef, GraphEdge, GraphNode, useSelection } from 'reagraph';
import { useDataFetching } from '../utils/FetchData';
import { AddressNode, BalanceType, NodeBase, NodeEdge, NodeType, StartNode } from '../utils/Node';
import { dynamicSizeFromValue, satsToBtc, shortenBitcoinAddress } from '../utils/Bitcoin';

interface TransactionInputProps {
    startTransaction: string;
}

export default function TransationGraph(input: TransactionInputProps) {
    const graphRef = useRef<GraphCanvasRef | null>(null);
    const [dataNodes, dataEdges, load, loadAddress] = useDataFetching();
    const [nodes, setNodes] = useState(new Array<GraphNode>());
    const [edges, setEdges] = useState(new Array<GraphEdge>());

    useEffect(() => {
        const transformedNodes = dataNodes.map((dataNode: NodeBase): GraphNode => {
            if (dataNode.type == NodeType.Start) {
                const startNode = dataNode as StartNode;
                return {
                    id: startNode.id,
                    fill: "red",
                    data: startNode,
                    size: 10
                }
            }
            else if (dataNode.type == NodeType.Address) {
                const addressNode = dataNode as AddressNode;

                const label = `${satsToBtc(addressNode.balance)} BTC`

                return {
                    id: addressNode.id,
                    label: shortenBitcoinAddress(addressNode.address),
                    subLabel: addressNode.balance_type === BalanceType.Estimate ? `~ ${label}` : label,
                    fill: addressNode.visited ? "blue" : "gray",
                    data: addressNode,
                    size: dynamicSizeFromValue(addressNode.balance, 10, 50, 100)
                }
            }
            throw TypeError("Not a valid type")
        });
        setNodes(transformedNodes);
    }, [dataNodes])

    useEffect(() => {
        const transformedEdges = dataEdges.map((dataEdge: NodeEdge): GraphEdge => {
            return {
                id: `${dataEdge.from}-${dataEdge.to}`,
                source: dataEdge.from,
                target: dataEdge.to,
                label: `${satsToBtc(dataEdge.amount)} BTC`,
                size: dynamicSizeFromValue(dataEdge.amount, 1, 10, 10)
            }
        })
        setEdges(transformedEdges);
    }, [dataNodes])

    useEffect(() => {
        load(input.startTransaction)
        graphRef.current?.fitNodesInView();
    }, []);
    
    function onNodeDoubleClick(node: GraphNode) {
        loadAddress(node.data)
    }

    const {
        selections,
        actives,
        onNodeClick,
        onCanvasClick,
        onNodePointerOver,
        onNodePointerOut
    } = useSelection({
        ref: graphRef,
        nodes: nodes,
        edges: edges,
        pathSelectionType: 'all',
        pathHoverType: 'all',
        focusOnSelect: true
    });
        
    return (
        <GraphCanvas
            theme={darkTheme}
            ref={graphRef}
            nodes={nodes}
            edges={edges}
            selections={selections}
            actives={actives}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onCanvasClick={onCanvasClick}
            onNodePointerOver={onNodePointerOver}
            onNodePointerOut={onNodePointerOut}
            labelType="all"
            edgeLabelPosition="natural"
        />
    );
};
