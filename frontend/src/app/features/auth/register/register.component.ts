import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import {  Router, RouterModule } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent {
  registerForm: FormGroup
  loading = false
  error = ""

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group(
      {
        username: ["", [Validators.required, Validators.minLength(3)]],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
      },
      { validators: this.passwordMatchValidator },
    )
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password")
    const confirmPassword = form.get("confirmPassword")

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true })
      return { passwordMismatch: true }
    }

    return null
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true
      this.error = ""

      const { confirmPassword, ...userData } = this.registerForm.value

      this.authService.register(userData).subscribe({
        next: () => {
          this.router.navigate(["/chat"])
        },
        error: (error) => {
          this.error = error.error?.message || "Registration failed. Please try again."
          this.loading = false
        },
      })
    }
  }
}
