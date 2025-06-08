import { Component } from '@angular/core';
import { CardComponent } from '../components/card/card.component';
import { TaskCardComponent } from '../components/task-card/task-card.component';
import { Task } from '../models/task.model';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-task',
  imports: [CardComponent, TaskCardComponent, HeaderComponent],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent {

  tasks: Task[] = [
    {
      id: "fChaeJ9aBPjMM5us9GLe",
      title: "The first Task",
      description: "Todo test",
      status: "todo",
      createdAt: "2025-06-07T22:33:18.294Z",
      userEmail: "test@todo.com"
    },
    {
      id: "fChaeJ9aBPjMM5us9GLe2",
      title: "The second Task",
      description: "Todo test 2",
      status: "in_progress",
      createdAt: "2025-06-07T22:33:18.294Z",
      userEmail: "test@todo.com"
    },
    {
      id: "fChaeJ9aBPjMM5us9GLe3",
      title: "The third Task",
      description: "Todo test 3",
      status: "done",
      createdAt: "2025-06-07T22:33:18.294Z",
      userEmail: "test@todo.com"
    }
  ];

  todoTasks: Task[] = this.tasks.filter(task => task.status === 'todo');
  inProgressTasks: Task[] = this.tasks.filter(task => task.status === 'in_progress');
  doneTasks: Task[] = this.tasks.filter(task => task.status === 'done');

}
