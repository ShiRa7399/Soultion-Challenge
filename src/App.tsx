import { useState, useEffect, useRef } from 'react';
import { fetchAlerts, subscribeToAlertUpdates, updateAlertStatus, createDemoAlert } from './services/alertService';
import { EmergencyAlert, AlertStatus, EmergencyType } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AlertCard from './components/AlertCard';
import StatsGrid from './components/StatsGrid';
import { Filter, Plus, X, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState<EmergencyType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'All'>('All');
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initial Fetch
  useEffect(() => {
    fetchAlerts().then(setAlerts);
  }, []);

  // Socket Subscription & Polling Fallback
  useEffect(() => {
    const handleCreated = (newAlert: EmergencyAlert) => {
      setAlerts(prev => {
        // Prevent duplicate alerts if polling and sockets both work
        if (prev.find(a => a.alertId === newAlert.alertId)) return prev;
        
        // Trigger sound/highlight for new alert
        setNewAlertIds(prevIds => new Set([...prevIds, newAlert.alertId]));
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }

        setTimeout(() => {
          setNewAlertIds(prevIds => {
            const next = new Set(prevIds);
            next.delete(newAlert.alertId);
            return next;
          });
        }, 10000);

        return [newAlert, ...prev];
      });
    };

    const handleUpdated = (updatedAlert: EmergencyAlert) => {
      setAlerts(prev => prev.map(a => a.alertId === updatedAlert.alertId ? updatedAlert : a));
    };

    // 1. Subscribe to real-time sockets
    const unsubscribe = subscribeToAlertUpdates(handleCreated, handleUpdated);

    // 2. Polling Fallback (Essential for Vercel/Serverless)
    // We poll every 5 seconds to catch updates if WebSockets aren't supported
    const pollInterval = setInterval(async () => {
      try {
        const freshAlerts = await fetchAlerts();
        setAlerts(currentAlerts => {
          // Check if any truly new alerts arrived via polling
          const currentIds = new Set(currentAlerts.map(a => a.alertId));
          const brandNew = freshAlerts.filter(a => !currentIds.has(a.alertId));
          
          if (brandNew.length > 0) {
            brandNew.forEach(handleCreated);
          }
          
          return freshAlerts;
        });
      } catch (e) {
        console.error('Polling failed', e);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const filteredAlerts = alerts
    .filter(a => {
      if (activeTab === 'active') return a.status !== 'Resolved';
      if (activeTab === 'resolved') return a.status === 'Resolved';
      return true;
    })
    .filter(a => filterType === 'All' || a.type === filterType)
    .filter(a => filterStatus === 'All' || a.status === filterStatus)
    .sort((a, b) => {
      // High priority (Fire) always at top if pending/in progress
      if ((a.type === 'Fire' && a.status !== 'Resolved') && (b.type !== 'Fire' || b.status === 'Resolved')) return -1;
      if ((b.type === 'Fire' && b.status !== 'Resolved') && (a.type !== 'Fire' || a.status === 'Resolved')) return 1;
      
      // Secondary sort by timestamp
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const handleAddDemo = () => {
    const types: EmergencyType[] = ['Fire', 'Medical', 'Lift', 'Security', 'Other'];
    const rooms = ['101', '405', 'B2', 'Lobby', 'Pool', 'Suite 9'];
    const names = ['John Smith', 'Maria Garcia', 'Alex Wong', 'Sarah Jenkins', 'Robert Blake'];
    
    createDemoAlert({
      name: names[Math.floor(Math.random() * names.length)],
      roomNumber: rooms[Math.floor(Math.random() * rooms.length)],
      organizationId: 'GA-001',
      type: types[Math.floor(Math.random() * types.length)],
      status: 'Pending',
    });
  };

  return (
    <div className="flex h-screen bg-black text-gray-100 antialiased selection:bg-blue-500/30">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeCount={alerts.filter(a => a.status !== 'Resolved').length} 
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-black text-white">
                  {activeTab === 'dashboard' ? 'Operation Overview' : 
                   activeTab === 'active' ? 'Active Emergency Queue' : 'Incident Archive'}
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Real-time synchronization with ground response teams.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleAddDemo}
                  className="group flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/10"
                >
                  <Plus size={18} className="text-blue-500 transition-transform group-hover:rotate-90" />
                  Simulate SOS
                </button>
              </div>
            </div>

            {activeTab === 'dashboard' && <StatsGrid alerts={alerts} />}

            {/* Filter Bar */}
            <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/40 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-r border-gray-800 pr-4">
                <Filter size={16} className="text-gray-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Filter By:</span>
              </div>
              
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                <option value="Fire">Fire</option>
                <option value="Medical">Medical</option>
                <option value="Lift">Lift</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>

              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              {(filterType !== 'All' || filterStatus !== 'All') && (
                <button 
                  onClick={() => { setFilterType('All'); setFilterStatus('All'); }}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400"
                >
                  <X size={12} />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Alert Feed */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-2">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <AlertCard 
                    key={alert.alertId} 
                    alert={alert} 
                    onUpdateStatus={updateAlertStatus}
                    isNew={newAlertIds.has(alert.alertId)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-800 py-24 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-gray-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">All Clear</h3>
                  <p className="mt-2 text-sm text-gray-500">No active emergencies matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
