import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { HelperDashboard } from "./pages/helper/HelperDashboard";
import { ProfessionalDashboard } from "./pages/professional/ProfessionalDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute allow={["client"]} />}>
            <Route path="/client" element={<ClientDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allow={["helper"]} />}>
            <Route path="/helper" element={<HelperDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allow={["professional"]} />}>
            <Route path="/professional" element={<ProfessionalDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allow={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
