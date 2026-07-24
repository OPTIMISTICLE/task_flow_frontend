import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-confirm-email',
  imports: [RouterLink, ThemeToggleComponent],
  templateUrl: './confirm-email.component.html',
  styleUrl: '../token-password/token-password.component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  readonly loading = signal(true);
  readonly message = signal('');
  readonly error = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('This link is missing its security token.');
      return;
    }
    this.auth.confirmEmail(token).subscribe({
      next: (response) => { this.loading.set(false); this.message.set(response.message); },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'The email address could not be confirmed.'));
      },
    });
  }
}
