import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton],
})
export class WelcomePage {
  constructor(private readonly router: Router) {}

  startPlanning(): void {
    void this.router.navigate(['/chat']);
  }
}