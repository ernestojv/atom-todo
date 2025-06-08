import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Task } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-update-task-modal',
  imports: [CardComponent, ReactiveFormsModule],
  templateUrl: './update-task-modal.component.html',
  styleUrl: './update-task-modal.component.scss'
})
export class UpdateTaskModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  updateTaskForm: FormGroup;
  @Input() taskToUpdate!: Task | null;
  @Output() closeModal = new EventEmitter<Task>();

  constructor() {
    this.updateTaskForm = this.formBuilder.group({
      title: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    if (this.taskToUpdate) {
      this.updateTaskForm.patchValue({
        title: this.taskToUpdate.title,
        description: this.taskToUpdate.description
      });
    }
  }

  onUpdateTask(): void {
    if (this.updateTaskForm.valid && this.taskToUpdate) {
      const updatedTask: Task = {
        ...this.taskToUpdate,
        ...this.updateTaskForm.value
      };
      this.taskService.updateTask(updatedTask).subscribe({
        next: (response) => {
          this.updateTaskForm.reset();
          this.closeModal.emit(response.data);
        },
        error: (error) => {
          console.error('Error updating task:', error);
        }
      });
    } else {
      console.error('Form is invalid or taskToUpdate is null');
    }
  }
}
