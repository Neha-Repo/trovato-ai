import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./features/welcome/pages/welcome.page').then(
        (m) => m.WelcomePage
      ),
  },
  {
  path: 'chat',
  loadComponent: () =>
    import('./features/chat/pages/chat/chat.page').then(
      (m) => m.ChatPage
    ),
},
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/pages/auth/auth.page').then( m => m.AuthPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/pages/chat/chat.page').then( m => m.ChatPage)
  },
];