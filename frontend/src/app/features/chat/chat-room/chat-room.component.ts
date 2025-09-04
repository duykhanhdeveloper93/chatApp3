import {
  Component,
  type OnInit,
  type OnDestroy,
  ViewChild,
  type ElementRef,
  type AfterViewChecked,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { ActivatedRoute } from "@angular/router"
import {  FormBuilder, type FormGroup, ReactiveFormsModule } from "@angular/forms"
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from "rxjs"

import { ChatService } from "../../../core/services/chat.service"
import { SocketService, Message } from "../../../core/services/socket.service"
import { FileService } from "../../../core/services/file.service"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-chat-room",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./chat-room.component.html",
  styleUrls: ["./chat-room.component.scss"],
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild("messagesContainer") messagesContainer!: ElementRef

  chatRoomId!: string
  chatRoom: any = null
  messages: Message[] = []
  typingUsers: any[] = []
  messageForm: FormGroup
  sending = false

  private destroy$ = new Subject<void>()
  private typingTimeout: any
  private shouldScrollToBottom = true

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private socketService: SocketService,
    private fileService: FileService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.messageForm = this.fb.group({
      content: [""],
    })
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.chatRoomId = params["id"]
      this.loadChatRoom()
      this.loadMessages()
      this.joinRoom()
    })

    this.socketService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages) => {
        this.messages = messages
        this.shouldScrollToBottom = true
      })

    this.socketService.typingUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((typingUsers) => {
        this.typingUsers = typingUsers.filter(
          (user) =>
            user.chatRoomId === this.chatRoomId &&
            user.userId !== this.authService.currentUser?.id,
        )
      })

    this.messageForm
      .get("content")
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.stopTyping()
      })
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom()
      this.shouldScrollToBottom = false
    }
  }

  ngOnDestroy(): void {
    this.leaveRoom()
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadChatRoom(): void {
    this.chatService.getChatRoom(this.chatRoomId).subscribe({
      next: (room) => {
        this.chatRoom = room
      },
      error: (error) => {
        console.error("Failed to load chat room:", error)
      },
    })
  }

  loadMessages(): void {
    this.chatService.getChatRoomMessages(this.chatRoomId).subscribe({
      next: (response) => {
        this.messages = response.messages
        this.shouldScrollToBottom = true
      },
      error: (error) => {
        console.error("Failed to load messages:", error)
      },
    })
  }

  joinRoom(): void {
    this.socketService.joinRoom(this.chatRoomId).subscribe({
      next: () => {
        console.log("Joined room successfully")
      },
      error: (error) => {
        console.error("Failed to join room:", error)
      },
    })
  }

  leaveRoom(): void {
    this.socketService.leaveRoom(this.chatRoomId).subscribe()
  }

  sendMessage(): void {
    const content = this.messageForm.get("content")?.value?.trim()
    if (!content || this.sending) return

    this.sending = true
    this.socketService.sendMessage(this.chatRoomId, content).subscribe({
      next: () => {
        this.messageForm.reset()
        this.sending = false
        this.shouldScrollToBottom = true
      },
      error: (error) => {
        console.error("Failed to send message:", error)
        this.sending = false
      },
    })
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.sendMessage()
    }
  }

  onTyping(): void {
    this.socketService.startTyping(this.chatRoomId)

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping()
    }, 1000)
  }

  stopTyping(): void {
    this.socketService.stopTyping(this.chatRoomId)
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
      this.typingTimeout = null
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files
    if (files && files.length > 0) {
      this.fileService.uploadFiles(files).subscribe({
        next: (uploadResults) => {
          const messageType = uploadResults[0].mimeType.startsWith("image/")
            ? "image"
            : "file"
          this.socketService
            .sendMessage(this.chatRoomId, "Shared files", messageType, uploadResults)
            .subscribe()
        },
        error: (error) => {
          console.error("Failed to upload files:", error)
        },
      })
    }
  }

  isOwnMessage(message: Message): boolean {
    return message.senderId === this.authService.currentUser?.id
  }

  getMessageClasses(message: Message): string {
    const base = "flex"
    return this.isOwnMessage(message)
      ? `${base} justify-end message-slide-in-right`
      : `${base} justify-start message-slide-in-left`
  }

  getBubbleClasses(message: Message): string {
    const base = "max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
    return this.isOwnMessage(message)
      ? `${base} bg-primary text-primary-foreground rounded-br-sm`
      : `${base} bg-card text-card-foreground border border-border rounded-bl-sm`
  }

  getParticipantsText(): string {
    if (!this.chatRoom?.participants) return ""
    if (this.chatRoom.type === "direct") {
      const other = this.chatRoom.participants.find(
        (p: any) => p.id !== this.authService.currentUser?.id,
      )
      return other ? `@${other.username}` : ""
    }
    return `${this.chatRoom.participants.length} members`
  }

  getTypingText(): string {
    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0].username} is typing...`
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0].username} and ${this.typingUsers[1].username} are typing...`
    } else if (this.typingUsers.length > 2) {
      return "Several people are typing..."
    }
    return ""
  }

  formatMessageTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  getFileUrl(url: string): string {
    return `http://localhost:3000${url}`
  }

  openImageModal(attachment: any): void {
    window.open(this.getFileUrl(attachment.url), "_blank")
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }
}
