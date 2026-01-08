export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ASSIGNER' | 'WORKER';
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  deadline?: Date;
  client_id: string;
  system_id: string;
  assigned_to: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
  duration?: number; // saniye cinsinden
  documents?: string[];
  comments?: Comment[];
  client?: Client;
  system?: System;
  assigned_user?: User;
  creator?: User;
}

export interface Client {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface System {
  id: string;
  name: string;
  client_id: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  client?: Client;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

export interface Notification {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  type: 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_COMPLETED' | 'TASK_COMMENT';
  title: string;
  message: string;
  status: 'UNREAD' | 'READ';
  created_at: Date;
  task?: Task;
  sender?: User;
  receiver?: User;
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type UserRole = 'ADMIN' | 'ASSIGNER' | 'WORKER';
export type NotificationStatus = 'UNREAD' | 'READ';
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_COMPLETED' | 'TASK_COMMENT';
