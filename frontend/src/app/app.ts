import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatSidebarComponent } from './chat-sidebar/chat-sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ChatSidebarComponent],   // 👈 thêm dòng này
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  collapsed = false;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
