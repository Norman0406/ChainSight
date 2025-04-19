import React, { useState } from 'react';
import { useNavigate } from "react-router";

import TransactionInput from '../components/TransactionInput';
import MempoolService from '../services/MempoolService';

export default function HomePage() {
    const [transactionValue, setTransactionValue] = useState<string>('');
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();

    function handleSubmit() {
        async function loadAndSubmit() {
            const transactionId = transactionValue.trim()
            if (transactionId) {
                try {
                    await MempoolService.getTransaction(transactionId);
                    setError("");
                    navigate(`/transaction/${encodeURIComponent(transactionId)}`);
                }
                catch (error) {
                    console.log(error)
                    setError("Invalid transaction id");
                }
            }
        }
        loadAndSubmit();
    };

    return (
        <TransactionInput
            value={transactionValue}
            error={error}
            onChange={setTransactionValue}
            onSubmit={handleSubmit}
        />
    );
};
