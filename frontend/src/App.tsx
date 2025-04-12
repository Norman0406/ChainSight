import {
  Route,
  Routes,
} from "react-router";
import HomePage from "./pages/HomePage";
import TransactionPage from "./pages/TransactionPage";

export default function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="/transaction/:value" element={<TransactionPage />} />
    </Routes>
  );
};
