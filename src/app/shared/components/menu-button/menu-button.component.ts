import { Component } from '@angular/core';
import {
  IonButton,
  IonIcon,
  MenuController,
} from '@ionic/angular/standalone';
import {
  addIcons,
} from 'ionicons';
import {
  menuOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-menu-button',
  standalone: true,
  imports: [
    IonButton,
    IonIcon,
  ],
  template: `
    <ion-button
      type="button"
      fill="clear"
      class="menu-button"
      aria-label="Open navigation menu"
      (click)="openMenu()"
    >
      <ion-icon
        slot="icon-only"
        name="menu-outline"
      />
    </ion-button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .menu-button {
        --color: #ffffff;
        --padding-start: 8px;
        --padding-end: 8px;

        width: 44px;
        height: 44px;

        margin: 0;
      }

      ion-icon {
        font-size: 1.7rem;
      }
    `,
  ],
})
export class MenuButtonComponent {
  constructor(
    private readonly menuController:
      MenuController,
  ) {
    addIcons({
      menuOutline,
    });
  }

  async openMenu():
    Promise<void> {
    await this.menuController.open();
  }
}