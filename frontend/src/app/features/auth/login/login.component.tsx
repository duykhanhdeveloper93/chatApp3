import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { type FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { type Router, RouterModule } from "@angular/router"
import type { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-bold text-foreground">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm text-muted-foreground">
            Or
            <a routerLink="/auth/register" class="font-medium text-primary hover:text-primary/80">
              create a new account
            </a>
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                formControlName="email"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your email"
              />
              <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" 
                   class="mt-1 text-sm text-destructive">
                Please enter a valid email address
              </div>
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                formControlName="password"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your password"
              />
              <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" 
                   class="mt-1 text-sm text-destructive">
                Password is required
              </div>
            </div>
          </div>

          <div *ngIf="error" class="text-sm text-destructive text-center">
            {{ error }}
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="loading" class="mr-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup
  loading = false
  error = ""

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    })
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true
      this.error = ""

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(["/chat"])
        },
        error: (error) => {
          this.error = error.error?.message || "Login failed. Please try again."
          this.loading = false
        },
      })
    }
  }
}
