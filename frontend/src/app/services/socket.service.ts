import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {

  private socket!: Socket;

  connect(token: string) {
    this.socket = io('http://103.77.243.178:3000/chat', {
      transports: ['websocket'],
      auth: { token }
    });
  }

  joinRoom(roomId: string) {
    this.socket.emit('join:room', { chatRoomId: roomId });
  }

  sendMessage(roomId: string, content: string) {
    this.socket.emit('send:message', {
      chatRoomId: roomId,
      content
    });
  }

  onNewMessage(callback: (msg: any) => void) {
    this.socket.on('send:message:read', callback);
  }
}
