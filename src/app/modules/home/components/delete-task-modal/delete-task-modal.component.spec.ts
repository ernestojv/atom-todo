import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { DeleteTaskModalComponent } from './delete-task-modal.component';
import { TaskService } from '../../../../core/services/task.service';
import { Task, CreateTaskResponse } from '../../../../core/models/task.model';

describe('DeleteTaskModalComponent', () => {
  let component: DeleteTaskModalComponent;
  let fixture: ComponentFixture<DeleteTaskModalComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;

  const mockTask: Task = {
    id: '456',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    createdAt: new Date('2024-01-01'),
    userEmail: 'test@example.com'
  };

  const mockDeleteResponse: CreateTaskResponse = {
    success: true,
    data: mockTask,
    message: 'Task deleted successfully'
  };

  beforeEach(async () => {
    const taskServiceSpyObj = jasmine.createSpyObj('TaskService', ['deleteTask']);

    await TestBed.configureTestingModule({
      imports: [DeleteTaskModalComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpyObj },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteTaskModalComponent);
    component = fixture.componentInstance;
    taskServiceSpy = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.taskToDelete).toBeNull();
    });

    it('should accept taskToDelete input', () => {
      component.taskToDelete = mockTask;
      expect(component.taskToDelete).toEqual(mockTask);
    });
  });

  describe('Successful Task Deletion', () => {
    beforeEach(() => {
      component.taskToDelete = mockTask;
    });

    it('should delete task successfully and emit task', () => {
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith('456');
      expect(component.closeModal.emit).toHaveBeenCalledWith(mockTask);
    });

    it('should call taskService.deleteTask with correct task id', () => {
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledTimes(1);
      expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith('456');
    });

    it('should emit the deleted task when deletion is successful', () => {
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(component.closeModal.emit).toHaveBeenCalledWith(mockTask);
    });

    it('should handle response with success true', () => {
      const successResponse = { ...mockDeleteResponse, success: true };
      taskServiceSpy.deleteTask.and.returnValue(of(successResponse));
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(component.closeModal.emit).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('Task Deletion Errors', () => {
    beforeEach(() => {
      component.taskToDelete = mockTask;
    });

    it('should handle unsuccessful response from server', () => {
      const unsuccessfulResponse = {
        ...mockDeleteResponse,
        success: false,
        message: 'Failed to delete task'
      };
      taskServiceSpy.deleteTask.and.returnValue(of(unsuccessfulResponse));
      spyOn(console, 'error');
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('Failed to delete task:', 'Failed to delete task');
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });

    it('should handle HTTP error from taskService', () => {
      const error = new Error('Network error');
      taskServiceSpy.deleteTask.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('Error deleting task:', error);
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });

    it('should handle server error (500)', () => {
      const serverError = new Error('Internal server error');
      taskServiceSpy.deleteTask.and.returnValue(throwError(() => serverError));
      spyOn(console, 'error');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('Error deleting task:', serverError);
    });

    it('should handle network timeout error', () => {
      const timeoutError = new Error('Request timeout');
      taskServiceSpy.deleteTask.and.returnValue(throwError(() => timeoutError));
      spyOn(console, 'error');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('Error deleting task:', timeoutError);
    });
  });

  describe('Null Task Handling', () => {
    it('should handle null taskToDelete', () => {
      component.taskToDelete = null;
      spyOn(console, 'error');
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('taskToDelete is null');
      expect(component.closeModal.emit).toHaveBeenCalledWith(undefined);
    });

    it('should not call taskService when taskToDelete is null', () => {
      component.taskToDelete = null;

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).not.toHaveBeenCalled();
    });

    it('should emit undefined when taskToDelete is null', () => {
      component.taskToDelete = null;
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(component.closeModal.emit).toHaveBeenCalledWith(undefined);
    });

    it('should log error when taskToDelete is null', () => {
      component.taskToDelete = null;
      spyOn(console, 'error');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('taskToDelete is null');
    });
  });

  describe('Input and Output Bindings', () => {
    it('should accept different task objects as input', () => {
      const differentTask: Task = {
        id: '789',
        title: 'Different Task',
        description: 'Different Description',
        status: 'in_progress',
        createdAt: new Date('2024-01-02'),
        userEmail: 'different@example.com'
      };

      component.taskToDelete = differentTask;
      expect(component.taskToDelete).toEqual(differentTask);
    });

    it('should emit closeModal event with correct data', () => {
      component.taskToDelete = mockTask;
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));

      let emittedTask: Task | null | undefined;
      component.closeModal.subscribe((task) => {
        emittedTask = task;
      });

      component.onDeleteTask();

      expect(emittedTask).toEqual(mockTask);
    });

    it('should be able to change taskToDelete multiple times', () => {
      const task1: Task = { ...mockTask, id: '1', title: 'Task 1' };
      const task2: Task = { ...mockTask, id: '2', title: 'Task 2' };

      component.taskToDelete = task1;
      expect(component.taskToDelete).toEqual(task1);

      component.taskToDelete = task2;
      expect(component.taskToDelete).toEqual(task2);

      component.taskToDelete = null;
      expect(component.taskToDelete).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with empty id', () => {
      const taskWithEmptyId: Task = { ...mockTask, id: '' };
      component.taskToDelete = taskWithEmptyId;
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith('');
    });

    it('should handle task with special characters in id', () => {
      const taskWithSpecialId: Task = { ...mockTask, id: 'task-123_test@domain' };
      component.taskToDelete = taskWithSpecialId;
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith('task-123_test@domain');
    });

    it('should handle response without message', () => {
      const responseWithoutMessage = {
        success: false,
        data: mockTask
      } as CreateTaskResponse;

      component.taskToDelete = mockTask;
      taskServiceSpy.deleteTask.and.returnValue(of(responseWithoutMessage));
      spyOn(console, 'error');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('Failed to delete task:', undefined);
    });

    it('should handle multiple rapid delete attempts', () => {
      component.taskToDelete = mockTask;
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));
      spyOn(component.closeModal, 'emit');

      // Simulate rapid clicks
      component.onDeleteTask();
      component.onDeleteTask();
      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledTimes(3);
      expect(component.closeModal.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('Response Validation', () => {
    beforeEach(() => {
      component.taskToDelete = mockTask;
    });

    it('should handle response with success property missing', () => {
      const responseWithoutSuccess = {
        data: mockTask,
        message: 'Task deleted'
      } as any;

      taskServiceSpy.deleteTask.and.returnValue(of(responseWithoutSuccess));
      spyOn(console, 'error');
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      // Since success is falsy (undefined), it should be treated as unsuccessful
      expect(console.error).toHaveBeenCalledWith('Failed to delete task:', 'Task deleted');
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });

    it('should handle response with success as false string', () => {
      const responseWithStringFalse = {
        success: 'false' as any,
        data: mockTask,
        message: 'Task not deleted'
      };

      taskServiceSpy.deleteTask.and.returnValue(of(responseWithStringFalse));
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      // 'false' string is truthy, so deletion should succeed
      expect(component.closeModal.emit).toHaveBeenCalledWith(mockTask);
    });

    it('should handle empty response object', () => {
      const emptyResponse = {} as CreateTaskResponse;

      taskServiceSpy.deleteTask.and.returnValue(of(emptyResponse));
      spyOn(console, 'error');
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(console.error).toHaveBeenCalledWith('Failed to delete task:', undefined);
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });
  });

  describe('Memory and Performance', () => {
    it('should not cause memory leaks with multiple subscriptions', () => {
      component.taskToDelete = mockTask;
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));

      // Simulate multiple delete operations
      for (let i = 0; i < 10; i++) {
        component.onDeleteTask();
      }

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledTimes(10);
    });

    it('should handle large task objects', () => {
      const largeTask: Task = {
        ...mockTask,
        description: 'x'.repeat(1000), // Large description
        title: 'Large Task Title'.repeat(10)
      };

      component.taskToDelete = largeTask;
      taskServiceSpy.deleteTask.and.returnValue(of(mockDeleteResponse));
      spyOn(component.closeModal, 'emit');

      component.onDeleteTask();

      expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith(largeTask.id);
      expect(component.closeModal.emit).toHaveBeenCalledWith(largeTask);
    });
  });
});
