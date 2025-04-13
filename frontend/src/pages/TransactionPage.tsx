import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getTransaction, getAddress, getAddressTxs, getAddressTxsChain } from '../services/MempoolService'
import { darkTheme, GraphCanvas, GraphCanvasRef, GraphNode, GraphEdge, useSelection } from 'reagraph';
import { nodeSizeFromSats, edgeSizeFromSats, shortenBitcoinAddress, satsToBtc, getAddressFromVout, edgeSizeFromBlockHeightDelta } from '../utils/Bitcoin';

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

        await loadTransaction(transaction, startingNode)
    }

    async function loadTransaction(transaction: string, sourceNode: GraphNode) {
        console.log("Loading transaction", transaction, transactions)

        if (transactions.has(transaction)) {
            console.log("Skipping transaction, we've already processed it", transaction)
            return
        }

        transactions.add(transaction)
        setTransactions(transactions)

        const txDetails = await getTransaction(transaction);

        for (var txOut of txDetails.vout) {
            const address = getAddressFromVout(txOut)

            const nodeId = address

            if (nodeIds.has(nodeId)) {
                continue;
            }

            console.log(txOut)

            if (!address) {
                console.log("Skipping transaction because address is not set", txOut);
                continue
            }

            console.log(txOut)

            const newAddressNode: GraphNode = {
                id: nodeId,
                label: shortenBitcoinAddress(address),
                fill: "gray",
                size: nodeSizeFromSats(txOut.value),
                data: new NodeInfo(
                    address,
                    txDetails.txid,
                    txDetails.status.block_height,
                ),
            };
            addNode(newAddressNode)

            const blockHeightDelta = txDetails.status.block_height - sourceNode.data.txBlockHeight

            // by now we have two modes to analyze this:
            // - by urgency, showing block height delta as edge size
            // - by amount, showing transferred funds as edge size
            // we could imagine a way to switch between them at runtime

            // we can also have two operating modes:
            // - inspecting outflowing transactions from addresses, only showing transactions that happen after our starting transaction
            // - inspecting inflowing transactions from addresses, only showing earlier transactions before our starting transaction

            const newEdge: GraphEdge = {
                id: sourceNode.id + nodeId,
                source: sourceNode.id,
                target: nodeId,
                size: edgeSizeFromSats(txOut.value),
                // size: sourceNode.data.txBlockHeight > 0 ? edgeSizeFromBlockHeightDelta(blockHeightDelta) : 1,
                label: String(satsToBtc(txOut.value)) + " BTC"
                // label: String(blockHeightDelta)
            }
            setEdges(edges => [...edges, newEdge]);
        }
    }

    async function loadAddress(node: GraphNode) {
        try {
            const nodeInfo = node.data

            if (addresses.has(nodeInfo.address)) {
                console.log("Skipping address, we've already processed it", nodeInfo.address);
                return;
            }

            console.log("Loading address", nodeInfo.address)
            const addressDetails = await getAddress(nodeInfo.address)

            const balance = addressDetails.chain_stats.funded_txo_sum - addressDetails.chain_stats.spent_txo_sum

            updateNode(node, {
                size: nodeSizeFromSats(balance),
                subLabel: String(satsToBtc(balance)) + " BTC"
            })

            const txs = await getAddressTxsChain(nodeInfo.address)

            for (var tx of txs) {
                // don't load transactions from a time before the block height of the current node
                if (tx.status.block_height < nodeInfo.txBlockHeight) {
                    console.log("Skipping transaction because it's too old", tx)
                    continue;
                }

                await loadTransaction(tx.txid, node);
            }

            addresses.add(nodeInfo.address);
            setAddresses(addresses);

            updateNode(node, {
                fill: "blue"
            })
        }
        catch (error) {
            console.error(error)
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
