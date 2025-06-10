import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TaskComponent } from './task.component';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, CreateTask, CreateTaskResponse, TaskResponse } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';

describe('TaskComponent', () => {
  let component: TaskComponent;
  let fixture: ComponentFixture<TaskComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    createdAt: new Date()
  };

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      userEmail: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'in_progress',
      userEmail: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      userEmail: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTaskResponse: TaskResponse = {
    success: true,
    data: mockTasks,
    message: 'Tasks retrieved successfully'
  };

  const mockCreateTaskResponse: CreateTaskResponse = {
    success: true,
    data: mockTasks[0],
    message: 'Task created successfully'
  };

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTasksByUserEmail', 'createTask']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    authServiceSpy.getCurrentUser.and.returnValue(mockUser);
    taskServiceSpy.getTasksByUserEmail.and.returnValue(of(mockTaskResponse));

    await TestBed.configureTestingModule({
      imports: [
        TaskComponent,
        CommonModule,
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with correct validators', () => {
      const titleControl = component.createTaskForm.get('title');
      const descriptionControl = component.createTaskForm.get('description');

      expect(titleControl?.hasError('required')).toBeTruthy();
      expect(descriptionControl?.valid).toBeTruthy();
    });

    it('should set userEmail from auth service', () => {
      expect(component.userEmail).toBe(mockUser.email);
    });

    it('should call refreshTasks on ngOnInit', fakeAsync(() => {
      spyOn(component as any, 'refreshTasks');

      component.ngOnInit();
      tick();

      expect((component as any).refreshTasks).toHaveBeenCalled();
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should validate required title field', () => {
      const titleControl = component.createTaskForm.get('title');

      titleControl?.setValue('');
      titleControl?.markAsTouched();

      expect(component.hasFieldError('title', 'required')).toBeTruthy();
      expect(component.getFieldErrorMessage('title')).toBe('El título es requerido');
    });

    it('should validate title minimum length', () => {
      const titleControl = component.createTaskForm.get('title');

      titleControl?.setValue('ab');
      titleControl?.markAsTouched();

      expect(component.hasFieldError('title', 'minlength')).toBeTruthy();
      expect(component.getFieldErrorMessage('title')).toBe('Mínimo 3 caracteres');
    });

    it('should validate title maximum length', () => {
      const titleControl = component.createTaskForm.get('title');
      const longTitle = 'a'.repeat(101);

      titleControl?.setValue(longTitle);
      titleControl?.markAsTouched();

      expect(component.hasFieldError('title', 'maxlength')).toBeTruthy();
      expect(component.getFieldErrorMessage('title')).toBe('Máximo 100 caracteres');
    });

    it('should validate description maximum length', () => {
      const descriptionControl = component.createTaskForm.get('description');
      const longDescription = 'a'.repeat(501);

      descriptionControl?.setValue(longDescription);
      descriptionControl?.markAsTouched();

      expect(component.hasFieldError('description', 'maxlength')).toBeTruthy();
      expect(component.getFieldErrorMessage('description')).toBe('Máximo 500 caracteres');
    });

    it('should accept valid form data', () => {
      component.createTaskForm.patchValue({
        title: 'Valid Title',
        description: 'Valid Description'
      });

      expect(component.createTaskForm.valid).toBeTruthy();
    });
  });

  describe('Task Creation', () => {
    beforeEach(() => {
      component.ngOnInit();
      mockTaskService.createTask.and.returnValue(of(mockCreateTaskResponse));
    });

    it('should create task when form is valid', fakeAsync(() => {
      component.createTaskForm.patchValue({
        title: 'New Task',
        description: 'New Description'
      });

      component.onSubmitTask();
      tick();

      const expectedTask: CreateTask = {
        title: 'New Task',
        description: 'New Description',
        userEmail: mockUser.email,
        status: 'todo'
      };

      expect(mockTaskService.createTask).toHaveBeenCalledWith(expectedTask);
    }));

    it('should not create task when form is invalid', () => {
      component.createTaskForm.patchValue({
        title: '',
        description: 'Description'
      });

      component.onSubmitTask();

      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });

    it('should not create task when user is not authenticated', () => {
      component.userEmail = '';
      component.createTaskForm.patchValue({
        title: 'Valid Title',
        description: 'Description'
      });

      component.onSubmitTask();

      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Usuario no autenticado');
    });

    it('should reset form after successful creation', fakeAsync(() => {
      spyOn(component.createTaskForm, 'reset');
      component.createTaskForm.patchValue({
        title: 'New Task',
        description: 'Description'
      });

      component.onSubmitTask();
      tick();

      expect(component.createTaskForm.reset).toHaveBeenCalled();
    }));

    it('should handle creation error', fakeAsync(() => {
      const error = new Error('Creation failed');
      mockTaskService.createTask.and.returnValue(throwError(() => error));

      component.createTaskForm.patchValue({
        title: 'New Task',
        description: 'Description'
      });

      component.onSubmitTask();
      tick();

      expect(component.errorMessage).toBe('Creation failed');
      expect(component.isLoading).toBeFalsy();
    }));

    it('should handle Ctrl+Enter keyboard shortcut', () => {
      spyOn(component, 'onSubmitTask');
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });

      component.onFormKeyDown(event);

      expect(component.onSubmitTask).toHaveBeenCalled();
    });
  });

  describe('Task Status Changes', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should update task status locally', () => {
      const statusChangeEvent = { id: '1', status: 'in_progress' };
      spyOn(component, 'onRefresh');

      component.onTaskStatusChanged(statusChangeEvent);

      expect(component.onRefresh).toHaveBeenCalled();
    });
  });

  describe('Update Task Modal', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should open update modal for valid task', () => {
      const task = mockTasks[0];

      component.openTaskToUpdate(task);

      expect(component.showUpdateTaskModal).toBeTruthy();
      expect(component.taskToUpdate).toEqual(task);
    });

    it('should not open update modal for invalid task', () => {
      const invalidTask = { ...mockTasks[0], id: '' };

      component.openTaskToUpdate(invalidTask);

      expect(component.showUpdateTaskModal).toBeFalsy();
      expect(component.taskToUpdate).toBeNull();
    });

    it('should close update modal and update task list', () => {
      const updatedTask = { ...mockTasks[0], title: 'Updated Title' };
      component.showUpdateTaskModal = true;
      component.taskToUpdate = mockTasks[0];
      spyOn(component, 'onRefresh');

      component.closeUpdateTaskModal(updatedTask);

      expect(component.showUpdateTaskModal).toBeFalsy();
      expect(component.taskToUpdate).toBeNull();
      expect(component.onRefresh).toHaveBeenCalled();
    });

    it('should close update modal without updating when cancelled', () => {
      component.showUpdateTaskModal = true;
      component.taskToUpdate = mockTasks[0];
      spyOn(component, 'onRefresh');

      component.closeUpdateTaskModal(null);

      expect(component.showUpdateTaskModal).toBeFalsy();
      expect(component.taskToUpdate).toBeNull();
      expect(component.onRefresh).toHaveBeenCalled();
    });
  });

  describe('Delete Task Modal', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should open delete modal for valid task', () => {
      const task = mockTasks[0];

      component.openTaskToDelete(task);

      expect(component.showDeleteTaskModal).toBeTruthy();
      expect(component.taskToDelete).toEqual(task);
    });

    it('should not open delete modal for invalid task', () => {
      const invalidTask = { ...mockTasks[0], id: '' };

      component.openTaskToDelete(invalidTask);

      expect(component.showDeleteTaskModal).toBeFalsy();
      expect(component.taskToDelete).toBeNull();
    });

    it('should close delete modal and remove task from list', () => {
      const taskToDelete = mockTasks[0];
      component.showDeleteTaskModal = true;
      component.taskToDelete = taskToDelete;
      spyOn(component, 'onRefresh');

      component.closeDeleteTaskModal(taskToDelete);

      expect(component.showDeleteTaskModal).toBeFalsy();
      expect(component.taskToDelete).toBeNull();
      expect(component.onRefresh).toHaveBeenCalled();
    });

    it('should close delete modal without deleting when cancelled', () => {
      component.showDeleteTaskModal = true;
      component.taskToDelete = mockTasks[0];
      spyOn(component, 'onRefresh');

      component.closeDeleteTaskModal(null);

      expect(component.showDeleteTaskModal).toBeFalsy();
      expect(component.onRefresh).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should track tasks by id', () => {
      const task = mockTasks[0];
      const result = component.trackByTaskId(0, task);

      expect(result).toBe(task.id);
    });

    it('should clear error messages', () => {
      component.errorMessage = 'Some error';
      component.statusMessage = 'Some status';

      component.clearError();

      expect(component.errorMessage).toBe('');
      expect(component.statusMessage).toBe('');
    });

    it('should refresh tasks', () => {
      component.onRefresh();

      expect(component.statusMessage).toContain('Tareas actualizadas');
    });
  });

  describe('Authentication Validation', () => {
    it('should set error message when user is not authenticated', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);

      const newFixture = TestBed.createComponent(TaskComponent);
      const newComponent = newFixture.componentInstance;

      newComponent.ngOnInit();

      expect(newComponent.errorMessage).toContain('Usuario no autenticado');
    });

    it('should handle empty email from auth service', () => {
      const userWithoutEmail = { ...mockUser, email: '' };
      mockAuthService.getCurrentUser.and.returnValue(userWithoutEmail);

      const newFixture = TestBed.createComponent(TaskComponent);
      const newComponent = newFixture.componentInstance;

      newComponent.ngOnInit();

      expect(newComponent.errorMessage).toContain('Usuario no autenticado');
    });
  });

  describe('Error Handling', () => {
    it('should handle task loading errors', fakeAsync(() => {
      const error = new Error('Loading failed');
      mockTaskService.getTasksByUserEmail.and.returnValue(throwError(() => error));

      component.ngOnInit();
      tick();

      let tasks: Task[] = [];
      component.tasks$.subscribe(result => {
        tasks = result;
      });

      tick();

      expect(tasks).toEqual([]);
      expect(component.errorMessage).toBe('Loading failed');
    }));

    it('should mark form as touched when submission fails', () => {
      component.createTaskForm.patchValue({
        title: '',
        description: 'Description'
      });

      spyOn(component.createTaskForm.get('title')!, 'markAsTouched');

      component.onSubmitTask();

      expect(component.createTaskForm.get('title')!.markAsTouched).toHaveBeenCalled();
    });
  });

  describe('Observable Tests - Unit Only', () => {
    it('should filter todo tasks correctly', fakeAsync(() => {
      component.ngOnInit();
      tick();

      let todoTasks: Task[] = [];
      component.todoTasks$.subscribe(tasks => {
        todoTasks = tasks;
      });

      tick();

      expect(todoTasks.length).toBe(1);
      expect(todoTasks[0].status).toBe('todo');
    }));

    it('should filter in progress tasks correctly', fakeAsync(() => {
      component.ngOnInit();
      tick();

      let inProgressTasks: Task[] = [];
      component.inProgressTasks$.subscribe(tasks => {
        inProgressTasks = tasks;
      });

      tick();

      expect(inProgressTasks.length).toBe(1);
      expect(inProgressTasks[0].status).toBe('in_progress');
    }));

    it('should filter done tasks correctly', fakeAsync(() => {
      component.ngOnInit();
      tick();

      let doneTasks: Task[] = [];
      component.doneTasks$.subscribe(tasks => {
        doneTasks = tasks;
      });

      tick();

      expect(doneTasks.length).toBe(1);
      expect(doneTasks[0].status).toBe('done');
    }));

    it('should calculate task stats correctly', fakeAsync(() => {
      component.ngOnInit();
      tick();

      let stats: any = {};
      component.taskStats$.subscribe(taskStats => {
        stats = taskStats;
      });

      tick();

      expect(stats.total).toBe(3);
      expect(stats.todo).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.completionRate).toBe(33);
    }));
  });
});
