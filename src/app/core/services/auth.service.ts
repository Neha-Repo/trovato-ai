import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private session: Session | null = null;

  private initialized = false;

  constructor(
    private readonly supabaseService: SupabaseService,
  ) {
    this.initializeNativeAuthCallback();
  }

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
    Capacitor.isNativePlatform()
      ? 'com.trovato.ai://auth/callback'
      : `${window.location.origin}/results`;

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

  private initializeNativeAuthCallback(): void {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  void App.addListener(
    'appUrlOpen',
    async ({ url }) => {
      if (
        !url.startsWith(
          'com.trovato.ai://auth/callback',
        )
      ) {
        return;
      }

      try {
        const parsedUrl =
          new URL(url);

        const code =
          parsedUrl.searchParams.get(
            'code',
          );

        if (!code) {
          console.error(
            'OAuth callback did not contain a code.',
          );
          return;
        }

        const {
          data,
          error,
        } =
          await this.supabaseService.client.auth
            .exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        this.session =
          data.session;

        window.location.href =
          '/results';
      } catch (error) {
        console.error(
          'Failed to complete Google sign-in',
          error,
        );
      }
    },
  );
}
}