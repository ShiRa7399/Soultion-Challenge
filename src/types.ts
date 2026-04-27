export type EmergencyType = 'Fire' | 'Medical' | 'Lift' | 'Security' | 'Other';
export type AlertStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface EmergencyAlert {
  alertId: string;
  name: string;
  roomNumber: string;
  organizationId: string;
  type: EmergencyType;
  status: AlertStatus;
  timestamp: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface EmergencyErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}
