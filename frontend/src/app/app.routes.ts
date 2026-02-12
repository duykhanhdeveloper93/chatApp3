import { Routes } from '@angular/router';
import { Chat } from './chat/chat';
import { Login } from './login/login';
import { UsersPageComponent } from './users-page/users-page';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'chat', component: Chat },
  { path: 'users', component: UsersPageComponent }

  
];