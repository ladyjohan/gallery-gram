import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataserviceService } from '../services/dataservice.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  hidePassword: boolean = true;
  email: string = '';
  password: string = '';
  loginPrompt: string = '';

  constructor(
    private router: Router,
    private ds: DataserviceService
  ) { }

  ngOnInit(): void {
  }

  async login() {
    if (!this.email || !this.password) {
      this.loginPrompt = 'Please enter both Email and Password.';
      return;
    }

    const userInfo = {
      email: this.email,
      password: this.password
    };

    this.ds.sendApiRequest("login", userInfo).subscribe(
      (res: any) => {
        if (res.payload == null) {
          this.loginPrompt = 'Incorrect Email or Password!';
        } else {
          localStorage.setItem("email", res.payload.email);
          localStorage.setItem("user_id", res.payload.user_id);
          localStorage.setItem("username", res.payload.username);

          this.router.navigate(["/gallery"]);
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Login error:', error);
        this.loginPrompt = 'An error occurred while logging in. Please try again later.';
      }
    );
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onRegister(): void {
    this.router.navigate(['/register']);
  }
}
