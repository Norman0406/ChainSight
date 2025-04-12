import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getTransaction, getAddress, getAddressTxs, getAddressTxsChain } from '../services/MempoolService'
import { darkTheme, GraphCanvas, GraphCanvasRef, GraphNode, GraphEdge, useSelection } from 'reagraph';
import { dynamicSizeFromValue, shortenBitcoinAddress, satsToBtc } from '../utils/Bitcoin';

class NodeInfo {
    constructor(
        public address: string,
        public txOrigin: string,
        public txBlockHeight: number) { }
}

export default function TransactionPage() {
    const { value } = useParams<{ value: string }>();

    const graphRef = useRef<GraphCanvasRef | null>(null);
    const [nodes, setNodes] = useState(new Array<GraphNode>());
    const [edges, setEdges] = useState(new Array<GraphEdge>());
    const [nodeIds, setNodeIds] = useState(new Set<string>([]));
    const [transactions, setTransactions] = useState(new Set<string>([]));
    const [addresses, setAddresses] = useState(new Set<string>([]));

    const startTransaction = value ? decodeURIComponent(value) : '';

    async function addNode(newNode: GraphNode) {
        setNodes(nodes => [...nodes, newNode]);
        nodeIds.add(newNode.id)
        setNodeIds(nodeIds)
    }

    function updateNode(nodeToUpdate: GraphNode, newProperties: Partial<GraphNode>) {
        setNodes(nodes =>
            nodes.map(node =>
                node.id === nodeToUpdate.id ? { ...node, ...newProperties } : node
            )
        );
    };

    async function load(transaction: string, nodeIds: Set<string>) {
        if (transactions.has(transaction)) {
            return
        }

        const startingNode: GraphNode = {
            id: transaction,
            label: String(),
            fill: "red",
            size: 10,
            data: new NodeInfo("", "", 0),
        };
        setNodes(nodes => [...nodes, startingNode]);

        await loadTransaction(transaction, transaction)
    }

    async function loadTransaction(transaction: string, sourceNode: string) {
        console.log("Loading transaction", transaction, transactions)

        if (transactions.has(transaction)) {
            console.log("Skipping transaction, we've already processed it", transaction)
            return
        }

        transactions.add(transaction)
        setTransactions(transactions)

        const txDetails = await getTransaction(transaction);

        for (var txOut of txDetails.vout) {
            const nodeId = txOut.scriptpubkey_address

            if (nodeIds.has(nodeId)) {
                continue;
            }

            if (!txOut.scriptpubkey_address) {
                console.log("Skipping transaction because address is not set");
                continue
            }

            console.log(txOut)

            const newAddressNode: GraphNode = {
                id: nodeId,
                label: shortenBitcoinAddress(txOut.scriptpubkey_address),
                fill: "gray",
                size: 10,
                data: new NodeInfo(
                    txOut.scriptpubkey_address,
                    txDetails.txid,
                    txDetails.status.block_height,
                ),
            };
            addNode(newAddressNode)

            const newEdge: GraphEdge = {
                id: sourceNode + nodeId,
                source: sourceNode,
                target: nodeId,
                size: dynamicSizeFromValue(txOut.value, 1, 10, 10),
                label: String(satsToBtc(txOut.value)) + " BTC"
            }
            setEdges(edges => [...edges, newEdge]);
        }
    }

    async function loadAddress(node: GraphNode) {
        const nodeInfo = node.data
        if (addresses.has(nodeInfo.address)) {
            console.log("Skipping address, we've already processed it", nodeInfo.address);
            return;
        }

        addresses.add(nodeInfo.address);
        setAddresses(addresses);

        console.log("Loading address", nodeInfo.address)
        const addressDetails = await getAddress(nodeInfo.address)

        const balance = addressDetails.chain_stats.funded_txo_sum - addressDetails.chain_stats.spent_txo_sum

        updateNode(node, {
            size: dynamicSizeFromValue(balance, 10, 50, 100),
            subLabel: String(satsToBtc(balance)) + " BTC",
            fill: "blue"
        })

        const txs = await getAddressTxsChain(nodeInfo.address)

        for (var tx of txs) {
            // don't load transactions from a time before the block height of the current node
            if (tx.status.block_height < nodeInfo.txBlockHeight) {
                console.log("Skipping transaction because it's too old", tx)
                continue;
            }

            await loadTransaction(tx.txid, nodeInfo.address);
        }
    }

    useEffect(() => {
        load(startTransaction, nodeIds);
        graphRef.current?.fitNodesInView();
    }, []);

    function onNodeDoubleClick(node: GraphNode) {
        if (node.data.txBlockHeight == 0) {
            // let's ignore the starting node
            return
        }

        loadAddress(node);

        if (onNodeClick) {
            onNodeClick(node);
        }
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
