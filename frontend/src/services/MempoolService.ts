import mempoolJS from '@mempool/mempool.js'

function api() {
    return mempoolJS();
}

export const getTransaction = async (txid: string) => {
    try {
        const { bitcoin: { transactions } } = api();

        return await transactions.getTx({ txid });
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

export const getAddress = async (address: string) => {
    try {
        const { bitcoin: { addresses } } = api();

        return await addresses.getAddress({ address })
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

export const getAddressTxs = async (address: string, after_txid: string) => {
    try {
        const { bitcoin: { addresses } } = api();

        return await addresses.getAddressTxs({ address, after_txid })
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

export const getAddressTxsChain = async (address: string) => {
    try {
        const { bitcoin: { addresses } } = api();

        return await addresses.getAddressTxsChain({ address })
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};
