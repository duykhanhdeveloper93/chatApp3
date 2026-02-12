import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {

  
  private api = 'http://103.77.243.178:3000';

  constructor(private http: HttpClient) {}

  createPrivateRoom(targetUserId: string): Observable<any> {
    return this.http.post(`${this.api}/chat-rooms/private`, {
      targetUserId
    });
  }

  getMessages(roomId: string): Observable<any> {
    return this.http.get(`${this.api}/messages/${roomId}`);
  }
}
