import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import Sprints from './pages/manager/Sprints';
import Tasks from './pages/manager/Tasks';
import Team from './pages/manager/Team';
import Reports from './pages/manager/Reports';
import Reminders from './pages/manager/Reminders';
import Notifications from './pages/manager/Notifications';
import Settings from './pages/manager/Settings';
import ManagerLeaves from './pages/manager/ManagerLeaves';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeLogTask from './pages/employee/EmployeeLogTask';
import EmployeeProgress from './pages/employee/EmployeeProgress';
import EmployeeLeave from './pages/employee/EmployeeLeave';
import EmployeeNotifications from './pages/employee/EmployeeNotifications';
import EmployeeSettings from './pages/employee/EmployeeSettings';
import AttendanceLog from './pages/shared/AttendanceLog';
import TeamAttendance from './pages/manager/TeamAttendance';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
  return children;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" />;
  return <Navigate to="/employee/tasks" />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<RoleRedirect />} />

            <Route path="/manager" element={<ProtectedRoute allowedRole="manager"><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="sprints" element={<Sprints />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="team" element={<Team />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="attendance" element={<AttendanceLog />} />
              <Route path="team-attendance" element={<TeamAttendance />} />
              <Route path="leaves" element={<ManagerLeaves />} />
            </Route>

            <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Navigate to="/employee/tasks" replace />} />
              <Route path="tasks" element={<EmployeeDashboard />} />
              <Route path="log" element={<EmployeeLogTask />} />
              <Route path="progress" element={<EmployeeProgress />} />
              <Route path="attendance" element={<AttendanceLog />} />
              <Route path="leaves" element={<EmployeeLeave />} />
              <Route path="notifications" element={<EmployeeNotifications />} />
              <Route path="settings" element={<EmployeeSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
