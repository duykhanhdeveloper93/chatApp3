import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardModule, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatInput, MatInputModule, MatLabel } from '@angular/material/input';


@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCard,
    MatFormField,
    MatButton,
    MatLabel,
    MatInput,
    MatCardContent,
    MatCardHeader,
    MatCardTitle
  ],
})
export class Login {
  email: string = '';
  password: string = '';
  error: string = '';
 isPlaying: boolean = true;
 
  constructor(private authService: AuthService) {}

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: () => {},
      error: (err) => this.error = 'Đăng nhập thất bại: ' + err.message
    });
  }

  toggleVideo(video: HTMLVideoElement) {
    if (video.paused) {
      video.play();
      this.isPlaying = true;
    } else {
      video.pause();
      this.isPlaying = false;
    }
  }
}