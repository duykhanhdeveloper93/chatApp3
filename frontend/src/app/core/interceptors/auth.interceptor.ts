import { Injectable } from "@angular/core"
import  { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from "@angular/common/http"
import { catchError, switchMap, throwError } from "rxjs"
import  { AuthService } from "../services/auth.service"
import  { Router } from "@angular/router"

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.token

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && token) {
          // Try to refresh token
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              // Retry original request with new token
              const newToken = this.authService.token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              })
              return next.handle(retryReq)
            }),
            catchError(() => {
              // Refresh failed, logout user
              this.authService.logout()
              return throwError(() => error)
            }),
          )
        }

        return throwError(() => error)
      }),
    )
  }
}
