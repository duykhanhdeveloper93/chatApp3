import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule],   // 👈 THÊM DÒNG NÀY
  templateUrl: './chat-sidebar.html',
  styleUrls: ['./chat-sidebar.scss']
})
export class ChatSidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  toggleSidebar() {
    this.toggle.emit();
  }
}
