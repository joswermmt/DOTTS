import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Admin } from "./pages/Admin";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Panel } from "./pages/Panel";
import { Register } from "./pages/Register";
import { Solicitudes } from "./pages/Solicitudes";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route
              path="/panel"
              element={
                <ProtectedRoute>
                  <Panel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/solicitudes"
              element={
                <ProtectedRoute>
                  <Solicitudes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
