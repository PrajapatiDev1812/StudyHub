import Sidebar from './Sidebar';
import GlobalSettingsButton from './GlobalSettingsButton';

export default function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <GlobalSettingsButton />
    </div>
  );
}
