import { Component } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/chat']);
    }
  }

  onLogin() {
    this.authService.login(this.email, this.password).subscribe(
      (res) => {
        this.authService.saveToken(res.token);
        this.router.navigate(['/chat']);
      },
      (err) => {
        this.error = 'Đăng nhập thất bại: ' + err.message;
      }
    );
  }
}