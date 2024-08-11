import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataserviceService } from '../services/dataservice.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private ds: DataserviceService, private router: Router) {}

  register() {
    if (!this.validateInputs()) {
      return;
    }

    const requestData = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.ds.sendApiRequest('register', requestData).subscribe(
      (response: any) => {
        console.log(response);

        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'You have been registered successfully.',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/login']);
        });

        this.username = '';
        this.email = '';
        this.password = '';
      },
    );
  }

  validateInputs(): boolean {
    if (!this.username) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Username',
        text: 'Please enter a Username.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return false;
    }
    if (!this.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Email',
        text: 'Please enter an Email address.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return false;
    }
    if (!this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Password',
        text: 'Please enter a Password.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return false;
    }
    if (!this.isUsernameValid(this.username)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Username',
        text: 'Username should only contain alphabets and numbers.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return false;
    }
    if (!this.isEmailValid(this.email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Email',
        text: 'Please enter a valid email address ending with @gmail.com.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return false;
    }
    if (!this.isPasswordValid(this.password)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Password',
        text: 'Password should be at least 6 characters long.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return false;
    }
    return true;
  }

  isUsernameValid(username: string): boolean {
    const usernamePattern = /^[a-zA-Z0-9 ]+$/;
    return usernamePattern.test(username);
  }

  isEmailValid(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._]+@gmail\.com$/;
    return emailPattern.test(email);
  }

  isPasswordValid(password: string): boolean {
    return password.length >= 6;
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }
}
