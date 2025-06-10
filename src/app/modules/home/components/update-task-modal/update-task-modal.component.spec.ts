import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UpdateTaskModalComponent } from './update-task-modal.component';
import { CardComponent } from '../card/card.component';
import { TaskService } from '../../../../core/services/task.service';
import { Task, CreateTaskResponse } from '../../../../core/models/task.model';
import { EventEmitter } from '@angular/core';

describe('UpdateTaskModalComponent', () => {
  let component: UpdateTaskModalComponent;
  let fixture: ComponentFixture<UpdateTaskModalComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  const mockTask: Task = {
    id: '123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    userEmail: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUpdatedTask: Task = {
    ...mockTask,
    title: 'Updated Task',
    description: 'Updated Description'
  };

  const mockUpdateResponse: CreateTaskResponse = {
    success: true,
    data: mockUpdatedTask,
    message: 'Task updated successfully',
    timestamp: new Date().toISOString()
  };

  beforeEach(async () => {
    // Crear spy del TaskService
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['updateTask']);

    await TestBed.configureTestingModule({
      imports: [
        UpdateTaskModalComponent,
        CardComponent,
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateTaskModalComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.updateTaskForm).toBeDefined();
      expect(component.updateTaskForm.get('title')?.value).toBe('');
      expect(component.updateTaskForm.get('description')?.value).toBe('');
    });

    it('should have FormBuilder injected', () => {
      expect(component['formBuilder']).toBeDefined();
    });

    it('should have TaskService injected', () => {
      expect(component['taskService']).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should patch form values when taskToUpdate is provided', () => {
      component.taskToUpdate = mockTask;

      component.ngOnInit();

      expect(component.updateTaskForm.get('title')?.value).toBe(mockTask.title);
      expect(component.updateTaskForm.get('description')?.value).toBe(mockTask.description);
    });

    it('should not patch form values when taskToUpdate is null', () => {
      component.taskToUpdate = null;

      component.ngOnInit();

      expect(component.updateTaskForm.get('title')?.value).toBe('');
      expect(component.updateTaskForm.get('description')?.value).toBe('');
    });

    it('should not patch form values when taskToUpdate is undefined', () => {
      component.taskToUpdate = undefined as any;

      component.ngOnInit();

      expect(component.updateTaskForm.get('title')?.value).toBe('');
      expect(component.updateTaskForm.get('description')?.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should have valid form when all fields are filled', () => {
      component.updateTaskForm.patchValue({
        title: 'Test Title',
        description: 'Test Description'
      });

      expect(component.updateTaskForm.valid).toBeTruthy();
    });

    it('should have valid form even with empty fields (no validators set)', () => {
      component.updateTaskForm.patchValue({
        title: '',
        description: ''
      });

      expect(component.updateTaskForm.valid).toBeTruthy();
    });
  });

  describe('onUpdateTask', () => {
    beforeEach(() => {
      component.taskToUpdate = mockTask;
      component.updateTaskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description'
      });
    });

    it('should call taskService.updateTask when form is valid and taskToUpdate exists', () => {
      const expectedUpdatedTask = {
        ...mockTask,
        title: 'Updated Task',
        description: 'Updated Description'
      };

      mockTaskService.updateTask.and.returnValue(of(mockUpdateResponse));

      component.onUpdateTask();

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(expectedUpdatedTask);
    });

    it('should emit closeModal with updated task on successful update', () => {
      spyOn(component.closeModal, 'emit');
      mockTaskService.updateTask.and.returnValue(of(mockUpdateResponse));

      component.onUpdateTask();

      expect(component.closeModal.emit).toHaveBeenCalledWith(mockUpdateResponse.data);
    });

    it('should reset form on successful update', () => {
      spyOn(component.updateTaskForm, 'reset');
      mockTaskService.updateTask.and.returnValue(of(mockUpdateResponse));

      component.onUpdateTask();

      expect(component.updateTaskForm.reset).toHaveBeenCalled();
    });

    it('should not call taskService when taskToUpdate is null', () => {
      component.taskToUpdate = null;

      component.onUpdateTask();

      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
    });

    it('should log error when taskToUpdate is null', () => {
      spyOn(console, 'error');
      component.taskToUpdate = null;

      component.onUpdateTask();

      expect(console.error).toHaveBeenCalledWith('Form is invalid or taskToUpdate is null');
    });

    it('should handle service error', () => {
      const error = new Error('Service error');
      spyOn(console, 'error');
      mockTaskService.updateTask.and.returnValue(throwError(() => error));

      component.onUpdateTask();

      expect(console.error).toHaveBeenCalledWith('Error updating task:', error);
    });

    it('should not emit closeModal on service error', () => {
      spyOn(component.closeModal, 'emit');
      const error = new Error('Service error');
      mockTaskService.updateTask.and.returnValue(throwError(() => error));

      component.onUpdateTask();

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });

    it('should not reset form on service error', () => {
      spyOn(component.updateTaskForm, 'reset');
      const error = new Error('Service error');
      mockTaskService.updateTask.and.returnValue(throwError(() => error));

      component.onUpdateTask();

      expect(component.updateTaskForm.reset).not.toHaveBeenCalled();
    });
  });

  describe('Input and Output Properties', () => {
    it('should accept taskToUpdate input', () => {
      component.taskToUpdate = mockTask;

      expect(component.taskToUpdate).toBe(mockTask);
    });

    it('should have closeModal output emitter', () => {
      expect(component.closeModal).toBeDefined();
      expect(component.closeModal instanceof EventEmitter).toBeTruthy();
    });
  });

  describe('Form Integration', () => {
    it('should update form values when taskToUpdate changes and ngOnInit is called', () => {
      const newTask: Task = {
        ...mockTask,
        title: 'New Task Title',
        description: 'New Task Description'
      };

      component.taskToUpdate = newTask;
      component.ngOnInit();

      expect(component.updateTaskForm.get('title')?.value).toBe(newTask.title);
      expect(component.updateTaskForm.get('description')?.value).toBe(newTask.description);
    });

    it('should merge existing task with form values correctly', () => {
      component.taskToUpdate = mockTask;
      component.updateTaskForm.patchValue({
        title: 'Updated Title Only',
        description: 'Updated Description Only'
      });

      const expectedTask = {
        ...mockTask,
        title: 'Updated Title Only',
        description: 'Updated Description Only'
      };

      const expectedResponse: CreateTaskResponse = {
        success: true,
        data: expectedTask,
        message: 'Task updated successfully'
      };

      mockTaskService.updateTask.and.returnValue(of(expectedResponse));

      component.onUpdateTask();

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(expectedTask);
    });
  });
});
