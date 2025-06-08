import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  @Input() task: any;
}
