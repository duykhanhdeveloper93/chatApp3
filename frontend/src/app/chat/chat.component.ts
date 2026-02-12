import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {

  messages: string[] = [];
  newMessage = '';

  send() {
    if (!this.newMessage.trim()) return;

    this.messages.push(this.newMessage);
    this.newMessage = '';
  }
}
