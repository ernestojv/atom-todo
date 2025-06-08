export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  userEmail: string;
}

export interface CreateTask {
  title: string;
  description: string;
  userEmail?: string;
  status?: string;
}
export interface CreateTaskResponse {
  success: boolean;
  data: Task;
  message?: string;
  timestamp?: string;
}

export interface TaskResponse {
  success: boolean;
  data: Task[];
  message?: string;
  timestamp?: string;
}
