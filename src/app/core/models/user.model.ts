export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserResponse {
  success: boolean;
  data: User;
  message?: string;
  timestamp?: string;
}
