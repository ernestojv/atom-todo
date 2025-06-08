import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HOME_ROUTES } from './home.routes';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(HOME_ROUTES),
  ]
})
export class HomeModule { }
