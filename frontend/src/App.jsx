import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LoadBoard from "./pages/LoadBoard";
import MainBoard from "./pages/MainBoard";
import Drivers from "./pages/Drivers";
import Trucks from "./pages/Trucks";
import Dispatchers from "./pages/Dispatchers";
import Archive from "./pages/Archive";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/loads" replace />} />
        <Route path="loads" element={<LoadBoard />} />
        <Route path="main-board" element={<MainBoard />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="trucks" element={<Trucks />} />
        <Route path="dispatchers" element={<Dispatchers />} />
        <Route path="archive" element={<Archive />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
