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
import { ProfessionalDirectoryPage } from "./pages/client/ProfessionalDirectoryPage";
import { ClientAppointmentsPage } from "./pages/client/ClientAppointmentsPage";
import { HelperDashboard } from "./pages/helper/HelperDashboard";
import { TrainingPage } from "./pages/helper/TrainingPage";
import { StudentVerificationPage } from "./pages/helper/StudentVerificationPage";
import { HelperSessionsPage } from "./pages/helper/HelperSessionsPage";
import { RewardsPage } from "./pages/helper/RewardsPage";
import { SessionChatPage } from "./pages/shared/SessionChatPage";
import { VideoCallPage } from "./pages/shared/VideoCallPage";
import { ProfessionalDashboard } from "./pages/professional/ProfessionalDashboard";
import { ProfessionalVerificationPage } from "./pages/professional/ProfessionalVerificationPage";
import { ProfessionalAppointmentsPage } from "./pages/professional/ProfessionalAppointmentsPage";
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
            <Route path="/client/professionals" element={<ProfessionalDirectoryPage />} />
            <Route path="/client/appointments" element={<ClientAppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["helper"]} />}>
            <Route path="/helper" element={<HelperDashboard />} />
            <Route path="/helper/training" element={<TrainingPage />} />
            <Route path="/helper/student-verification" element={<StudentVerificationPage />} />
            <Route path="/helper/sessions" element={<HelperSessionsPage />} />
            <Route path="/helper/rewards" element={<RewardsPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["client", "helper"]} />}>
            <Route path="/session/:sessionId" element={<SessionChatPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["professional"]} />}>
            <Route path="/professional" element={<ProfessionalDashboard />} />
            <Route path="/professional/verification" element={<ProfessionalVerificationPage />} />
            <Route path="/professional/appointments" element={<ProfessionalAppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["client", "professional"]} />}>
            <Route path="/appointments/:appointmentId/call" element={<VideoCallPage />} />
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
