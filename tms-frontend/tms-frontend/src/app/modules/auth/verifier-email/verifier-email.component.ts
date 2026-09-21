import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verifier-email',
  templateUrl: './verifier-email.component.html',
  styleUrls: ['./verifier-email.component.scss'],
})
export class VerifierEmailComponent implements OnInit {

  email   = '';
  code    = '';
  loading = false;
  success = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  onKey(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Coller (Ctrl+V géré séparément)
    if (event.key === 'Backspace') {
      event.preventDefault();
      input.value = '';
      this.updateCode();
      if (index > 0) this.focus(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) { this.focus(index - 1); return; }
    if (event.key === 'ArrowRight' && index < 5) { this.focus(index + 1); return; }

    // Accepter seulement les chiffres
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    input.value = event.key;
    this.updateCode();

    if (index < 5) this.focus(index + 1);
  }

  // Gestion du collage
  onPasteGlobal(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    if (!pasted) return;
    for (let i = 0; i < 6; i++) {
      const inp = document.getElementById(`d${i}`) as HTMLInputElement;
      if (inp) inp.value = pasted[i] || '';
    }
    this.updateCode();
    this.focus(Math.min(pasted.length, 5));
    event.preventDefault();
  }

  private focus(index: number): void {
    const el = document.getElementById(`d${index}`) as HTMLInputElement;
    if (el) { el.focus(); el.select(); }
  }

  private updateCode(): void {
    let c = '';
    for (let i = 0; i < 6; i++) {
      const inp = document.getElementById(`d${i}`) as HTMLInputElement;
      c += inp ? (inp.value || '') : '';
    }
    this.code = c;
  }

  soumettre(): void {
    this.updateCode();
    if (!this.email || this.code.length < 6) {
      this.error = 'Veuillez entrer votre email et le code à 6 chiffres.';
      return;
    }
    this.loading = true;
    this.error   = null;

    this.http.post<any>(`${environment.apiUrl}/inscription/verifier-code`, {
      email: this.email,
      code:  this.code,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Code incorrect ou expiré.';
      },
    });
  }
}