import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Task } from '../../../../core/models/task.model';
import { CardComponent } from '../card/card.component';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-delete-task-modal',
  imports: [CardComponent],
  templateUrl: './delete-task-modal.component.html',
  styleUrl: './delete-task-modal.component.scss'
})
export class DeleteTaskModalComponent {
  @Input() taskToDelete: Task | null = null;
  @Output() closeModal = new EventEmitter<Task | null>();
  private readonly taskService = inject(TaskService);
  onDeleteTask(): void {
    if (this.taskToDelete !== null) {
      this.taskService.deleteTask(this.taskToDelete.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.closeModal.emit(this.taskToDelete);
          } else {
            console.error('Failed to delete task:', response.message);
          }
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
    } else {
      console.error('taskToDelete is null');
      this.closeModal.emit(undefined);
    }
  }
}
