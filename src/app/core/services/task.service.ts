import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { CreateTask, CreateTaskResponse, Task, TaskResponse } from '../models/task.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl;
  constructor() { }

  createTask(task: CreateTask): Observable<CreateTaskResponse> {
    return this.http.post<CreateTaskResponse>(`${this.API_URL}/task`, task, {
      headers: this.getHeaders()
    })
  }

  getTasksByUserEmail(userEmail: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.API_URL}/task/?userEmail=${userEmail}`, {
      headers: this.getHeaders()
    });
  }

  moveToInProgress(taskId: string): Observable<CreateTaskResponse> {
    return this.http.patch<CreateTaskResponse>(`${this.API_URL}/task/${taskId}/in-progress`, {}, {
      headers: this.getHeaders()
    });
  }

  markAsDone(taskId: string): Observable<CreateTaskResponse> {
    return this.http.patch<CreateTaskResponse>(`${this.API_URL}/task/${taskId}/done`, {}, {
      headers: this.getHeaders()
    });
  }

  moveBackToTodo(taskId: string): Observable<CreateTaskResponse> {
    return this.http.patch<CreateTaskResponse>(`${this.API_URL}/task/${taskId}/todo`, {}, {
      headers: this.getHeaders()
    });
  }

  updateTask(task: Task): Observable<CreateTaskResponse> {
    return this.http.put<CreateTaskResponse>(`${this.API_URL}/task/${task.id}`, task, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
}
