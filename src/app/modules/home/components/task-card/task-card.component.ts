import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, input, Output } from '@angular/core';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() statusChanged = new EventEmitter<{ id: string, status: string }>();
  @Output() updateTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<Task>();
  private readonly taskService = inject(TaskService);
  showStatusMenu = false;

  toggleStatusMenu() {
    this.showStatusMenu = !this.showStatusMenu;
  }

  selectStatus(status: string) {
    switch (status) {
      case 'todo':
        this.taskService.moveBackToTodo(this.task.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.task.status = response.data.status;
              this.statusChanged.emit({ id: this.task.id, status: response.data.status });
            }
          },
          error: (error) => {
            console.error('Error moving task back to todo:', error);
          }
        });
        break;
      case 'in_progress':
        this.taskService.moveToInProgress(this.task.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.task.status = response.data.status;
              this.statusChanged.emit({ id: this.task.id, status: response.data.status });
            }
          },
          error: (error) => {
            console.error('Error moving task to in progress:', error);
          }
        });
        break;
      case 'done':
        this.taskService.markAsDone(this.task.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.task.status = response.data.status;
              this.statusChanged.emit({ id: this.task.id, status: response.data.status });
            }
          },
          error: (error) => {
            console.error('Error marking task as done:', error);
          }
        });
        break;
    }

    this.showStatusMenu = false;
  }

  emitUpdateTask() {
    this.updateTask.emit(this.task);
  }

  emitDeleteTask() {
    this.deleteTask.emit(this.task);
  }
}
