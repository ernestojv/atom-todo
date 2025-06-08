import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class TaskComponent implements OnInit, AfterViewInit {
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);

  createTaskForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  statusMessage = '';
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
    this.announceToScreenReader('Panel de tareas cargado');
  }

  ngAfterViewInit(): void {

  }

  private focusTitleInput(): void {
    if (this.titleInput?.nativeElement) {
      this.titleInput.nativeElement.focus();
    }
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

  onFormKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.onSubmitTask();
    }
  }

  onSubmitTask(): void {
    if (!this.createTaskForm.valid) {
      this.markFormGroupTouched();
      this.announceToScreenReader('Por favor, corrige los errores en el formulario');

      const firstErrorField = this.getFirstErrorField();
      if (firstErrorField) {
        setTimeout(() => firstErrorField.focus(), 100);
      }
      return;
    }

    if (!this.userEmail?.trim()) {
      this.errorMessage = 'Usuario no autenticado';
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.announceToScreenReader('Creando nueva tarea...');

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
          this.announceToScreenReader(`Tarea "${newTask.title}" creada exitosamente`);
          setTimeout(() => this.focusTitleInput(), 100);
        } else {
          this.errorMessage = response.message || 'Error al crear la tarea';
          this.announceToScreenReader(`Error: ${this.errorMessage}`);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Error al crear la tarea';
        this.announceToScreenReader(`Error: ${this.errorMessage}`);
        setTimeout(() => this.focusTitleInput(), 100);
      }
    });
  }

  onTaskStatusChanged(event: { id: string, status: string }): void {
    const currentTasks = this.tasksSubject.value;
    const task = currentTasks.find(t => t.id === event.id);

    if (task) {
      this.announceToScreenReader(`Tarea "${task.title}" movida a ${this.getStatusLabel(event.status)}`);
    }

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
    this.announceToScreenReader(`Abriendo editor para la tarea: ${task.title}`);
  }

  closeUpdateTaskModal(updatedTask: Task | null): void {
    this.showUpdateTaskModal = false;

    if (updatedTask) {
      const currentTasks = this.tasksSubject.value;
      const updatedTasks = currentTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );
      this.tasksSubject.next(updatedTasks);
      this.announceToScreenReader(`Tarea "${updatedTask.title}" actualizada`);
    } else {
      this.announceToScreenReader('Edición cancelada');
    }

    this.taskToUpdate = null;
    this.onRefresh();
  }

  openTaskToDelete(task: Task): void {
    if (!task?.id) return;

    this.taskToDelete = task;
    this.showDeleteTaskModal = true;
    this.announceToScreenReader(`Confirmar eliminación de la tarea: ${task.title}`);
  }

  closeDeleteTaskModal(deleted: Task | null): void {
    this.showDeleteTaskModal = false;

    if (deleted && this.taskToDelete?.id) {
      const currentTasks = this.tasksSubject.value;
      const filteredTasks = currentTasks.filter(task => task.id !== this.taskToDelete?.id);
      this.tasksSubject.next(filteredTasks);
      this.announceToScreenReader(`Tarea "${this.taskToDelete.title}" eliminada`);
    } else {
      this.announceToScreenReader('Eliminación cancelada');
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

  private getFirstErrorField(): HTMLElement | null {
    const formElement = document.querySelector('form');
    if (!formElement) return null;

    const errorFields = formElement.querySelectorAll('[aria-invalid="true"]');
    return errorFields.length > 0 ? errorFields[0] as HTMLElement : null;
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
    this.statusMessage = '';
  }

  onRefresh(): void {
    this.refreshTasks();
    this.announceToScreenReader('Tareas actualizadas');
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'todo': return 'Por hacer';
      case 'in_progress': return 'En progreso';
      case 'done': return 'Completadas';
      default: return status;
    }
  }

  private announceToScreenReader(message: string): void {
    this.statusMessage = message;

    setTimeout(() => {
      this.statusMessage = '';
    }, 1000);
  }
}
