import { useParams} from 'react-router';
import TransactionGraph2D from '../components/TransactionGraph2D';
import TransactionGraphReagraph from '../components/TransactionGraphReagraph';

export default function TransactionPage() {
    const { value } = useParams<{ value: string }>();

    const startTransaction = value ? decodeURIComponent(value) : '';

    return (
        <div>
            {/* <TransactionGraphReagraph startTransaction={startTransaction} /> */}
            <TransactionGraph2D startTransaction={startTransaction} />
        </div>
    );
}
