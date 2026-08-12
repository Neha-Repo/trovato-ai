import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private session: Session | null = null;

  private initialized = false;

  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const {
      data,
      error,
    } =
      await this.supabaseService.client.auth.getSession();

    if (error) {
      console.error(
        'Failed to restore Supabase session',
        error,
      );
    }

    this.session = data.session;

    this.supabaseService.client.auth.onAuthStateChange(
      (
        _event: AuthChangeEvent,
        session: Session | null,
      ) => {
        this.session = session;
      },
    );

    this.initialized = true;
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  getCurrentUser(): User | null {
    return this.session?.user ?? null;
  }

  getAccessToken(): string | null {
    return (
      this.session?.access_token ??
      null
    );
  }

  async signInWithGoogle(): Promise<void> {
    const redirectTo =
      `${window.location.origin}/results`;

    const {
      error,
    } =
      await this.supabaseService.client.auth.signInWithOAuth(
        {
          provider: 'google',
          options: {
            redirectTo,
          },
        },
      );

    if (error) {
      throw error;
    }
  }

  /*
   * Temporary compatibility bridge.
   *
   * ResultsPage still calls signIn().
   * In the upcoming OAuth wiring step we will replace
   * that Results flow properly and remove this method.
   */
  signIn(): void {
    void this.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    const {
      error,
    } =
      await this.supabaseService.client.auth.signOut();

    if (error) {
      throw error;
    }

    this.session = null;
  }
}