import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { WellbeingCheckPage } from "./pages/client/WellbeingCheckPage";
import { AiChatPage } from "./pages/client/AiChatPage";
import { HelperDirectoryPage } from "./pages/client/HelperDirectoryPage";
import { ClientSessionsPage } from "./pages/client/ClientSessionsPage";
import { HelperDashboard } from "./pages/helper/HelperDashboard";
import { TrainingPage } from "./pages/helper/TrainingPage";
import { StudentVerificationPage } from "./pages/helper/StudentVerificationPage";
import { HelperSessionsPage } from "./pages/helper/HelperSessionsPage";
import { SessionChatPage } from "./pages/shared/SessionChatPage";
import { ProfessionalDashboard } from "./pages/professional/ProfessionalDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CertificateVerificationPage } from "./pages/CertificateVerificationPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/certificates/:certificateId" element={<CertificateVerificationPage />} />

          <Route element={<ProtectedRoute allow={["client"]} />}>
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/wellbeing-check" element={<WellbeingCheckPage />} />
            <Route path="/client/ai" element={<AiChatPage />} />
            <Route path="/client/helpers" element={<HelperDirectoryPage />} />
            <Route path="/client/sessions" element={<ClientSessionsPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["helper"]} />}>
            <Route path="/helper" element={<HelperDashboard />} />
            <Route path="/helper/training" element={<TrainingPage />} />
            <Route path="/helper/student-verification" element={<StudentVerificationPage />} />
            <Route path="/helper/sessions" element={<HelperSessionsPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["client", "helper"]} />}>
            <Route path="/session/:sessionId" element={<SessionChatPage />} />
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
