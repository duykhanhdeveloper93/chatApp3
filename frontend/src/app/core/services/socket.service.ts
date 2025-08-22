import { Injectable } from "@angular/core"
import { io, type Socket } from "socket.io-client"
import { Observable, BehaviorSubject } from "rxjs"
import type { AuthService } from "./auth.service"

export interface Message {
  id: string
  content: string
  type: "text" | "image" | "file" | "emoji" | "sticker"
  senderId: string
  chatRoomId: string
  sender: {
    id: string
    username: string
    avatar?: string
  }
  attachments?: any[]
  createdAt: Date
  isEdited: boolean
}

export interface TypingUser {
  userId: string
  username: string
  chatRoomId: string
}

@Injectable({
  providedIn: "root",
})
export class SocketService {
  private socket: Socket | null = null
  private connectedSubject = new BehaviorSubject<boolean>(false)
  private messagesSubject = new BehaviorSubject<Message[]>([])
  private typingUsersSubject = new BehaviorSubject<TypingUser[]>([])
  private onlineUsersSubject = new BehaviorSubject<string[]>([])

  public connected$ = this.connectedSubject.asObservable()
  public messages$ = this.messagesSubject.asObservable()
  public typingUsers$ = this.typingUsersSubject.asObservable()
  public onlineUsers$ = this.onlineUsersSubject.asObservable()

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.connect()
      } else {
        this.disconnect()
      }
    })
  }

  private connect(): void {
    const token = this.authService.token
    if (!token) return

    this.socket = io("http://localhost:3000/chat", {
      auth: { token },
    })

    this.socket.on("connect", () => {
      console.log("Connected to chat server")
      this.connectedSubject.next(true)
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server")
      this.connectedSubject.next(false)
    })

    this.socket.on("message:new", (message: Message) => {
      const currentMessages = this.messagesSubject.value
      this.messagesSubject.next([...currentMessages, message])
    })

    this.socket.on("typing:start", (data: TypingUser) => {
      const currentTyping = this.typingUsersSubject.value
      const exists = currentTyping.find((u) => u.userId === data.userId && u.chatRoomId === data.chatRoomId)
      if (!exists) {
        this.typingUsersSubject.next([...currentTyping, data])
      }
    })

    this.socket.on("typing:stop", (data: TypingUser) => {
      const currentTyping = this.typingUsersSubject.value
      this.typingUsersSubject.next(
        currentTyping.filter((u) => !(u.userId === data.userId && u.chatRoomId === data.chatRoomId)),
      )
    })

    this.socket.on("user:online", (data: { userId: string; username: string }) => {
      const currentOnline = this.onlineUsersSubject.value
      if (!currentOnline.includes(data.userId)) {
        this.onlineUsersSubject.next([...currentOnline, data.userId])
      }
    })

    this.socket.on("user:offline", (data: { userId: string; username: string }) => {
      const currentOnline = this.onlineUsersSubject.value
      this.onlineUsersSubject.next(currentOnline.filter((id) => id !== data.userId))
    })
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connectedSubject.next(false)
    }
  }

  joinRoom(chatRoomId: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error("Socket not connected")
        return
      }

      this.socket.emit("join:room", { chatRoomId }, (response: any) => {
        if (response.success) {
          observer.next(response)
        } else {
          observer.error(response.message)
        }
        observer.complete()
      })
    })
  }

  leaveRoom(chatRoomId: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error("Socket not connected")
        return
      }

      this.socket.emit("leave:room", { chatRoomId }, (response: any) => {
        if (response.success) {
          observer.next(response)
        } else {
          observer.error(response.message)
        }
        observer.complete()
      })
    })
  }

  sendMessage(chatRoomId: string, content: string, type = "text", attachments?: any[]): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error("Socket not connected")
        return
      }

      const messageData = {
        chatRoomId,
        content,
        type,
        attachments,
      }

      this.socket.emit("send:message", messageData, (response: any) => {
        if (response.success) {
          observer.next(response)
        } else {
          observer.error(response.message)
        }
        observer.complete()
      })
    })
  }

  startTyping(chatRoomId: string): void {
    if (this.socket) {
      this.socket.emit("typing:start", { chatRoomId })
    }
  }

  stopTyping(chatRoomId: string): void {
    if (this.socket) {
      this.socket.emit("typing:stop", { chatRoomId })
    }
  }

  markAsRead(chatRoomId: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error("Socket not connected")
        return
      }

      this.socket.emit("message:read", { chatRoomId }, (response: any) => {
        if (response.success) {
          observer.next(response)
        } else {
          observer.error(response.message)
        }
        observer.complete()
      })
    })
  }

  clearMessages(): void {
    this.messagesSubject.next([])
  }
}
