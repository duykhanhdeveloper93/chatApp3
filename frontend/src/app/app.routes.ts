import { Routes } from '@angular/router';

import { Login } from './login/login';
import { UsersPageComponent } from './users-page/users-page';
import { ChatComponent } from './chat/chat.component';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'chat', component: ChatComponent },
  { path: 'users', component: UsersPageComponent }

  
];