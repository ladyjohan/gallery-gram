import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataserviceService } from '../services/dataservice.service';
import Swal from 'sweetalert2';  // Import SweetAlert2
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  hidePassword: boolean = true;
  email: string = ''; // Changed type to string
  password: string = ''; // Changed type to string
  loginPrompt: string = '';

  constructor(
    private router: Router,
    private ds: DataserviceService
  ) { }

  ngOnInit(): void {
  }

  async login() {
    if (!this.email || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Credentials',
        text: 'Please enter both Email and Password.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    const userInfo = {
      email: this.email,
      password: this.password
    };

    await this.ds.sendApiRequest("login", userInfo).subscribe((res: any) => {
      if (res.payload == null) {
        Swal.fire({
          icon: 'error',
          title: 'Login Unsuccessful',
          text: 'Incorrect Email or Password!',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      } else {
        localStorage.setItem("email", res.payload.email);
        localStorage.setItem("user_id", res.payload.user_id);
        localStorage.setItem("username", res.payload.username); // Store user's name

        console.log("Username set in localStorage:", localStorage.getItem("username")); // Debug statement
        console.log("User_id set in localStorage:", localStorage.getItem("user_id")); // Debug statement
        console.log("Email set in localStorage:", localStorage.getItem("email")); // Debug statement

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome, ${localStorage.getItem("username")}!`,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(["/gallery"]);
        });
      }
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onRegister(): void {
    this.router.navigate(['/register']); // Navigate to the register component/page
  }
}
