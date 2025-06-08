import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, tap, catchError, of, BehaviorSubject, combineLatest, switchMap } from 'rxjs';

import { CardComponent } from '../components/card/card.component';
import { TaskCardComponent } from '../components/task-card/task-card.component';
import { CreateTask, Task, TaskStatus } from '../../../core/models/task.model';
import { HeaderComponent } from '../../shared/header/header.component';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { UpdateTaskModalComponent } from '../components/update-task-modal/update-task-modal.component';
import { DeleteTaskModalComponent } from '../components/delete-task-modal/delete-task-modal.component';

@Component({
  selector: 'app-task',
  imports: [
    CommonModule,
    CardComponent,
    TaskCardComponent,
    HeaderComponent,
    ReactiveFormsModule,
    UpdateTaskModalComponent,
    DeleteTaskModalComponent
  ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);

  createTaskForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  userEmail: string = this.authService.getCurrentUser()?.email || '';

  taskToUpdate: Task | null = null;
  showUpdateTaskModal = false;
  taskToDelete: Task | null = null;
  showDeleteTaskModal = false;

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private refreshTrigger = new BehaviorSubject<void>(undefined);

  tasks$ = combineLatest([
    this.refreshTrigger,
    of(this.userEmail)
  ]).pipe(
    tap(() => this.errorMessage = ''),
    map(([, email]) => email),
    tap(email => {
      if (!email?.trim()) {
        this.errorMessage = 'Usuario no autenticado';
        this.tasksSubject.next([]);
        return;
      }
    }),
    switchMap(email =>
      email?.trim()
        ? this.taskService.getTasksByUserEmail(email).pipe(
          tap(response => {
            this.tasksSubject.next(response.data || []);
            if (response.message) {
              this.errorMessage = response.message;
            }
          }),
          map(response => response.data || []),
          catchError(error => {
            this.errorMessage = error.message || 'Error al obtener las tareas';
            this.tasksSubject.next([]);
            return of([]);
          })
        )
        : of([])
    )
  );

  todoTasks$ = this.tasks$.pipe(
    map(tasks => tasks.filter(task => task.status === 'todo'))
  );

  inProgressTasks$ = this.tasks$.pipe(
    map(tasks => tasks.filter(task => task.status === 'in_progress'))
  );

  doneTasks$ = this.tasks$.pipe(
    map(tasks => tasks.filter(task => task.status === 'done'))
  );

  taskStats$ = this.tasks$.pipe(
    map(tasks => ({
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0
    }))
  );

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.validateUserAuthentication();
    this.refreshTasks();
  }

  private initializeForm(): void {
    this.createTaskForm = this.formBuilder.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]]
    });
  }

  private validateUserAuthentication(): void {
    if (!this.userEmail?.trim()) {
      this.errorMessage = 'Usuario no autenticado. Por favor, inicia sesión nuevamente.';
    }
  }

  private refreshTasks(): void {
    this.refreshTrigger.next();
  }

  onSubmitTask(): void {
    if (!this.createTaskForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.userEmail?.trim()) {
      this.errorMessage = 'Usuario no autenticado';
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.createTaskForm.value;
    const newTask: CreateTask = {
      title: formValue.title?.trim(),
      description: formValue.description?.trim() || '',
      userEmail: this.userEmail,
      status: 'todo' as TaskStatus
    };

    this.taskService.createTask(newTask).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.createTaskForm.reset();
          this.refreshTasks();
        } else {
          this.errorMessage = response.message || 'Error al crear la tarea';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Error al crear la tarea';
      }
    });
  }

  onTaskStatusChanged(event: { id: string, status: string }): void {
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.map(task =>
      task.id === event.id
        ? { ...task, status: event.status }
        : task
    );
    this.tasksSubject.next(updatedTasks);
    this.onRefresh();
  }

  openTaskToUpdate(task: Task): void {
    if (!task?.id) return;

    this.taskToUpdate = { ...task };
    this.showUpdateTaskModal = true;
  }

  closeUpdateTaskModal(updatedTask: Task | null): void {
    this.showUpdateTaskModal = false;
    this.taskToUpdate = null;

    if (updatedTask) {
      const currentTasks = this.tasksSubject.value;
      const updatedTasks = currentTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );
      this.tasksSubject.next(updatedTasks);
    }
    this.onRefresh();
  }

  openTaskToDelete(task: Task): void {
    if (!task?.id) return;

    this.taskToDelete = task;
    this.showDeleteTaskModal = true;
  }

  closeDeleteTaskModal(deleted: Task | null): void {
    this.showDeleteTaskModal = false;

    if (deleted && this.taskToDelete?.id) {
      const currentTasks = this.tasksSubject.value;
      const filteredTasks = currentTasks.filter(task => task.id !== this.taskToDelete?.id);
      this.tasksSubject.next(filteredTasks);
    }
    this.onRefresh();
    this.taskToDelete = null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createTaskForm.controls).forEach(key => {
      const control = this.createTaskForm.get(key);
      control?.markAsTouched();
    });
  }

  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.createTaskForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.createTaskForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.hasError('required')) {
      return `${fieldName === 'title' ? 'El título' : 'Este campo'} es requerido`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return 'Campo inválido';
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  onRefresh(): void {
    this.refreshTasks();
  }
}
