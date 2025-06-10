import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component, DebugElement } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { authInterceptor } from '../../../core/interceptors/auth.interceptor';
import { authGuard } from '../../../core/guards/auth.guard';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { AuthState } from '../../../core/models/auth.model';
import { User } from '../../../core/models/user.model';
import { Task, TaskResponse, CreateTaskResponse, TASK_STATUS } from '../../../core/models/task.model';
import { TestFixtures } from '../../fixtures/test-fixtures';

@Component({
  template: `
    <div class="task-page">
      <h1>Task Management</h1>

      <!-- Task Creation Form -->
      <form #taskForm="ngForm" (ngSubmit)="createTask()" class="task-form">
        <div class="form-group">
          <label for="title">Título</label>
          <input
            id="title"
            name="title"
            [(ngModel)]="newTask.title"
            required
            #titleInput="ngModel"
            data-testid="task-title-input"
          >
          <div *ngIf="titleInput.invalid && titleInput.touched" class="error" data-testid="title-error">
            El título es requerido
          </div>
        </div>

        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            [(ngModel)]="newTask.description"
            data-testid="task-description-input"
          ></textarea>
        </div>

        <button
          type="submit"
          [disabled]="taskForm.invalid || isLoading"
          data-testid="create-task-btn"
        >
          {{ isLoading ? 'Creando...' : 'Crear Tarea' }}
        </button>
      </form>

      <!-- Error Display -->
      <div *ngIf="errorMessage" class="error-message" data-testid="error-message">
        {{ errorMessage }}
        <button (click)="clearError()" data-testid="clear-error-btn">×</button>
      </div>

      <!-- Task Statistics -->
      <div class="task-stats" data-testid="task-stats">
        <div class="stat" data-testid="total-tasks">Total: {{ taskStats.total }}</div>
        <div class="stat" data-testid="todo-tasks">Por Hacer: {{ taskStats.todo }}</div>
        <div class="stat" data-testid="progress-tasks">En Progreso: {{ taskStats.inProgress }}</div>
        <div class="stat" data-testid="done-tasks">Completadas: {{ taskStats.done }}</div>
      </div>

      <!-- Task Lists -->
      <div class="task-sections">
        <!-- TODO Tasks -->
        <section class="task-section" data-testid="todo-section">
          <h2>Por Hacer ({{ todoTasks.length }})</h2>
          <div *ngIf="todoTasks.length === 0" class="empty-state" data-testid="todo-empty">
            No hay tareas por hacer
          </div>
          <div
            *ngFor="let task of todoTasks; trackBy: trackByTaskId"
            class="task-card todo-task"
            data-testid="task-item"
            [attr.data-task-id]="task.id"
          >
            <h3 data-testid="task-title">{{ task.title }}</h3>
            <p data-testid="task-description">{{ task.description }}</p>
            <div class="task-actions">
              <button (click)="moveToProgress(task)" data-testid="move-to-progress">En Progreso</button>
              <button (click)="editTask(task)" data-testid="edit-task">Editar</button>
              <button (click)="deleteTask(task)" data-testid="delete-task">Eliminar</button>
            </div>
          </div>
        </section>

        <!-- IN PROGRESS Tasks -->
        <section class="task-section" data-testid="progress-section">
          <h2>En Progreso ({{ progressTasks.length }})</h2>
          <div *ngIf="progressTasks.length === 0" class="empty-state" data-testid="progress-empty">
            No hay tareas en progreso
          </div>
          <div
            *ngFor="let task of progressTasks; trackBy: trackByTaskId"
            class="task-card progress-task"
            data-testid="task-item"
            [attr.data-task-id]="task.id"
          >
            <h3 data-testid="task-title">{{ task.title }}</h3>
            <p data-testid="task-description">{{ task.description }}</p>
            <div class="task-actions">
              <button (click)="markAsDone(task)" data-testid="mark-done">Completar</button>
              <button (click)="moveToTodo(task)" data-testid="move-to-todo">Pendiente</button>
              <button (click)="editTask(task)" data-testid="edit-task">Editar</button>
              <button (click)="deleteTask(task)" data-testid="delete-task">Eliminar</button>
            </div>
          </div>
        </section>

        <!-- DONE Tasks -->
        <section class="task-section" data-testid="done-section">
          <h2>Completadas ({{ doneTasks.length }})</h2>
          <div *ngIf="doneTasks.length === 0" class="empty-state" data-testid="done-empty">
            No hay tareas completadas
          </div>
          <div
            *ngFor="let task of doneTasks; trackBy: trackByTaskId"
            class="task-card done-task"
            data-testid="task-item"
            [attr.data-task-id]="task.id"
          >
            <h3 data-testid="task-title">{{ task.title }}</h3>
            <p data-testid="task-description">{{ task.description }}</p>
            <div class="task-actions">
              <button (click)="moveToTodo(task)" data-testid="move-to-todo">Pendiente</button>
              <button (click)="editTask(task)" data-testid="edit-task">Editar</button>
              <button (click)="deleteTask(task)" data-testid="delete-task">Eliminar</button>
            </div>
          </div>
        </section>
      </div>

      <!-- Edit Modal -->
      <div *ngIf="showEditModal" class="modal" data-testid="edit-modal">
        <div class="modal-content">
          <h3>Editar Tarea</h3>
          <form #editForm="ngForm" (ngSubmit)="saveTask()">
            <input
              [(ngModel)]="editingTask.title"
              name="editTitle"
              required
              data-testid="edit-title-input"
            >
            <textarea
              [(ngModel)]="editingTask.description"
              name="editDescription"
              data-testid="edit-description-input"
            ></textarea>
            <div class="modal-actions">
              <button type="submit" [disabled]="editForm.invalid" data-testid="save-task">Guardar</button>
              <button type="button" (click)="cancelEdit()" data-testid="cancel-edit">Cancelar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="showDeleteModal" class="modal" data-testid="delete-modal">
        <div class="modal-content">
          <h3>¿Eliminar tarea?</h3>
          <p>¿Estás seguro de que quieres eliminar "{{ taskToDelete?.title }}"?</p>
          <div class="modal-actions">
            <button (click)="confirmDelete()" data-testid="confirm-delete">Eliminar</button>
            <button (click)="cancelDelete()" data-testid="cancel-delete">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [FormsModule, CommonModule]
})
class MockTaskComponent {
  tasks: Task[] = [];
  newTask = { title: '', description: '' };
  editingTask: Task = {} as Task;
  taskToDelete: Task | null = null;
  isLoading = false;
  errorMessage = '';
  showEditModal = false;
  showDeleteModal = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {
    this.loadTasks();
  }

  get todoTasks() { return this.tasks.filter(t => t.status === TASK_STATUS.TODO); }
  get progressTasks() { return this.tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS); }
  get doneTasks() { return this.tasks.filter(t => t.status === TASK_STATUS.DONE); }

  get taskStats() {
    return {
      total: this.tasks.length,
      todo: this.todoTasks.length,
      inProgress: this.progressTasks.length,
      done: this.doneTasks.length
    };
  }

  loadTasks() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.taskService.getTasksByUserEmail(user.email).subscribe({
        next: (response) => {
          if (response.success) {
            this.tasks = response.data;
          }
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar las tareas';
        }
      });
    }
  }

  createTask() {
    if (!this.newTask.title.trim()) return;

    this.isLoading = true;
    const user = this.authService.getCurrentUser();

    this.taskService.createTask({
      title: this.newTask.title,
      description: this.newTask.description,
      userEmail: user?.email || ''
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks.push(response.data);
          this.newTask = { title: '', description: '' };
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al crear la tarea';
        this.isLoading = false;
      }
    });
  }

  moveToProgress(task: Task) {
    this.taskService.moveToInProgress(task.id).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], status: TASK_STATUS.IN_PROGRESS };
          }
        }
      },
      error: () => this.errorMessage = 'Error al actualizar la tarea'
    });
  }

  markAsDone(task: Task) {
    this.taskService.markAsDone(task.id).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], status: TASK_STATUS.DONE };
          }
        }
      },
      error: () => this.errorMessage = 'Error al completar la tarea'
    });
  }

  moveToTodo(task: Task) {
    this.taskService.moveBackToTodo(task.id).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], status: TASK_STATUS.TODO };
          }
        }
      },
      error: () => this.errorMessage = 'Error al mover la tarea'
    });
  }

  editTask(task: Task) {
    this.editingTask = { ...task };
    this.showEditModal = true;
  }

  saveTask() {
    this.taskService.updateTask(this.editingTask).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.tasks.findIndex(t => t.id === this.editingTask.id);
          if (index !== -1) {
            this.tasks[index] = { ...this.editingTask };
          }
          this.showEditModal = false;
        }
      },
      error: () => this.errorMessage = 'Error al actualizar la tarea'
    });
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editingTask = {} as Task;
  }

  deleteTask(task: Task) {
    this.taskToDelete = task;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.taskToDelete) {
      this.taskService.deleteTask(this.taskToDelete.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.tasks = this.tasks.filter(t => t.id !== this.taskToDelete!.id);
            this.showDeleteModal = false;
            this.taskToDelete = null;
          }
        },
        error: () => this.errorMessage = 'Error al eliminar la tarea'
      });
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.taskToDelete = null;
  }

  clearError() {
    this.errorMessage = '';
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}

describe('Task Management Integration Tests', () => {
  let fixture: ComponentFixture<MockTaskComponent>;
  let component: MockTaskComponent;
  let router: Router;
  let location: Location;
  let httpTestingController: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let authStateSubject: BehaviorSubject<AuthState>;

  const mockUser: User = TestFixtures.USERS.VALID_USER;
  const mockTasks: Task[] = [
    TestFixtures.TASKS.TODO_TASK,
    TestFixtures.TASKS.IN_PROGRESS_TASK,
    TestFixtures.TASKS.DONE_TASK
  ];

  beforeEach(async () => {
    authStateSubject = new BehaviorSubject<AuthState>({
      isAuthenticated: true,
      user: mockUser,
      token: 'mock-token'
    });

    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUser', 'isAuthenticated', 'getToken'
    ]);

    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getTasksByUserEmail', 'createTask', 'updateTask', 'deleteTask',
      'moveToInProgress', 'markAsDone', 'moveBackToTodo'
    ]);

    Object.defineProperty(authServiceSpy, 'authState$', {
      get: () => authStateSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [MockTaskComponent, FormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'tasks', component: MockTaskComponent, canActivate: [authGuard] },
          { path: '', redirectTo: '/tasks', pathMatch: 'full' }
        ])
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MockTaskComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    try {
      httpTestingController = TestBed.inject(HttpTestingController);
    } catch (error) {
      httpTestingController = null as any;
    }

    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getToken.and.returnValue('mock-token');
  });

  afterEach(() => {
    if (httpTestingController?.verify) {
      httpTestingController.verify();
    }
    if (authStateSubject) {
      authStateSubject.complete();
    }
  });

  describe('Task Loading', () => {
    it('should load tasks on component initialization', () => {
      const mockResponse: TaskResponse = TestFixtures.TASK_RESPONSES.GET_TASKS_SUCCESS;
      mockTaskService.getTasksByUserEmail.and.returnValue(of(mockResponse));

      component.loadTasks();

      expect(mockTaskService.getTasksByUserEmail).toHaveBeenCalledWith(mockUser.email);
      expect(component.tasks).toEqual(mockResponse.data);
    });

    it('should handle task loading errors', () => {
      mockTaskService.getTasksByUserEmail.and.returnValue(throwError(() => new Error('API Error')));

      component.loadTasks();

      expect(component.errorMessage).toBe('Error al cargar las tareas');
    });

    it('should categorize tasks correctly', () => {
      const mockResponse: TaskResponse = TestFixtures.TASK_RESPONSES.GET_TASKS_SUCCESS;
      mockTaskService.getTasksByUserEmail.and.returnValue(of(mockResponse));

      component.loadTasks();

      expect(component.todoTasks.length).toBe(1);
      expect(component.progressTasks.length).toBe(1);
      expect(component.doneTasks.length).toBe(1);
      expect(component.taskStats.total).toBe(3);
    });
  });

  describe('Task Creation', () => {
    it('should create a new task successfully', () => {
      const newTaskData = { title: 'Test Task', description: 'Test Description' };
      const mockResponse: CreateTaskResponse = TestFixtures.TASK_RESPONSES.CREATE_TASK_SUCCESS;

      mockTaskService.createTask.and.returnValue(of(mockResponse));
      component.newTask = newTaskData;

      component.createTask();

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: newTaskData.title,
        description: newTaskData.description,
        userEmail: mockUser.email
      });
      expect(component.tasks).toContain(mockResponse.data);
      expect(component.newTask.title).toBe('');
      expect(component.newTask.description).toBe('');
    });

    it('should not create task with empty title', () => {
      component.newTask = { title: '', description: 'Description' };

      component.createTask();

      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });

    it('should handle task creation errors', () => {
      mockTaskService.createTask.and.returnValue(throwError(() => new Error('API Error')));
      component.newTask = { title: 'Test', description: 'Test' };

      component.createTask();

      expect(component.errorMessage).toBe('Error al crear la tarea');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('UI Integration', () => {
    it('should display task statistics correctly', () => {
      component.tasks = [...mockTasks];
      fixture.detectChanges();

      const statsElement = fixture.debugElement.query(By.css('[data-testid="task-stats"]'));
      expect(statsElement.nativeElement.textContent).toContain('Total: 3');
      expect(statsElement.nativeElement.textContent).toContain('Por Hacer: 1');
      expect(statsElement.nativeElement.textContent).toContain('En Progreso: 1');
      expect(statsElement.nativeElement.textContent).toContain('Completadas: 1');
    });

    it('should display empty states when no tasks', () => {
      component.tasks = [];
      fixture.detectChanges();

      const todoEmpty = fixture.debugElement.query(By.css('[data-testid="todo-empty"]'));
      const progressEmpty = fixture.debugElement.query(By.css('[data-testid="progress-empty"]'));
      const doneEmpty = fixture.debugElement.query(By.css('[data-testid="done-empty"]'));

      expect(todoEmpty.nativeElement.textContent).toContain('No hay tareas por hacer');
      expect(progressEmpty.nativeElement.textContent).toContain('No hay tareas en progreso');
      expect(doneEmpty.nativeElement.textContent).toContain('No hay tareas completadas');
    });

    it('should show error message when present', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
      expect(errorElement.nativeElement.textContent).toContain('Test error message');
    });

    it('should clear error message when clear button clicked', () => {
      component.errorMessage = 'Test error';
      fixture.detectChanges();

      const clearButton = fixture.debugElement.query(By.css('[data-testid="clear-error-btn"]'));
      clearButton.nativeElement.click();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty title', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const titleInput = fixture.debugElement.query(By.css('[data-testid="task-title-input"]'));

      // Simulate user interaction
      titleInput.nativeElement.value = '';
      titleInput.nativeElement.dispatchEvent(new Event('input'));
      titleInput.nativeElement.dispatchEvent(new Event('blur'));

      fixture.detectChanges();
      await fixture.whenStable();

      const createButton = fixture.debugElement.query(By.css('[data-testid="create-task-btn"]'));
      expect(createButton.nativeElement.disabled).toBe(true);
    });

    it('should enable create button when form is valid', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const titleInput = fixture.debugElement.query(By.css('[data-testid="task-title-input"]'));

      // Simulate valid input
      titleInput.nativeElement.value = 'Valid Title';
      titleInput.nativeElement.dispatchEvent(new Event('input'));

      component.newTask.title = 'Valid Title';
      fixture.detectChanges();
      await fixture.whenStable();

      const createButton = fixture.debugElement.query(By.css('[data-testid="create-task-btn"]'));
      expect(createButton.nativeElement.disabled).toBe(false);
    });
  });
});
