import { Injectable, inject, computed } from '@angular/core';
import {
  Auth, GoogleAuthProvider, signInWithPopup, signOut, authState
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  private firebaseUser = toSignal(authState(this.auth), { initialValue: undefined });

  isLoading = computed(() => this.firebaseUser() === undefined);

  currentUser = computed<AppUser | null>(() => {
    const u = this.firebaseUser();
    if (!u) return null;
    return {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL
    };
  });

  isAuthenticated = computed(() => {
    const u = this.firebaseUser();
    return u !== null && u !== undefined;
  });

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    this.router.navigate(['/notes']);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
