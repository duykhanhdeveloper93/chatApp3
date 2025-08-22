import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-chat-rooms",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center h-full bg-background">
      <div class="text-center">
        <div class="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-foreground mb-2">Welcome to Chat</h2>
        <p class="text-muted-foreground mb-6">Select a conversation from the sidebar to start chatting</p>
        <button class="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
          Start New Chat
        </button>
      </div>
    </div>
  `,
})
export class ChatRoomsComponent {}
