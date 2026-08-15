import { Component } from '@angular/core';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
    private readonly router: Router,
  ) {}

  navigateTo(
    route: string,
  ): void {
    void this.router.navigate([
      route,
    ]);
  }
}