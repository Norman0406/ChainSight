import mempoolJS from '@mempool/mempool.js'

function api() {
    return mempoolJS();
}

async function getTransaction(txid: string) {
    try {
        const { bitcoin: { transactions } } = api();

        return await transactions.getTx({ txid });
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

async function getAddress(address: string){
    try {
        const { bitcoin: { addresses } } = api();

        return await addresses.getAddress({ address })
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

async function getAddressTxs(address: string, after_txid: string) {
    try {
        const { bitcoin: { addresses } } = api();

        return await addresses.getAddressTxs({ address, after_txid })
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

async function getAddressTxsChain(address: string) {
    try {
        const { bitcoin: { addresses } } = api();

        return await addresses.getAddressTxsChain({ address })
    } catch (error) {
        console.error('Error in mempoolService:', error);
        throw error;
    }
};

const MempoolService = {
    getTransaction,
    getAddress,
    getAddressTxs,
    getAddressTxsChain
  };
  
export default MempoolService;
