import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { AuthService } from './auth.service';
import { Task, CreateTask, CreateTaskResponse, TaskResponse } from '../models/task.model';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockTask: Task = {
    id: '456',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    createdAt: new Date('2024-01-01'),
    userEmail: 'test@example.com'
  };

  const mockCreateTask: CreateTask = {
    title: 'New Task',
    description: 'New Description',
    userEmail: 'test@example.com',
    status: 'todo'
  };

  const mockCreateTaskResponse: CreateTaskResponse = {
    success: true,
    data: mockTask,
    message: 'Task created successfully',
    timestamp: '2024-01-01T00:00:00Z'
  };

  const mockTaskResponse: TaskResponse = {
    success: true,
    data: [mockTask],
    message: 'Tasks retrieved successfully',
    timestamp: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'getToken']);

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: AuthService, useValue: authServiceSpyObj },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Create Task', () => {
    it('should create task successfully', () => {
      service.createTask(mockCreateTask).subscribe(response => {
        expect(response).toEqual(mockCreateTaskResponse);
        expect(response.success).toBeTrue();
        expect(response.data).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreateTask);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush(mockCreateTaskResponse);
    });

    it('should send correct headers with create request', () => {
      service.createTask(mockCreateTask).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/task`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush(mockCreateTaskResponse);
    });

    it('should handle create task error', () => {
      service.createTask(mockCreateTask).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task`);
      req.flush({ message: 'Invalid task data' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Get Tasks', () => {
    it('should get tasks by user email successfully', () => {
      const userEmail = 'test@example.com';

      service.getTasksByUserEmail(userEmail).subscribe(response => {
        expect(response).toEqual(mockTaskResponse);
        expect(response.success).toBeTrue();
        expect(response.data).toEqual([mockTask]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/?userEmail=${userEmail}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush(mockTaskResponse);
    });

    it('should handle get tasks error', () => {
      const userEmail = 'test@example.com';

      service.getTasksByUserEmail(userEmail).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/?userEmail=${userEmail}`);
      req.flush({ message: 'Tasks not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should encode email parameter correctly', () => {
      const userEmail = 'user+test@example.com';

      service.getTasksByUserEmail(userEmail).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/task/?userEmail=${userEmail}`);
      expect(req.request.url).toContain('userEmail=user+test@example.com');

      req.flush(mockTaskResponse);
    });
  });

  describe('Task Status Updates', () => {
    it('should move task to in progress', () => {
      const taskId = '456';

      service.moveToInProgress(taskId).subscribe(response => {
        expect(response).toEqual(mockCreateTaskResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}/in-progress`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockCreateTaskResponse);
    });

    it('should mark task as done', () => {
      const taskId = '456';

      service.markAsDone(taskId).subscribe(response => {
        expect(response).toEqual(mockCreateTaskResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}/done`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});

      req.flush(mockCreateTaskResponse);
    });

    it('should move task back to todo', () => {
      const taskId = '456';

      service.moveBackToTodo(taskId).subscribe(response => {
        expect(response).toEqual(mockCreateTaskResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}/todo`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});

      req.flush(mockCreateTaskResponse);
    });

    it('should handle status update errors', () => {
      const taskId = '456';

      service.moveToInProgress(taskId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}/in-progress`);
      req.flush({ message: 'Task not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Update Task', () => {
    it('should update task successfully', () => {
      const updatedTask = { ...mockTask, title: 'Updated Title' };

      service.updateTask(updatedTask).subscribe(response => {
        expect(response).toEqual(mockCreateTaskResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${updatedTask.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedTask);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockCreateTaskResponse);
    });

    it('should handle update task error', () => {
      const updatedTask = { ...mockTask, title: 'Updated Title' };

      service.updateTask(updatedTask).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${updatedTask.id}`);
      req.flush({ message: 'Invalid task data' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should include all task fields in update request', () => {
      const completeTask: Task = {
        id: '789',
        title: 'Complete Task',
        description: 'Complete Description',
        status: 'in_progress',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-03'),
        userEmail: 'user@example.com'
      };

      service.updateTask(completeTask).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${completeTask.id}`);
      expect(req.request.body).toEqual(completeTask);

      req.flush(mockCreateTaskResponse);
    });
  });

  describe('Delete Task', () => {
    it('should delete task successfully', () => {
      const taskId = '456';

      service.deleteTask(taskId).subscribe(response => {
        expect(response).toEqual(mockCreateTaskResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockCreateTaskResponse);
    });

    it('should handle delete task error', () => {
      const taskId = '456';

      service.deleteTask(taskId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}`);
      req.flush({ message: 'Task not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should not send body with delete request', () => {
      const taskId = '456';

      service.deleteTask(taskId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/task/${taskId}`);
      expect(req.request.body).toBeNull();

      req.flush(mockCreateTaskResponse);
    });
  });

  describe('HTTP Headers', () => {
    it('should send correct headers with all requests', () => {
      const testCases = [
        { method: () => service.createTask(mockCreateTask), httpMethod: 'POST', url: `${environment.apiUrl}/task` },
        { method: () => service.getTasksByUserEmail('test@example.com'), httpMethod: 'GET', url: `${environment.apiUrl}/task/?userEmail=test@example.com` },
        { method: () => service.moveToInProgress('456'), httpMethod: 'PATCH', url: `${environment.apiUrl}/task/456/in-progress` },
        { method: () => service.markAsDone('456'), httpMethod: 'PATCH', url: `${environment.apiUrl}/task/456/done` },
        { method: () => service.moveBackToTodo('456'), httpMethod: 'PATCH', url: `${environment.apiUrl}/task/456/todo` },
        { method: () => service.updateTask(mockTask), httpMethod: 'PUT', url: `${environment.apiUrl}/task/456` },
        { method: () => service.deleteTask('456'), httpMethod: 'DELETE', url: `${environment.apiUrl}/task/456` }
      ];

      testCases.forEach((testCase, index) => {
        (testCase.method() as any).subscribe();

        const req = httpMock.expectOne(testCase.url);
        expect(req.request.method).toBe(testCase.httpMethod);
        expect(req.request.headers.get('Content-Type')).toBe('application/json');
        expect(req.request.headers.get('Accept')).toBe('application/json');

        req.flush(mockCreateTaskResponse);
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct API URLs for all operations', () => {
      const taskId = '123';
      const userEmail = 'test@example.com';

      const operations = [
        { method: () => service.createTask(mockCreateTask), expectedUrl: `${environment.apiUrl}/task` },
        { method: () => service.getTasksByUserEmail(userEmail), expectedUrl: `${environment.apiUrl}/task/?userEmail=${userEmail}` },
        { method: () => service.moveToInProgress(taskId), expectedUrl: `${environment.apiUrl}/task/${taskId}/in-progress` },
        { method: () => service.markAsDone(taskId), expectedUrl: `${environment.apiUrl}/task/${taskId}/done` },
        { method: () => service.moveBackToTodo(taskId), expectedUrl: `${environment.apiUrl}/task/${taskId}/todo` },
        { method: () => service.updateTask({ ...mockTask, id: taskId }), expectedUrl: `${environment.apiUrl}/task/${taskId}` },
        { method: () => service.deleteTask(taskId), expectedUrl: `${environment.apiUrl}/task/${taskId}` }
      ];

      operations.forEach(operation => {
        (operation.method() as any).subscribe();
        const req = httpMock.expectOne(operation.expectedUrl);
        req.flush(mockCreateTaskResponse);
      });
    });
  });

  describe('Error Response Handling', () => {
    it('should handle various HTTP error codes', () => {
      const errorCodes = [
        { status: 401, statusText: 'Unauthorized' },
        { status: 403, statusText: 'Forbidden' },
        { status: 404, statusText: 'Not Found' },
        { status: 500, statusText: 'Internal Server Error' }
      ];

      errorCodes.forEach(errorCode => {
        service.createTask(mockCreateTask).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(errorCode.status);
            expect(error.statusText).toBe(errorCode.statusText);
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/task`);
        req.flush({ message: 'Error' }, errorCode);
      });
    });
  });

  describe('Response Data Validation', () => {
    it('should handle response with minimal required fields', () => {
      const minimalResponse: CreateTaskResponse = {
        success: true,
        data: mockTask
      };

      service.createTask(mockCreateTask).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data).toEqual(mockTask);
        expect(response.message).toBeUndefined();
        expect(response.timestamp).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task`);
      req.flush(minimalResponse);
    });

    it('should handle response with all optional fields', () => {
      const completeResponse: CreateTaskResponse = {
        success: true,
        data: mockTask,
        message: 'Task created successfully',
        timestamp: '2024-01-01T12:00:00Z'
      };

      service.createTask(mockCreateTask).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data).toEqual(mockTask);
        expect(response.message).toBe('Task created successfully');
        expect(response.timestamp).toBe('2024-01-01T12:00:00Z');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/task`);
      req.flush(completeResponse);
    });

    it('should handle tasks with different statuses', () => {
      const taskStatuses = ['todo', 'in_progress', 'done'];

      taskStatuses.forEach(status => {
        const taskWithStatus = { ...mockTask, status };
        const responseWithStatus = { ...mockTaskResponse, data: [taskWithStatus] };

        service.getTasksByUserEmail('test@example.com').subscribe(response => {
          expect(response.data[0].status).toBe(status);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/task/?userEmail=test@example.com`);
        req.flush(responseWithStatus);
      });
    });
  });
});
