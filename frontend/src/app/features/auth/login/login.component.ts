import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import {  Router, RouterModule } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
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
