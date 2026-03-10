import { Component, inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatComponent } from './components/chat/chat.component';
import { SearchModalComponent } from './components/search-modal/search-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LoginComponent, SidebarComponent, ChatComponent, SearchModalComponent],
  template: `
    @if (!auth.isLoggedIn()) {
      <app-login />
    } @else {
      <div class="layout">
        <app-sidebar />
        <app-chat />
        @if (cs.searchModalOpen()) {
          <app-search-modal />
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100vw; height: 100vh; }
    .layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      position: relative;
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  cs   = inject(ChatService);
}
