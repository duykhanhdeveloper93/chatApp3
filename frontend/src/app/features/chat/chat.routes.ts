import type { Routes } from "@angular/router"

export const chatRoutes: Routes = [
  {
    path: "",
    loadComponent: () => import("./chat-layout/chat-layout.component").then((m) => m.ChatLayoutComponent),
    children: [
      {
        path: "",
        redirectTo: "rooms",
        pathMatch: "full",
      },
      {
        path: "rooms",
        loadComponent: () => import("./chat-rooms/chat-rooms.component").then((m) => m.ChatRoomsComponent),
      },
      {
        path: "rooms/:id",
        loadComponent: () => import("./chat-room/chat-room.component").then((m) => m.ChatRoomComponent),
      },
    ],
  },
]
