import { Component, inject } from '@angular/core';
import { CardComponent } from '../components/card/card.component';
import { TaskCardComponent } from '../components/task-card/task-card.component';
import { CreateTask, Task } from '../../../core/models/task.model';
import { HeaderComponent } from '../../shared/header/header.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { UpdateTaskModalComponent } from '../components/update-task-modal/update-task-modal.component';

@Component({
  selector: 'app-task',
  imports: [CardComponent, TaskCardComponent, HeaderComponent, ReactiveFormsModule, UpdateTaskModalComponent],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);
  createTaskForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  userEmail: string = this.authService.getCurrentUser()?.email || '';
  tasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  taskToUpdate: Task | null = null;
  showUpdateTaskModal = false;

  constructor() {
    this.createTaskForm = this.formBuilder.group({
      title: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.getTasksByUserEmail();
  }

  onSubmitTask(): void {
    if (this.createTaskForm.valid && !this.isLoading && this.userEmail && this.userEmail.trim() !== '') {
      this.isLoading = true;
      this.errorMessage = '';

      const newTask: CreateTask = {
        title: this.createTaskForm.get('title')?.value,
        description: this.createTaskForm.get('description')?.value,
        userEmail: this.userEmail,
        status: 'todo'
      };

      this.taskService.createTask(newTask).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.tasks.push(response.data);
            this.todoTasks.push(response.data);
            this.createTaskForm.reset();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al crear la tarea';
        }
      });
    }
  }

  getTasksByUserEmail(): void {
    if (this.userEmail && this.userEmail.trim() !== '') {
      this.taskService.getTasksByUserEmail(this.userEmail).subscribe({
        next: (tasks) => {
          this.tasks = tasks.data || [];
          this.todoTasks = this.tasks.filter(task => task.status === 'todo');
          this.inProgressTasks = this.tasks.filter(task => task.status === 'in_progress');
          this.doneTasks = this.tasks.filter(task => task.status === 'done');
          this.errorMessage = tasks.message || '';
        },
        error: (error) => {
          this.errorMessage = error.message || 'Error al obtener las tareas';
        }
      });
    }
  }
  onTaskStatusChanged(event: { id: string, status: string }) {
    const task = this.tasks.find(t => t.id === event.id);
    if (task) {
      task.status = event.status;
      this.todoTasks = this.tasks.filter(task => task.status === 'todo');
      this.inProgressTasks = this.tasks.filter(task => task.status === 'in_progress');
      this.doneTasks = this.tasks.filter(task => task.status === 'done');
    }
  }

  openTaskToUpdate(task: Task): void {
    if (task) {
      this.taskToUpdate = task;
      console.log('Task to update:', this.taskToUpdate);
      this.showUpdateTaskModal = true;
    }
  }

  closeUpdateTaskModal(updatedTask: Task): void {
    this.showUpdateTaskModal = false;

    const task = this.tasks.find(t => t.id === this.taskToUpdate?.id);
    if (task) {
      task.title = updatedTask.title;
      task.description = updatedTask.description;
      task.status = updatedTask.status;

      this.todoTasks = this.tasks.filter(task => task.status === 'todo');
      this.inProgressTasks = this.tasks.filter(task => task.status === 'in_progress');
      this.doneTasks = this.tasks.filter(task => task.status === 'done');
    }

    this.taskToUpdate = null;
  }

}
