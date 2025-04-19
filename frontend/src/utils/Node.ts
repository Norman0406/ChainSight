export enum NodeType {
    Start = "start",
    Address = "address",
}

export abstract class NodeBase {
    abstract readonly type: NodeType;
    abstract readonly id: string;
}

export enum BalanceType {
    Estimate = "estimate",
    Exact = "exact",
}

export class AddressNode extends NodeBase {
    readonly type: NodeType = NodeType.Address;
    readonly id: string;
    visited: boolean = false;
    balance_type: BalanceType = BalanceType.Estimate;

    constructor(
        public address: string,
        public balance: number,
        public originTx: string,
        public originBlockHeight: number
    ) {
        super();
        this.id = address;
    }
}

export class StartNode extends NodeBase {
    readonly type: NodeType = NodeType.Start;
    readonly id: string = this.transaction

    constructor(
        public transaction: string,
    ) {
        super();
        this.id = transaction
    }
}

export class NodeEdge {
    constructor(
        public from: string,
        public to: string,
        public amount: number,
    ) { }
}
