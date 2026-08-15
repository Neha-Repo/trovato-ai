import {
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  User,
} from '@supabase/supabase-js';
import {
  IonContent,
} from '@ionic/angular/standalone';

import {
  AuthService,
} from '../../../../core/services/auth.service';
import {
  MenuButtonComponent,
} from '../../../../shared/components/menu-button/menu-button.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    MenuButtonComponent,
  ],
})
export class AccountPage implements OnInit {
  user: User | null = null;

  isLoading = true;
  isSigningOut = false;

  errorMessage:
    string | null = null;

  constructor(
    private readonly authService:
      AuthService,

    private readonly router:
      Router,
  ) {}

  async ngOnInit():
    Promise<void> {
    await this.authService.initialize();

    this.user =
      this.authService
        .getCurrentUser();

    this.isLoading = false;
  }

  get displayName(): string {
    if (!this.user) {
      return 'Trovato traveller';
    }

    const metadata =
      this.user.user_metadata;

    const name =
      metadata?.['full_name'] ??
      metadata?.['name'];

    if (
      typeof name === 'string' &&
      name.trim()
    ) {
      return name.trim();
    }

    return 'Trovato traveller';
  }

  get email(): string {
    return this.user?.email ?? '';
  }

  async signOut():
    Promise<void> {
    if (this.isSigningOut) {
      return;
    }

    this.isSigningOut = true;
    this.errorMessage = null;

    try {
      await this.authService
        .signOut();

      await this.router.navigate([
        '/home',
      ]);
    } catch (error) {
      console.error(
        'Could not sign out',
        error,
      );

      this.errorMessage =
        'We could not sign you out. Please try again.';
    } finally {
      this.isSigningOut = false;
    }
  }

  signIn(): void {
    void this.authService
      .signInWithGoogle();
  }
}