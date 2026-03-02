import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  
  selector: 'app-login',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);

  isLoading = signal(false);
  error = signal<string | null>(null);

  async login(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithGoogle();
    } catch (err: any) {
      this.error.set('Falha ao entrar com Google. Tente novamente.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
