import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-page">
      <div class="login-card">

        <div class="login-brand">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill="white" opacity="0.9"/>
              <circle cx="12" cy="9" r="2" fill="#E67E22"/>
            </svg>
          </div>
          <div>
            <h1>GRPO TMS</h1>
            <p>Transport Management System</p>
          </div>
        </div>

        <h2>Connexion</h2>
        <p class="sub">Accédez à votre espace de gestion</p>

        <div class="alert-info" *ngIf="sessionExpiree">
          🔒 Votre session a expiré. Veuillez vous reconnecter.
        </div>

        <div class="alert-error" *ngIf="erreur">
          ❌ {{ erreur }}
        </div>

        <form [formGroup]="form" (ngSubmit)="connexion()">
          <div class="field">
            <label>Identifiant</label>
            <input formControlName="username" type="text"
                   placeholder="admin" autocomplete="username"
                   [class.invalid]="submitted && f['username'].errors">
            <span class="err" *ngIf="submitted && f['username'].errors?.['required']">
              Identifiant requis
            </span>
          </div>

          <div class="field">
            <label>Mot de passe</label>
            <div class="pwd-wrap">
              <input formControlName="password"
                     [type]="showPwd ? 'text' : 'password'"
                     placeholder="••••••••" autocomplete="current-password"
                     [class.invalid]="submitted && f['password'].errors">
              <button type="button" class="toggle-pwd" (click)="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁️' }}
              </button>
            </div>
            <span class="err" *ngIf="submitted && f['password'].errors?.['required']">
              Mot de passe requis
            </span>
          </div>

          <button type="submit" class="btn-connexion" [disabled]="loading">
            <span *ngIf="!loading">Se connecter</span>
            <span *ngIf="loading">⟳ Connexion en cours...</span>
          </button>
        </form>

        <div class="login-footer">
          <a routerLink="/inscription">Créer un compte</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page{min-height:100vh;background:linear-gradient(135deg,#0a1523 0%,#1B4F72 100%);
               display:flex;align-items:center;justify-content:center;padding:20px}
    .login-card{background:white;border-radius:20px;padding:40px;width:100%;max-width:420px;
                box-shadow:0 24px 60px rgba(0,0,0,.35)}
    .login-brand{display:flex;align-items:center;gap:12px;margin-bottom:28px;
                 padding-bottom:24px;border-bottom:1px solid #f1f5f9}
    .brand-icon{width:48px;height:48px;background:linear-gradient(135deg,#1B4F72,#0d2b3e);
                border-radius:12px;display:flex;align-items:center;justify-content:center;
                box-shadow:0 4px 14px rgba(27,79,114,.4)}
    h1{font-size:20px;font-weight:800;color:#1a2233;margin:0}
    .login-brand p{font-size:11px;color:#94a3b8;margin:2px 0 0;text-transform:uppercase;letter-spacing:.06em}
    h2{font-size:22px;font-weight:700;color:#1a2233;margin-bottom:6px}
    .sub{color:#7a8799;font-size:14px;margin-bottom:24px}
    .alert-info{background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;
                padding:12px 16px;margin-bottom:16px;font-size:13px;color:#1d4ed8}
    .alert-error{background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;
                 padding:12px 16px;margin-bottom:16px;font-size:13px;color:#b91c1c}
    .field{margin-bottom:18px}
    label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px}
    input{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;
          font-size:14px;outline:none;transition:all .2s;font-family:inherit;color:#1a2233;
          box-sizing:border-box}
    input:focus{border-color:#1B4F72;box-shadow:0 0 0 3px rgba(27,79,114,.12)}
    input.invalid{border-color:#ef4444}
    .pwd-wrap{position:relative}
    .pwd-wrap input{padding-right:44px}
    .toggle-pwd{position:absolute;right:10px;top:50%;transform:translateY(-50%);
                background:none;border:none;cursor:pointer;font-size:16px;padding:4px}
    .err{font-size:12px;color:#ef4444;margin-top:4px;display:block}
    .btn-connexion{width:100%;padding:13px;background:linear-gradient(135deg,#1B4F72,#2563eb);
                   color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;
                   cursor:pointer;margin-top:8px;transition:all .2s;font-family:inherit;
                   box-shadow:0 4px 14px rgba(27,79,114,.4)}
    .btn-connexion:hover:not(:disabled){transform:translateY(-1px)}
    .btn-connexion:disabled{opacity:.65;cursor:not-allowed}
    .login-footer{text-align:center;margin-top:20px;padding-top:16px;
                  border-top:1px solid #f1f5f9}
    .login-footer a{color:#1B4F72;font-size:13px;text-decoration:none;font-weight:500}
    .login-footer a:hover{text-decoration:underline}
  `]
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  loading = false;
  erreur = '';
  submitted = false;
  showPwd = false;
  sessionExpiree = false;
  private returnUrl = '/dashboard';

  get f(): FormGroup['controls'] { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.sessionExpiree = !!this.route.snapshot.queryParams['returnUrl'];

    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

connexion(): void {
  this.submitted = true;
  this.erreur = '';
  if (this.form.invalid) return;

  this.loading = true;
  this.authService.login(this.form.value).subscribe({
    next: () => {
      const user = this.authService.getCurrentUser();
      console.log('[Login] Connecté, user:', user);

      if (user?.role === 'ADMIN') {
        this.router.navigate(['/dashboard']);
      } else if (user?.statutApproval === 'EMAIL_NON_VERIFIE') {
        this.router.navigate(['/verifier-email'], { queryParams: { email: user.email } });
      } else if (user?.statutApproval === 'APPROUVEE') {
        this.router.navigate(['/client-dashboard']);
      } else if (user?.statutApproval === 'REJETEE') {
        this.router.navigate(['/demande-rejetee']);
      } else {
        this.router.navigate(['/attente-approbation']);
      }
    },
    error: (err: HttpErrorResponse) => {
      console.error('[Login] Erreur :', err);
      this.loading = false;
      if (err.status === 403) {
        const email = err.error?.email || this.form.get('username')?.value;
        this.router.navigate(['/verifier-email'], { queryParams: { email } });
      } else if (err.status === 401) {
        this.erreur = 'Identifiant ou mot de passe incorrect.';
      } else if (err.status === 0) {
        this.erreur = 'Serveur inaccessible. Vérifiez que le backend est démarré.';
      } else {
        this.erreur = `Erreur ${err.status} : ${err.error?.message || 'Connexion impossible.'}`;
      }
    }
  });
}
}