import  { Routes } from "@angular/router"
import { AuthGuard } from "./core/guards/auth.guard"

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/chat",
    pathMatch: "full",
  },
  {
    path: "auth",
    loadChildren: () => import("./features/auth/auth.routes").then((m) => m.authRoutes),
  },
  {
    path: "chat",
    loadChildren: () => import("./features/chat/chat.routes").then((m) => m.chatRoutes),
    canActivate: [AuthGuard],
  },
  {
    path: "**",
    redirectTo: "/chat",
  },
]
