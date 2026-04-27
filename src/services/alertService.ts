import { EmergencyAlert, AlertStatus, OperationType } from '../types';
import { socket } from '../lib/socket';

const API_BASE = '/api/alerts';

function handleApiError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('API Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const fetchAlerts = async (): Promise<EmergencyAlert[]> => {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || 'Failed to fetch alerts');
    }
    return await response.json();
  } catch (error) {
    handleApiError(error, OperationType.LIST, API_BASE);
    return [];
  }
};

export const subscribeToAlertUpdates = (
  onCreated: (alert: EmergencyAlert) => void,
  onUpdated: (alert: EmergencyAlert) => void
) => {
  socket.on('alert:created', onCreated);
  socket.on('alert:updated', onUpdated);

  return () => {
    socket.off('alert:created', onCreated);
    socket.off('alert:updated', onUpdated);
  };
};

export const updateAlertStatus = async (alertId: string, status: AlertStatus) => {
  try {
    const response = await fetch(`${API_BASE}/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || 'Failed to update alert');
    }
    return await response.json();
  } catch (error) {
    handleApiError(error, OperationType.UPDATE, `${API_BASE}/${alertId}`);
  }
};

export const createDemoAlert = async (alert: Omit<EmergencyAlert, 'alertId' | 'timestamp'>) => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || 'Failed to create alert');
    }
    return await response.json();
  } catch (error) {
    handleApiError(error, OperationType.CREATE, API_BASE);
  }
};
