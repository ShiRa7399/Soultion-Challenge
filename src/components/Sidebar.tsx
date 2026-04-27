import { LayoutDashboard, AlertCircle, CheckCircle2, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, activeCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'active', label: 'Active Alerts', icon: AlertCircle, count: activeCount },
    { id: 'resolved', label: 'Resolved History', icon: CheckCircle2 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex flex-col gap-1 p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Navigation</h2>
        <nav className="mt-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]' 
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-blue-500' : 'text-gray-500'} />
                  {item.label}
                </div>
                {item.count ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-4 ring-gray-950">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-gray-800 p-6">
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-500">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
