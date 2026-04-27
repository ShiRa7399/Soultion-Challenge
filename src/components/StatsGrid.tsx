import { Activity, Flame, Shield, Box, AlertTriangle } from 'lucide-react';
import { EmergencyAlert } from '../types';

interface StatsGridProps {
  alerts: EmergencyAlert[];
}

export default function StatsGrid({ alerts }: StatsGridProps) {
  const activeAlerts = alerts.filter(a => a.status !== 'Resolved');
  const fireAlerts = activeAlerts.filter(a => a.type === 'Fire').length;
  const medicalAlerts = activeAlerts.filter(a => a.type === 'Medical').length;
  const pendingAlerts = activeAlerts.filter(a => a.status === 'Pending').length;

  const stats = [
    { label: 'Total Active', value: activeAlerts.length, icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Critical Fire', value: fireAlerts, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Medical Emergency', value: medicalAlerts, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Unassigned', value: pendingAlerts, icon: Shield, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <span className="text-4xl font-black text-white">{stat.value}</span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
