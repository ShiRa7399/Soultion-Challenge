import { motion } from 'motion/react';
import { EmergencyAlert, EmergencyType, AlertStatus } from '../types';
import { Shield, Flame, Activity, Box, MoreHorizontal, Clock, MapPin, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: EmergencyAlert;
  onUpdateStatus: (alertId: string, status: AlertStatus) => void | Promise<void>;
  isNew?: boolean;
}

const TYPE_CONFIG: Record<EmergencyType, { color: string; icon: any; bg: string; border: string }> = {
  Fire: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Flame },
  Medical: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Activity },
  Lift: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Box },
  Security: { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Shield },
  Other: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: MoreHorizontal },
};

const STATUS_CONFIG: Record<AlertStatus, { bg: string; text: string }> = {
  Pending: { bg: 'bg-red-500', text: 'text-white' },
  'In Progress': { bg: 'bg-yellow-500', text: 'text-black' },
  Resolved: { bg: 'bg-green-500', text: 'text-white' },
};

export default function AlertCard({ alert, onUpdateStatus, isNew }: AlertCardProps) {
  const config = TYPE_CONFIG[alert.type];
  const Icon = config.icon;
  const statusConfig = STATUS_CONFIG[alert.status];

  return (
    <motion.div
      layout
      initial={isNew ? { scale: 0.95, opacity: 0 } : false}
      animate={{ 
        scale: 1, 
        opacity: 1,
        backgroundColor: isNew ? ['rgba(239, 68, 68, 0.1)', 'rgba(17, 24, 39, 1)'] : 'rgba(17, 24, 39, 1)' 
      }}
      transition={{ 
        duration: isNew ? 1.5 : 0.3,
        backgroundColor: { repeat: isNew ? 5 : 0, duration: 0.5 }
      }}
      className={`relative overflow-hidden rounded-xl border ${config.border} bg-gray-900 p-6 shadow-2xl`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${config.bg} ${config.color}`}>
            <Icon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold uppercase tracking-wider ${config.color}`}>
                {alert.type} Emergency
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.text}`}>
                {alert.status}
              </span>
            </div>
            <h3 className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">RM {alert.roomNumber}</span>
            </h3>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-gray-400">
            <Clock size={14} />
            <span className="text-xs font-medium">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-gray-300">
          <User size={16} className="text-gray-500" />
          <span className="text-sm font-medium">{alert.name}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin size={16} className="text-gray-500" />
          <span className="text-sm font-medium">Lobby A - East Wing</span>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        {alert.status === 'Pending' && (
          <button
            onClick={() => onUpdateStatus(alert.alertId, 'In Progress')}
            className="flex-1 rounded-lg bg-yellow-500 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Mark In Progress
          </button>
        )}
        {(alert.status === 'Pending' || alert.status === 'In Progress') && (
          <button
            onClick={() => onUpdateStatus(alert.alertId, 'Resolved')}
            className="flex-1 rounded-lg bg-green-500 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Mark Resolved
          </button>
        )}
        {alert.status === 'Resolved' && (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 py-2.5 text-sm font-bold text-green-500">
            <Shield size={16} />
            Incident Resolved
          </div>
        )}
      </div>
    </motion.div>
  );
}
