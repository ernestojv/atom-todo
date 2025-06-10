// src/app/tests/fixtures/test-fixtures.ts
import { User } from '../../core/models/user.model';
import { Task } from '../../core/models/task.model';
import { LoginResponse } from '../../core/models/auth.model';

export class TestFixtures {
  static readonly USERS = {
    VALID_USER: {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01')
    } as User,

    ADMIN_USER: {
      id: '2',
      email: 'admin@example.com',
      createdAt: new Date('2024-01-01')
    } as User,

    ANOTHER_USER: {
      id: '3',
      email: 'another@example.com',
      createdAt: new Date('2024-01-01')
    } as User
  };

  static readonly TASKS = {
    TODO_TASK: {
      id: '1',
      title: 'Test Todo Task',
      description: 'This is a todo task',
      status: 'todo',
      userEmail: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    } as Task,

    IN_PROGRESS_TASK: {
      id: '2',
      title: 'Test In Progress Task',
      description: 'This is an in progress task',
      status: 'in_progress',
      userEmail: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    } as Task,

    DONE_TASK: {
      id: '3',
      title: 'Test Done Task',
      description: 'This is a done task',
      status: 'done',
      userEmail: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    } as Task
  };

  static readonly AUTH_RESPONSES = {
    SUCCESS_LOGIN: {
      success: true,
      data: {
        user: TestFixtures.USERS.VALID_USER,
        token: 'valid-jwt-token-123',
        expiresIn: '1h'
      },
      message: 'Login successful'
    } as LoginResponse,

    FAILED_LOGIN: {
      success: false,
      data: null as any,
      message: 'Invalid credentials'
    } as LoginResponse
  };

  static readonly TASK_RESPONSES = {
    GET_TASKS_SUCCESS: {
      success: true,
      data: [
        TestFixtures.TASKS.TODO_TASK,
        TestFixtures.TASKS.IN_PROGRESS_TASK,
        TestFixtures.TASKS.DONE_TASK
      ],
      message: 'Tasks retrieved successfully'
    },

    CREATE_TASK_SUCCESS: {
      success: true,
      data: TestFixtures.TASKS.TODO_TASK,
      message: 'Task created successfully'
    },

    UPDATE_TASK_SUCCESS: {
      success: true,
      data: { ...TestFixtures.TASKS.TODO_TASK, title: 'Updated Task' },
      message: 'Task updated successfully'
    },

    DELETE_TASK_SUCCESS: {
      success: true,
      data: TestFixtures.TASKS.TODO_TASK,
      message: 'Task deleted successfully'
    }
  };

  static readonly ERROR_RESPONSES = {
    UNAUTHORIZED: {
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Token expired' }
    },

    SERVER_ERROR: {
      status: 500,
      statusText: 'Internal Server Error',
      error: { message: 'Server is down' }
    },

    NOT_FOUND: {
      status: 404,
      statusText: 'Not Found',
      error: { message: 'Resource not found' }
    }
  };

  static createTask(overrides: Partial<Task> = {}): Task {
    return {
      ...TestFixtures.TASKS.TODO_TASK,
      ...overrides,
      id: overrides.id || Math.random().toString(36).substr(2, 9)
    };
  }

  static createUser(overrides: Partial<User> = {}): User {
    return {
      ...TestFixtures.USERS.VALID_USER,
      ...overrides,
      id: overrides.id || Math.random().toString(36).substr(2, 9)
    };
  }

  static createTaskList(count: number, userEmail: string = 'test@example.com'): Task[] {
    return Array.from({ length: count }, (_, index) => ({
      ...TestFixtures.TASKS.TODO_TASK,
      id: `task-${index + 1}`,
      title: `Task ${index + 1}`,
      userEmail
    }));
  }
}
