import { Routes } from '@angular/router';
import { Chat } from './chat/chat';
import { Login } from './login/login';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'chat', component: Chat },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];