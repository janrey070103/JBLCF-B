import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './controllers/useAuth.jsx';
import { ToastProvider } from './components/Toast.jsx';
import NavShell from './components/NavShell.jsx';
import Login from './views/auth/Login.jsx';
import PlaceholderDashboard from './views/_placeholder.jsx';
import StudentForm from './views/superadmin/StudentForm.jsx';
import StudentList from './views/superadmin/StudentList.jsx';
import StudentQr from './views/superadmin/StudentQr.jsx';
import ClassAttendance from './views/professor/ClassAttendance.jsx';
import ScanAttendance from './views/professor/ScanAttendance.jsx';
import CourseList from './views/superadmin/CourseList.jsx';
import UserList from './views/superadmin/UserList.jsx';
import ClassList from './views/superadmin/ClassList.jsx';
import AdminDashboard from './views/superadmin/AdminDashboard.jsx';
import Reports from './views/superadmin/Reports.jsx';
import {
  RedirectIfAuthed,
  RequireAuth,
  RequireRole,
} from './routes/guards.jsx';
import { USER_ROLES } from './models';

// Phase 2 router. Real dashboards arrive in later phases; placeholder targets
// are kept so the role redirect + guards are verifiable end-to-end now.
function Layout({ title, children }) {
  return (
    <RequireAuth>
      <NavShell>
        {children ?? <PlaceholderDashboard title={title} />}
      </NavShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <Login />
                </RedirectIfAuthed>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Dashboard">
                    <AdminDashboard />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/students"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Students">
                    <StudentList />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/students/new"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Add Student">
                    <StudentForm />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/students/:id/edit"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Edit Student">
                    <StudentForm />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/students/:id/qr"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Printable QR Output">
                    <StudentQr />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Courses">
                    <CourseList />
                  </Layout>
                </RequireRole>
              }
            />

            <Route
              path="/admin/users"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="System Users">
                    <UserList />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Classes">
                    <ClassList />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Reports">
                    <Reports />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RequireRole role={USER_ROLES.SUPERADMIN}>
                  <Layout title="Coming Soon">
                    <div className="bg-white border border-primary-100 rounded-container p-8 text-center text-primary-500 shadow-sm">
                      This module is currently under development.
                    </div>
                  </Layout>
                </RequireRole>
              }
            />

            <Route
              path="/professor"
              element={
                <RequireRole role={USER_ROLES.PROFESSOR}>
                  <Layout title="Professor Dashboard">
                    <ScanAttendance />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/professor/scan"
              element={
                <RequireRole role={USER_ROLES.PROFESSOR}>
                  <Layout title="Scan Attendance">
                    <ScanAttendance />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/professor/attendance"
              element={
                <RequireRole role={USER_ROLES.PROFESSOR}>
                  <Layout title="Class Attendance">
                    <ClassAttendance />
                  </Layout>
                </RequireRole>
              }
            />
            <Route
              path="/professor/*"
              element={
                <RequireRole role={USER_ROLES.PROFESSOR}>
                  <Layout title="Professor Dashboard" />
                </RequireRole>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
