import { useState } from 'react';
import MempoolService from '../services/MempoolService'
import { getAddressFromVout } from './Bitcoin';
import { AddressNode, BalanceType, NodeBase, NodeEdge, StartNode } from './Node';

type LoadFn = (transaction: string) => void
type LoadTransactionFn = (transaction: string, sourceNode: NodeBase) => Promise<void>
type LoadAddressFn = (addressNode: AddressNode) => Promise<void>

type UseDataFetchingResult = [
    NodeBase[],
    NodeEdge[],
    LoadFn,
    LoadTransactionFn,
    LoadAddressFn
]

export function useDataFetching(): UseDataFetchingResult {
    const [nodes, setNodes] = useState<NodeBase[]>(new Array<NodeBase>());
    const [edges, setEdges] = useState<NodeEdge[]>(new Array<NodeEdge>());
    const [nodeIds, setNodeIds] = useState(new Set<string>([]));
    const [transactions, setTransactions] = useState(new Set<string>([]));
    const [addresses, setAddresses] = useState(new Set<string>([]));

    async function addNode(newNode: NodeBase) {
        setNodes(nodes => [...nodes, newNode]);
        nodeIds.add(newNode.id)
        setNodeIds(nodeIds)
    }

    function updateNode(nodeToUpdate: AddressNode) {
        setNodes(nodes =>
            nodes.map(node =>
                node.id === nodeToUpdate.id ? nodeToUpdate : node
            )
        );
    };

    async function load(transaction: string) {
        if (transactions.has(transaction)) {
            return
        }

        const startingNode = new StartNode(
            transaction,
        );
        setNodes(nodes => [...nodes, startingNode]);

        await loadTransaction(transaction, startingNode)
    }

    async function loadTransaction(transaction: string, sourceNode: NodeBase
    ) {
        console.log("Loading transaction", transaction, transactions);

        if (transactions.has(transaction)) {
            console.log("Skipping transaction, we've already processed it", transaction)
            return
        }

        transactions.add(transaction)
        setTransactions(transactions)

        const txDetails = await MempoolService.getTransaction(transaction);

        for (var txOut of txDetails.vout) {
            const address = getAddressFromVout(txOut)

            const nodeId = address

            if (nodeIds.has(nodeId)) {
                continue;
            }

            if (!address) {
                console.log("Skipping transaction because address is not set", txOut);
                continue
            }

            const newAddressNode = new AddressNode(
                address,
                txOut.value,
                txDetails.txid,
                txDetails.status.block_height
            )
            addNode(newAddressNode)

            // by now we have two modes to analyze this:
            // - by urgency, showing block height delta as edge size
            // - by amount, showing transferred funds as edge size
            // we could imagine a way to switch between them at runtime

            // we can also have two operating modes:
            // - inspecting outflowing transactions from addresses, only showing transactions that happen after our starting transaction
            // - inspecting inflowing transactions from addresses, only showing earlier transactions before our starting transaction

            const newEdge = new NodeEdge(
                sourceNode.id,
                nodeId,
                txOut.value,
            )
            setEdges(edges => [...edges, newEdge]);
        }
    }

    async function loadAddress(node: AddressNode) {
        try {
            console.log(node)
            if (node.originBlockHeight == 0) {
                // let's ignore the starting node
                return
            }

            if (addresses.has(node.address)) {
                console.log("Skipping address, we've already processed it", node.address);
                return;
            }

            console.log("Loading address", node.address)
            const addressDetails = await MempoolService.getAddress(node.address)

            const balance = addressDetails.chain_stats.funded_txo_sum - addressDetails.chain_stats.spent_txo_sum

            const txs = await MempoolService.getAddressTxsChain(node.address)

            for (var tx of txs) {
                // don't load transactions from a time before the block height of the current node
                if (tx.status.block_height < node.originBlockHeight) {
                    console.log("Skipping transaction because it's too old", tx)
                    continue;
                }

                await loadTransaction(tx.txid, node);
            }

            addresses.add(node.address);
            setAddresses(addresses);

            node.balance = balance;
            node.balance_type = BalanceType.Exact;
            node.visited = true;
            updateNode(node)
        }
        catch (error) {
            console.error(error)
        }
    }

    return [nodes, edges, load, loadTransaction, loadAddress]
}
