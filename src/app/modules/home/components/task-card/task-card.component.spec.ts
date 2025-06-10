import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { TaskCardComponent } from './task-card.component';
import { TaskService } from '../../../../core/services/task.service';
import { Task, CreateTaskResponse } from '../../../../core/models/task.model';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;

  const mockTask: Task = {
    id: '456',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    createdAt: new Date('2024-01-01'),
    userEmail: 'test@example.com'
  };

  const mockTodoResponse: CreateTaskResponse = {
    success: true,
    data: { ...mockTask, status: 'todo' },
    message: 'Task moved to todo'
  };

  const mockInProgressResponse: CreateTaskResponse = {
    success: true,
    data: { ...mockTask, status: 'in_progress' },
    message: 'Task moved to in progress'
  };

  const mockDoneResponse: CreateTaskResponse = {
    success: true,
    data: { ...mockTask, status: 'done' },
    message: 'Task marked as done'
  };

  beforeEach(async () => {
    const taskServiceSpyObj = jasmine.createSpyObj('TaskService', [
      'moveBackToTodo',
      'moveToInProgress',
      'markAsDone'
    ]);

    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpyObj },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    taskServiceSpy = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    // Set required input
    component.task = { ...mockTask };

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should accept task input', () => {
      const testTask: Task = {
        id: '789',
        title: 'Another Task',
        description: 'Another Description',
        status: 'in_progress',
        createdAt: new Date('2024-01-02'),
        userEmail: 'another@example.com'
      };

      component.task = testTask;
      expect(component.task).toEqual(testTask);
    });

    it('should have required task input', () => {
      expect(component.task).toBeDefined();
      expect(component.task.id).toBe('456');
      expect(component.task.title).toBe('Test Task');
    });
  });

  describe('Status Menu Toggle', () => {
    it('should toggle status menu from false to true', () => {
      expect(component.showStatusMenu).toBeFalse();

      component.toggleStatusMenu();

      expect(component.showStatusMenu).toBeTrue();
    });

    it('should toggle status menu from true to false', () => {
      component.showStatusMenu = true;

      component.toggleStatusMenu();

      expect(component.showStatusMenu).toBeFalse();
    });

    it('should toggle status menu multiple times', () => {
      expect(component.showStatusMenu).toBeFalse();

      component.toggleStatusMenu();
      expect(component.showStatusMenu).toBeTrue();

      component.toggleStatusMenu();
      expect(component.showStatusMenu).toBeFalse();

      component.toggleStatusMenu();
      expect(component.showStatusMenu).toBeTrue();
    });
  });

  describe('Status Change - Move to Todo', () => {
    it('should move task to todo successfully', () => {
      taskServiceSpy.moveBackToTodo.and.returnValue(of(mockTodoResponse));
      spyOn(component.statusChanged, 'emit');

      component.selectStatus('todo');

      expect(taskServiceSpy.moveBackToTodo).toHaveBeenCalledWith('456');
      expect(component.task.status).toBe('todo');
      expect(component.statusChanged.emit).toHaveBeenCalledWith({
        id: '456',
        status: 'todo'
      });
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle unsuccessful todo response', () => {
      const unsuccessfulResponse = { ...mockTodoResponse, success: false };
      taskServiceSpy.moveBackToTodo.and.returnValue(of(unsuccessfulResponse));
      spyOn(component.statusChanged, 'emit');

      const originalStatus = component.task.status;
      component.selectStatus('todo');

      expect(component.task.status).toBe(originalStatus);
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle error moving task to todo', () => {
      const error = new Error('Network error');
      taskServiceSpy.moveBackToTodo.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      spyOn(component.statusChanged, 'emit');

      const originalStatus = component.task.status;
      component.selectStatus('todo');

      expect(console.error).toHaveBeenCalledWith('Error moving task back to todo:', error);
      expect(component.task.status).toBe(originalStatus);
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });
  });

  describe('Status Change - Move to In Progress', () => {
    it('should move task to in progress successfully', () => {
      taskServiceSpy.moveToInProgress.and.returnValue(of(mockInProgressResponse));
      spyOn(component.statusChanged, 'emit');

      component.selectStatus('in_progress');

      expect(taskServiceSpy.moveToInProgress).toHaveBeenCalledWith('456');
      expect(component.task.status).toBe('in_progress');
      expect(component.statusChanged.emit).toHaveBeenCalledWith({
        id: '456',
        status: 'in_progress'
      });
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle unsuccessful in progress response', () => {
      const unsuccessfulResponse = { ...mockInProgressResponse, success: false };
      taskServiceSpy.moveToInProgress.and.returnValue(of(unsuccessfulResponse));
      spyOn(component.statusChanged, 'emit');

      const originalStatus = component.task.status;
      component.selectStatus('in_progress');

      expect(component.task.status).toBe(originalStatus);
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle error moving task to in progress', () => {
      const error = new Error('Server error');
      taskServiceSpy.moveToInProgress.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      spyOn(component.statusChanged, 'emit');

      const originalStatus = component.task.status;
      component.selectStatus('in_progress');

      expect(console.error).toHaveBeenCalledWith('Error moving task to in progress:', error);
      expect(component.task.status).toBe(originalStatus);
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('Status Change - Mark as Done', () => {
    it('should mark task as done successfully', () => {
      taskServiceSpy.markAsDone.and.returnValue(of(mockDoneResponse));
      spyOn(component.statusChanged, 'emit');

      component.selectStatus('done');

      expect(taskServiceSpy.markAsDone).toHaveBeenCalledWith('456');
      expect(component.task.status).toBe('done');
      expect(component.statusChanged.emit).toHaveBeenCalledWith({
        id: '456',
        status: 'done'
      });
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle unsuccessful done response', () => {
      const unsuccessfulResponse = { ...mockDoneResponse, success: false };
      taskServiceSpy.markAsDone.and.returnValue(of(unsuccessfulResponse));
      spyOn(component.statusChanged, 'emit');

      const originalStatus = component.task.status;
      component.selectStatus('done');

      expect(component.task.status).toBe(originalStatus);
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle error marking task as done', () => {
      const error = new Error('Database error');
      taskServiceSpy.markAsDone.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      spyOn(component.statusChanged, 'emit');

      const originalStatus = component.task.status;
      component.selectStatus('done');

      expect(console.error).toHaveBeenCalledWith('Error marking task as done:', error);
      expect(component.task.status).toBe(originalStatus);
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Status Handling', () => {
    it('should handle unknown status gracefully', () => {
      spyOn(component.statusChanged, 'emit');

      component.selectStatus('unknown_status');

      expect(taskServiceSpy.moveBackToTodo).not.toHaveBeenCalled();
      expect(taskServiceSpy.moveToInProgress).not.toHaveBeenCalled();
      expect(taskServiceSpy.markAsDone).not.toHaveBeenCalled();
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle empty status string', () => {
      spyOn(component.statusChanged, 'emit');

      component.selectStatus('');

      expect(taskServiceSpy.moveBackToTodo).not.toHaveBeenCalled();
      expect(taskServiceSpy.moveToInProgress).not.toHaveBeenCalled();
      expect(taskServiceSpy.markAsDone).not.toHaveBeenCalled();
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });

    it('should handle null status', () => {
      spyOn(component.statusChanged, 'emit');

      component.selectStatus(null as any);

      expect(taskServiceSpy.moveBackToTodo).not.toHaveBeenCalled();
      expect(taskServiceSpy.moveToInProgress).not.toHaveBeenCalled();
      expect(taskServiceSpy.markAsDone).not.toHaveBeenCalled();
      expect(component.statusChanged.emit).not.toHaveBeenCalled();
      expect(component.showStatusMenu).toBeFalse();
    });
  });

  describe('Task Update Emission', () => {
    it('should emit updateTask event with current task', () => {
      spyOn(component.updateTask, 'emit');

      component.emitUpdateTask();

      expect(component.updateTask.emit).toHaveBeenCalledWith(component.task);
    });

    it('should emit update event with modified task', () => {
      const modifiedTask = { ...mockTask, title: 'Modified Title' };
      component.task = modifiedTask;
      spyOn(component.updateTask, 'emit');

      component.emitUpdateTask();

      expect(component.updateTask.emit).toHaveBeenCalledWith(modifiedTask);
    });

    it('should emit updateTask multiple times correctly', () => {
      spyOn(component.updateTask, 'emit');

      component.emitUpdateTask();
      component.emitUpdateTask();
      component.emitUpdateTask();

      expect(component.updateTask.emit).toHaveBeenCalledTimes(3);
      expect(component.updateTask.emit).toHaveBeenCalledWith(component.task);
    });
  });

  describe('Task Delete Emission', () => {
    it('should emit deleteTask event with current task', () => {
      spyOn(component.deleteTask, 'emit');

      component.emitDeleteTask();

      expect(component.deleteTask.emit).toHaveBeenCalledWith(component.task);
    });

    it('should emit delete event with modified task', () => {
      const modifiedTask = { ...mockTask, title: 'To be deleted' };
      component.task = modifiedTask;
      spyOn(component.deleteTask, 'emit');

      component.emitDeleteTask();

      expect(component.deleteTask.emit).toHaveBeenCalledWith(modifiedTask);
    });

    it('should emit deleteTask multiple times correctly', () => {
      spyOn(component.deleteTask, 'emit');

      component.emitDeleteTask();
      component.emitDeleteTask();

      expect(component.deleteTask.emit).toHaveBeenCalledTimes(2);
      expect(component.deleteTask.emit).toHaveBeenCalledWith(component.task);
    });
  });

  describe('Event Emission Integration', () => {
    it('should emit all three types of events independently', () => {
      taskServiceSpy.markAsDone.and.returnValue(of(mockDoneResponse));
      spyOn(component.statusChanged, 'emit');
      spyOn(component.updateTask, 'emit');
      spyOn(component.deleteTask, 'emit');

      component.selectStatus('done');
      component.emitUpdateTask();
      component.emitDeleteTask();

      expect(component.statusChanged.emit).toHaveBeenCalledWith({ id: '456', status: 'done' });
      expect(component.updateTask.emit).toHaveBeenCalledWith(component.task);
      expect(component.deleteTask.emit).toHaveBeenCalledWith(component.task);
    });

    it('should maintain event emission order', () => {
      const events: string[] = [];

      component.statusChanged.subscribe(() => events.push('status'));
      component.updateTask.subscribe(() => events.push('update'));
      component.deleteTask.subscribe(() => events.push('delete'));

      taskServiceSpy.markAsDone.and.returnValue(of(mockDoneResponse));

      component.selectStatus('done');
      component.emitUpdateTask();
      component.emitDeleteTask();

      expect(events).toEqual(['status', 'update', 'delete']);
    });
  });

  describe('State Management', () => {
    it('should close status menu after successful status change', () => {
      component.showStatusMenu = true;
      taskServiceSpy.moveToInProgress.and.returnValue(of(mockInProgressResponse));

      component.selectStatus('in_progress');

      expect(component.showStatusMenu).toBeFalse();
    });

    it('should close status menu even after failed status change', () => {
      component.showStatusMenu = true;
      taskServiceSpy.moveToInProgress.and.returnValue(throwError(() => new Error('Failed')));

      component.selectStatus('in_progress');

      expect(component.showStatusMenu).toBeFalse();
    });

    it('should maintain task state after failed operations', () => {
      const originalTask = { ...component.task };
      taskServiceSpy.markAsDone.and.returnValue(throwError(() => new Error('Failed')));

      component.selectStatus('done');

      expect(component.task).toEqual(originalTask);
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle task changes after initialization', () => {
      const newTask: Task = {
        id: '999',
        title: 'New Task',
        description: 'New Description',
        status: 'in_progress',
        createdAt: new Date('2024-01-03'),
        userEmail: 'new@example.com'
      };

      component.task = newTask;
      taskServiceSpy.markAsDone.and.returnValue(of({ ...mockDoneResponse, data: { ...newTask, status: 'done' } }));
      spyOn(component.statusChanged, 'emit');

      component.selectStatus('done');

      expect(taskServiceSpy.markAsDone).toHaveBeenCalledWith('999');
      expect(component.statusChanged.emit).toHaveBeenCalledWith({ id: '999', status: 'done' });
    });

    it('should emit correct task reference for update and delete', () => {
      const taskRef = component.task;
      spyOn(component.updateTask, 'emit');
      spyOn(component.deleteTask, 'emit');

      component.emitUpdateTask();
      component.emitDeleteTask();

      expect(component.updateTask.emit).toHaveBeenCalledWith(taskRef);
      expect(component.deleteTask.emit).toHaveBeenCalledWith(taskRef);
    });
  });
});
