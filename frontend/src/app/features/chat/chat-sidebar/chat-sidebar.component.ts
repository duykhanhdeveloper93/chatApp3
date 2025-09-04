import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"
import { ChatService } from "../../../core/services/chat.service"

@Component({
  selector: "app-chat-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./chat-sidebar.component.html",
  styleUrls: ["./chat-sidebar.component.scss"],
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
