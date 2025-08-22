import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterOutlet } from "@angular/router"
import { ChatSidebarComponent } from "../chat-sidebar/chat-sidebar.component"

@Component({
  selector: "app-chat-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatSidebarComponent],
  template: `
    <div class="flex h-screen bg-background">
      <!-- Sidebar -->
      <div class="w-80 border-r border-sidebar-border bg-sidebar">
        <app-chat-sidebar></app-chat-sidebar>
      </div>
      
      <!-- Main Content -->
      <div class="flex-1 flex flex-col">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class ChatLayoutComponent {}
