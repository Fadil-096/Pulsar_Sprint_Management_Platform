import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen relative">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-bg-card relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
