import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private messageSubject = new Subject<any>();
  private typingSubject = new Subject<any>();

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io(`${environment.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => console.log('✅ Connected to chat socket'));
    this.socket.on('message:new', (msg) => this.messageSubject.next(msg));
    this.socket.on('typing:start', (data) => this.typingSubject.next({ ...data, typing: true }));
    this.socket.on('typing:stop', (data) => this.typingSubject.next({ ...data, typing: false }));
  }

  joinRoom(chatRoomId: string) {
    this.socket?.emit('join:room', { chatRoomId }, (res: any) => {
      console.log('Join room response:', res);
    });
  }

  sendMessage(chatRoomId: string, content: string) {
    this.socket?.emit('send:message', { chatRoomId, content }, (res: any) => {
      console.log('Send message response:', res);
    });
  }

  startTyping(chatRoomId: string) {
    this.socket?.emit('typing:start', { chatRoomId });
  }

  stopTyping(chatRoomId: string) {
    this.socket?.emit('typing:stop', { chatRoomId });
  }

  markAsRead(chatRoomId: string) {
    this.socket?.emit('message:read', { chatRoomId });
  }

  getNewMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  getTyping(): Observable<any> {
    return this.typingSubject.asObservable();
  }

  disconnect() {
    this.socket?.disconnect();
  }
}