import {
  Component,
} from '@angular/core';
import {
  Router,
} from '@angular/router';
import {
  IonApp,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
} from '@ionic/angular/standalone';

import {
  PushNotificationService,
} from './core/services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl:
    './app.component.html',
  styleUrls: [
    './app.component.scss',
  ],
  standalone: true,
  imports: [
    IonApp,
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
  ],
})
export class AppComponent {
  constructor(
    private readonly router:
      Router,

    private readonly pushNotificationService:
      PushNotificationService,
  ) {
   void this
  .pushNotificationService
  .initializeNotificationActions();

void this
  .pushNotificationService
  .initializeAndroidChannel();
  }

  navigateTo(
    route: string,
  ): void {
    void this.router.navigate([
      route,
    ]);
  }
}