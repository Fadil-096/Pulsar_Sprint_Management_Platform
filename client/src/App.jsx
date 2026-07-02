import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';
import PageLoader from './components/PageLoader';

// Code splitting for page components
const ManagerDashboard = React.lazy(() => import('./pages/manager/ManagerDashboard'));
const Sprints = React.lazy(() => import('./pages/manager/Sprints'));
const SprintDetail = React.lazy(() => import('./pages/manager/SprintDetail'));
const Tasks = React.lazy(() => import('./pages/manager/Tasks'));
const Team = React.lazy(() => import('./pages/manager/Team'));
const Reports = React.lazy(() => import('./pages/manager/Reports'));
const Reminders = React.lazy(() => import('./pages/manager/Reminders'));
const Notifications = React.lazy(() => import('./pages/manager/Notifications'));
const Settings = React.lazy(() => import('./pages/manager/Settings'));
const ManagerLeaves = React.lazy(() => import('./pages/manager/ManagerLeaves'));
const TeamAttendance = React.lazy(() => import('./pages/manager/TeamAttendance'));

const EmployeeDashboard = React.lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmployeeTasks = React.lazy(() => import('./pages/employee/EmployeeTasks'));
const EmployeeLogTask = React.lazy(() => import('./pages/employee/EmployeeLogTask'));
const EmployeeProgress = React.lazy(() => import('./pages/employee/EmployeeProgress'));
const EmployeeLeave = React.lazy(() => import('./pages/employee/EmployeeLeave'));
const EmployeeNotifications = React.lazy(() => import('./pages/employee/EmployeeNotifications'));
const EmployeeSettings = React.lazy(() => import('./pages/employee/EmployeeSettings'));

const AttendanceLog = React.lazy(() => import('./pages/shared/AttendanceLog'));
const ProjectsList = React.lazy(() => import('./pages/shared/ProjectsList'));
const ProjectDetail = React.lazy(() => import('./pages/shared/ProjectDetail'));

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminSprints = React.lazy(() => import('./pages/admin/SprintManagement'));
const AdminTeam = React.lazy(() => import('./pages/admin/AdminTeam'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'administrator') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" />;
  return <Navigate to="/employee/dashboard" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={<RoleRedirect />} />

                <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager', 'administrator']}><AppLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<ManagerDashboard />} />
                  <Route path="projects" element={<ProjectsList />} />
                  <Route path="projects/:projectId" element={<ProjectDetail />} />
                  <Route path="sprints" element={<Sprints />} />
                  <Route path="sprints/:sprintId" element={<SprintDetail />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="team" element={<Team />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="reminders" element={<Reminders />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="attendance" element={<AttendanceLog />} />
                  <Route path="team-attendance" element={<TeamAttendance />} />
                </Route>

                <Route path="/employee" element={<ProtectedRoute allowedRoles={['employee']}><AppLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="tasks" element={<EmployeeTasks />} />
                  <Route path="log" element={<EmployeeLogTask />} />
                  <Route path="progress" element={<EmployeeProgress />} />
                  <Route path="attendance" element={<AttendanceLog />} />
                  <Route path="leaves" element={<EmployeeLeave />} />
                  <Route path="notifications" element={<EmployeeNotifications />} />
                  <Route path="settings" element={<EmployeeSettings />} />
                </Route>

                <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrator']}><AppLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="sprints" element={<AdminSprints />} />
                  <Route path="team" element={<AdminTeam />} />
                  <Route path="leaves" element={<ManagerLeaves />} />
                  <Route path="departments" element={<AdminSettings />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
