import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import GlobalSettingsButton from './GlobalSettingsButton';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {user?.role === 'admin' ? <AdminSidebar /> : <Sidebar />}
      <main className="main-content">
        {children}
      </main>
      <GlobalSettingsButton />
    </div>
  );
}
