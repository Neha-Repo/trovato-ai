import { Injectable } from '@angular/core';

export interface AuthUser {
  id: string;
  displayName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'trovato-auth-user';

  private currentUser: AuthUser | null =
    this.readStoredUser();

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  signIn(): AuthUser {
    if (this.currentUser) {
      return this.currentUser;
    }

    const user: AuthUser = {
      id: crypto.randomUUID(),
      displayName: 'Traveller',
    };

    this.currentUser = user;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(user),
      );
    } catch {
      // Local storage is optional.
    }

    return user;
  }

  signOut(): void {
    this.currentUser = null;

    try {
      localStorage.removeItem(
        this.storageKey,
      );
    } catch {
      // Local storage is optional.
    }
  }

  private readStoredUser(): AuthUser | null {
    try {
      const value =
        localStorage.getItem(
          this.storageKey,
        );

      if (!value) {
        return null;
      }

      return JSON.parse(
        value,
      ) as AuthUser;
    } catch {
      return null;
    }
  }
}