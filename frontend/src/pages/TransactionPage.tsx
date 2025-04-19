import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { darkTheme, GraphCanvas, GraphCanvasRef, GraphNode, GraphEdge, useSelection } from 'reagraph';
import { nodeSizeFromSats, edgeSizeFromSats, shortenBitcoinAddress, satsToBtc, getAddressFromVout, edgeSizeFromBlockHeightDelta } from '../utils/Bitcoin';
import { useDataFetching } from '../utils/FetchData';
import { AddressNode, BalanceType, NodeBase, NodeEdge, NodeType, StartNode } from '../utils/Node';

export default function TransactionPage() {
    const { value } = useParams<{ value: string }>();

    const graphRef = useRef<GraphCanvasRef | null>(null);
    const [dataNodes, dataEdges, load, loadTransaction, loadAddress] = useDataFetching();
    const [nodes, setNodes] = useState(new Array<GraphNode>());
    const [edges, setEdges] = useState(new Array<GraphEdge>());

    const startTransaction = value ? decodeURIComponent(value) : '';

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
                    size: nodeSizeFromSats(addressNode.balance)
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
                size: edgeSizeFromSats(dataEdge.amount),
            }
        })
        setEdges(transformedEdges);
    }, [dataNodes])

    useEffect(() => {
        load(startTransaction)
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
        <div>
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
        </div>
    );
}
