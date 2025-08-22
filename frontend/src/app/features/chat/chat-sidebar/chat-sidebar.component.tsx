import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import type { AuthService } from "../../../core/services/auth.service"
import type { ChatService } from "../../../core/services/chat.service"

@Component({
  selector: "app-chat-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b border-sidebar-border">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-sidebar-foreground">Chats</h1>
          <button 
            (click)="logout()"
            class="p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
        
        <!-- User Info -->
        <div class="mt-3 flex items-center space-x-3">
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span class="text-primary-foreground font-medium">
              {{ currentUser?.username?.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <p class="text-sm font-medium text-sidebar-foreground">{{ currentUser?.username }}</p>
            <p class="text-xs text-muted-foreground">{{ currentUser?.email }}</p>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="p-4">
        <div class="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            class="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <!-- Chat Rooms List -->
      <div class="flex-1 overflow-y-auto">
        <div class="px-2">
          <div 
            *ngFor="let room of chatRooms" 
            [routerLink]="['/chat/rooms', room.id]"
            routerLinkActive="bg-sidebar-primary"
            class="flex items-center p-3 rounded-md hover:bg-sidebar-primary cursor-pointer transition-colors group"
          >
            <div class="w-12 h-12 bg-accent rounded-full flex items-center justify-center mr-3">
              <span class="text-accent-foreground font-medium">
                {{ room.name?.charAt(0).toUpperCase() || 'C' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-sidebar-foreground truncate">
                  {{ room.name || 'Direct Chat' }}
                </p>
                <span class="text-xs text-muted-foreground">
                  {{ formatTime(room.updatedAt) }}
                </span>
              </div>
              <p class="text-sm text-muted-foreground truncate">
                {{ room.lastMessage?.content || 'No messages yet' }}
              </p>
            </div>
            <div *ngIf="room.unreadCount > 0" 
                 class="ml-2 bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {{ room.unreadCount }}
            </div>
          </div>
        </div>
      </div>

      <!-- New Chat Button -->
      <div class="p-4 border-t border-sidebar-border">
        <button class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
          New Chat
        </button>
      </div>
    </div>
  `,
})
export class ChatSidebarComponent implements OnInit {
  currentUser = this.authService.currentUser
  chatRooms: any[] = []

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    this.loadChatRooms()
  }

  loadChatRooms(): void {
    this.chatService.getUserChatRooms().subscribe({
      next: (response) => {
        this.chatRooms = response.chatRooms
      },
      error: (error) => {
        console.error("Failed to load chat rooms:", error)
      },
    })
  }

  logout(): void {
    this.authService.logout()
  }

  formatTime(date: string | Date): string {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return messageDate.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }
}
