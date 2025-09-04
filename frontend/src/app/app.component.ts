import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterOutlet } from "@angular/router"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="h-screen bg-background text-foreground">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {
  title = "chat-app"
}
