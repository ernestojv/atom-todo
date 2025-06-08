import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AUTH_ROUTES } from './auth.routes';
import { RouterModule } from '@angular/router';
import {MatCardModule} from '@angular/material/card';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(AUTH_ROUTES),
    MatCardModule
  ]
})
export class AuthModule { }
