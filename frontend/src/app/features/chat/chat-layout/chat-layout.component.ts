import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterOutlet } from "@angular/router"
import { ChatSidebarComponent } from "../chat-sidebar/chat-sidebar.component"


@Component({
  selector: "app-chat-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatSidebarComponent],
  templateUrl: "./chat-layout.component.html",
  styleUrls: ["./chat-layout.component.scss"],
})
export class ChatLayoutComponent {}
