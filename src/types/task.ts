export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'NOT_STARTED' | 'NEW_STARTED' | 'IN_PROGRESS' | 'IN_TESTING' | 'COMPLETED';
  deadline?: Date;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  duration?: number;
  created_by: string;
  assigned_to: string;
  client_id: string;
  system_id: string;
  subtask_count?: number;
  completed_subtask_count?: number;
  note_count?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  client?: {
    id: string;
    name: string;
  };
  system?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
  };
  subtasks?: Subtask[];
  notes?: Note[];
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: Date;
  completed_at?: Date;
}

export interface Note {
  id: string;
  task_id: string;
  content: string;
  created_by: string;
  created_at: Date;
  author?: {
    id: string;
    name: string;
  };
}
