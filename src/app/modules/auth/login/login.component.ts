import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm;

  constructor(
    private readonly formBuilder: FormBuilder,
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }


}
