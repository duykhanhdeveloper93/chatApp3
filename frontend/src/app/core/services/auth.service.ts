import { Injectable } from "@angular/core"
import type { HttpClient } from "@angular/common/http"
import { BehaviorSubject, type Observable, tap } from "rxjs"
import type { Router } from "@angular/router"

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  isActive: boolean
  lastSeen?: Date
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly API_URL = "http://localhost:3000/api"
  private currentUserSubject = new BehaviorSubject<User | null>(null)
  private tokenSubject = new BehaviorSubject<string | null>(null)

  public currentUser$ = this.currentUserSubject.asObservable()
  public token$ = this.tokenSubject.asObservable()

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadStoredAuth()
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem("accessToken")
    const user = localStorage.getItem("user")

    if (token && user) {
      this.tokenSubject.next(token)
      this.currentUserSubject.next(JSON.parse(user))
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(tap((response) => this.handleAuthSuccess(response)))
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(tap((response) => this.handleAuthSuccess(response)))
  }

  logout(): void {
    const refreshToken = localStorage.getItem("refreshToken")

    if (refreshToken) {
      this.http.post(`${this.API_URL}/auth/logout`, { refreshToken }).subscribe()
    }

    this.clearAuth()
    this.router.navigate(["/auth/login"])
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem("refreshToken")

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken })
      .pipe(tap((response) => this.handleAuthSuccess(response)))
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem("accessToken", response.accessToken)
    localStorage.setItem("refreshToken", response.refreshToken)
    localStorage.setItem("user", JSON.stringify(response.user))

    this.tokenSubject.next(response.accessToken)
    this.currentUserSubject.next(response.user)
  }

  private clearAuth(): void {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")

    this.tokenSubject.next(null)
    this.currentUserSubject.next(null)
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value
  }

  get token(): string | null {
    return this.tokenSubject.value
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser
  }
}
