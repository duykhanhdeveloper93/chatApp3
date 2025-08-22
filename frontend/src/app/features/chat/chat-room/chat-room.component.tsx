import {
  Component,
  type OnInit,
  type OnDestroy,
  ViewChild,
  type ElementRef,
  type AfterViewChecked,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import type { ActivatedRoute } from "@angular/router"
import { type FormBuilder, type FormGroup, ReactiveFormsModule } from "@angular/forms"
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from "rxjs"
import type { ChatService } from "../../../core/services/chat.service"
import type { SocketService, Message } from "../../../core/services/socket.service"
import type { FileService } from "../../../core/services/file.service"
import type { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-chat-room",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Chat Header -->
      <div class="p-4 border-b border-border bg-card">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <span class="text-accent-foreground font-medium">
                {{ chatRoom?.name?.charAt(0).toUpperCase() || 'C' }}
              </span>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-card-foreground">
                {{ chatRoom?.name || 'Direct Chat' }}
              </h2>
              <p class="text-sm text-muted-foreground">
                {{ getParticipantsText() }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </button>
            <button class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-4">
        <div *ngFor="let message of messages; trackBy: trackByMessageId" 
             [class]="getMessageClasses(message)">
          
          <!-- Message Bubble -->
          <div [class]="getBubbleClasses(message)">
            <!-- Sender Info (for received messages) -->
            <div *ngIf="!isOwnMessage(message)" class="text-xs text-muted-foreground mb-1">
              {{ message.sender.username }}
            </div>
            
            <!-- Message Content -->
            <div class="break-words">
              <!-- Text Message -->
              <div *ngIf="message.type === 'text'" class="text-sm">
                {{ message.content }}
              </div>
              
              <!-- Image Message -->
              <div *ngIf="message.type === 'image'" class="space-y-2">
                <div *ngIf="message.content" class="text-sm">{{ message.content }}</div>
                <div *ngFor="let attachment of message.attachments" class="max-w-xs">
                  <img [src]="getFileUrl(attachment.url)" 
                       [alt]="attachment.originalName"
                       class="rounded-md max-w-full h-auto cursor-pointer hover:opacity-90"
                       (click)="openImageModal(attachment)">
                </div>
              </div>
              
              <!-- File Message -->
              <div *ngIf="message.type === 'file'" class="space-y-2">
                <div *ngIf="message.content" class="text-sm">{{ message.content }}</div>
                <div *ngFor="let attachment of message.attachments" 
                     class="flex items-center space-x-2 p-2 bg-muted rounded-md">
                  <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ attachment.originalName }}</p>
                    <p class="text-xs text-muted-foreground">{{ formatFileSize(attachment.size) }}</p>
                  </div>
                  <button class="text-primary hover:text-primary/80">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Emoji/Sticker -->
              <div *ngIf="message.type === 'emoji' || message.type === 'sticker'" class="text-2xl">
                {{ message.content }}
              </div>
            </div>
            
            <!-- Message Time -->
            <div class="text-xs opacity-70 mt-1">
              {{ formatMessageTime(message.createdAt) }}
              <span *ngIf="message.isEdited" class="ml-1">(edited)</span>
            </div>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div *ngIf="typingUsers.length > 0" class="flex items-center space-x-2 text-muted-foreground">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
          </div>
          <span class="text-sm">
            {{ getTypingText() }}
          </span>
        </div>
      </div>

      <!-- Message Input -->
      <div class="p-4 border-t border-border bg-card">
        <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="flex items-end space-x-2">
          <!-- File Upload Button -->
          <button type="button" 
                  (click)="fileInput.click()"
                  class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>
          
          <!-- Message Input -->
          <div class="flex-1">
            <textarea
              formControlName="content"
              placeholder="Type a message..."
              rows="1"
              class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              (keydown)="onKeyDown($event)"
              (input)="onTyping()"
            ></textarea>
          </div>
          
          <!-- Emoji Button -->
          <button type="button" 
                  class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </button>
          
          <!-- Send Button -->
          <button type="submit" 
                  [disabled]="!messageForm.get('content')?.value?.trim() || sending"
                  class="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg *ngIf="!sending" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <svg *ngIf="sending" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </form>
        
        <!-- Hidden File Input -->
        <input #fileInput 
               type="file" 
               multiple 
               accept="image/*,application/pdf,.doc,.docx,.txt"
               (change)="onFileSelected($event)"
               class="hidden">
      </div>
    </div>
  `,
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

    // Subscribe to socket events
    this.socketService.messages$.pipe(takeUntil(this.destroy$)).subscribe((messages) => {
      this.messages = messages
      this.shouldScrollToBottom = true
    })

    this.socketService.typingUsers$.pipe(takeUntil(this.destroy$)).subscribe((typingUsers) => {
      this.typingUsers = typingUsers.filter(
        (user) => user.chatRoomId === this.chatRoomId && user.userId !== this.authService.currentUser?.id,
      )
    })

    // Setup typing detection
    this.messageForm
      .get("content")
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
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

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }

    // Set new timeout to stop typing
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
          // Send message with attachments
          const messageType = uploadResults[0].mimeType.startsWith("image/") ? "image" : "file"
          this.socketService.sendMessage(this.chatRoomId, "Shared files", messageType, uploadResults).subscribe()
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
    const baseClasses = "flex"
    return this.isOwnMessage(message)
      ? `${baseClasses} justify-end message-slide-in-right`
      : `${baseClasses} justify-start message-slide-in-left`
  }

  getBubbleClasses(message: Message): string {
    const baseClasses = "max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
    return this.isOwnMessage(message)
      ? `${baseClasses} bg-primary text-primary-foreground rounded-br-sm`
      : `${baseClasses} bg-card text-card-foreground border border-border rounded-bl-sm`
  }

  getParticipantsText(): string {
    if (!this.chatRoom?.participants) return ""

    if (this.chatRoom.type === "direct") {
      const otherParticipant = this.chatRoom.participants.find((p: any) => p.id !== this.authService.currentUser?.id)
      return otherParticipant ? `@${otherParticipant.username}` : ""
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
    const messageDate = new Date(date)
    return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
    // TODO: Implement image modal
    window.open(this.getFileUrl(attachment.url), "_blank")
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }
}
