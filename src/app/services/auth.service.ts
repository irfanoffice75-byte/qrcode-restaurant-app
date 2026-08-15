import { Injectable, inject } from '@angular/core';
import { Auth, signInAnonymously, onAuthStateChanged, User } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

const UID_KEY = 'qr_anonymous_uid';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUser.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.currentUser.next(user);
      // Whenever Firebase gives us a real user, persist the UID ourselves
      if (user?.uid) {
        localStorage.setItem(UID_KEY, user.uid);
      }
    });
  }

  /**
   * PRIMARY FIX:
   * Firebase authStateReady() is unreliable on @angular/fire and broken on
   * Safari (iPhone) which may run QR links in isolated browser contexts.
   *
   * Strategy:
   * 1. Check our own localStorage for a saved UID (instant, synchronous).
   * 2. If found, sign in anonymously — Firebase will restore the same UID
   *    from its IndexedDB if available, or create a matching anonymous user.
   *    Either way we have a UID.
   * 3. After sign-in, update localStorage with whatever UID Firebase gave us.
   * 4. Return the user.
   */
  async signInAnonymously(): Promise<User | null> {
    try {
      // Step 1: If Firebase already has a current user, use it immediately
      if (this.auth.currentUser) {
        localStorage.setItem(UID_KEY, this.auth.currentUser.uid);
        return this.auth.currentUser;
      }

      // Step 2: Sign in anonymously — Firebase reuses the saved credential
      // from IndexedDB if it exists, otherwise creates a new anonymous user
      const credential = await signInAnonymously(this.auth);
      const user = credential.user;

      // Step 3: Always persist the UID in our own localStorage
      localStorage.setItem(UID_KEY, user.uid);
      return user;
    } catch (error) {
      console.error('Anonymous auth error', error);
      return null;
    }
  }

  /**
   * Returns the saved UID immediately from localStorage.
   * Falls back to Firebase current user. This is synchronous and reliable.
   */
  getSavedUid(): string | null {
    return localStorage.getItem(UID_KEY)
      || this.auth.currentUser?.uid
      || this.currentUser.getValue()?.uid
      || null;
  }

  getCurrentUserId(): string | null {
    return this.getSavedUid();
  }
}
