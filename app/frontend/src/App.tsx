import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth, isManager } from "./auth";
import { Login } from "./pages/Login";
import { Layout } from "./pages/Layout";
import { DesignerHome } from "./pages/designer/Home";
import { Curriculum } from "./pages/designer/Curriculum";
import { LessonPage } from "./pages/designer/Lesson";
import { PracticePage } from "./pages/designer/Practice";
import { FeedbackPage } from "./pages/designer/Feedback";
import { MyGrowth } from "./pages/designer/MyGrowth";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { Designers } from "./pages/admin/Designers";
import { DesignerDetail } from "./pages/admin/DesignerDetail";
import { CurriculumMgmt } from "./pages/admin/CurriculumMgmt";
import { EvaluationMgmt } from "./pages/admin/EvaluationMgmt";

export function App() {
  const { me, loading } = useAuth();
  if (loading) return <div className="empty">불러오는 중…</div>;
  if (!me) return <Login />;

  return (
    <Layout>
      <Routes>
        {/* Designer */}
        <Route path="/" element={<DesignerHome />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/growth" element={<MyGrowth />} />

        {/* Admin / manager */}
        {isManager(me.roleKey) && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/designers" element={<Designers />} />
            <Route path="/admin/designers/:id" element={<DesignerDetail />} />
            <Route path="/admin/curriculum" element={<CurriculumMgmt />} />
            <Route path="/admin/evaluation" element={<EvaluationMgmt />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
