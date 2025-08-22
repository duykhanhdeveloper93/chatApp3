import { Injectable } from "@angular/core"
import type { HttpClient } from "@angular/common/http"
import type { Observable } from "rxjs"

export interface ChatRoom {
  id: string
  name?: string
  type: "direct" | "group"
  avatar?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  participants: any[]
  lastMessage?: any
  unreadCount?: number
}

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private readonly API_URL = "http://localhost:3000/api"

  constructor(private http: HttpClient) {}

  getUserChatRooms(page = 1, limit = 20): Observable<{ chatRooms: ChatRoom[]; total: number }> {
    return this.http.get<{ chatRooms: ChatRoom[]; total: number }>(
      `${this.API_URL}/chat/rooms?page=${page}&limit=${limit}`,
    )
  }

  getChatRoom(id: string): Observable<ChatRoom> {
    return this.http.get<ChatRoom>(`${this.API_URL}/chat/rooms/${id}`)
  }

  getChatRoomMessages(chatRoomId: string, page = 1, limit = 50): Observable<{ messages: any[]; total: number }> {
    return this.http.get<{ messages: any[]; total: number }>(
      `${this.API_URL}/chat/rooms/${chatRoomId}/messages?page=${page}&limit=${limit}`,
    )
  }

  createChatRoom(data: any): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${this.API_URL}/chat/rooms`, data)
  }

  searchChatRooms(query: string, page = 1, limit = 20): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.API_URL}/chat/rooms/search?q=${query}&page=${page}&limit=${limit}`)
  }
}
