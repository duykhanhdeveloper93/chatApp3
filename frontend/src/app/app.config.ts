import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { routes } from "./app.routes";
import { AuthInterceptor } from "./core/interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    importProvidersFrom(BrowserAnimationsModule),
  ],
};
