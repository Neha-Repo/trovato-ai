import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import(
        './features/welcome/pages/welcome.page'
      ).then(
        (m) => m.WelcomePage,
      ),
  },
  {
    path: 'chat',
    loadComponent: () =>
      import(
        './features/chat/pages/chat/chat.page'
      ).then(
        (m) => m.ChatPage,
      ),
  },
  {
    path: 'results',
    loadComponent: () =>
      import(
        './features/search/pages/results/results.page'
      ).then(
        (m) => m.ResultsPage,
      ),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import(
        './features/auth/pages/auth/auth.page'
      ).then(
        (m) => m.AuthPage,
      ),
  },
  {
  path: 'alerts',
  loadComponent: () =>
    import(
      './features/alerts/pages/my-alerts/my-alerts.page'
    ).then(
      (m) => m.MyAlertsPage,
    ),
},
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];