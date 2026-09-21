import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inscription',
  template: `
    <div class="insc-page">

      <!-- ══ NAVBAR ══ -->
      <nav class="nav">
        <div class="nav-logo" (click)="router.navigate(['/'])">
          <span style="font-size:22px">🚛</span>
          <span class="nav-logo-text">TMS</span>
        </div>
        <button class="btn-nav" (click)="router.navigate(['/login'])">
          Déjà inscrit ? Se connecter →
        </button>
      </nav>

      <!-- ══ CONTENU ══ -->
      <div class="insc-container">

        <!-- Titre -->
        <div class="insc-header">
          <h1>Créer un compte entreprise</h1>
          <p>Rejoignez TMS et gérez votre flotte de transport en toute simplicité</p>
        </div>

        <!-- Stepper -->
        <div class="stepper">
          <div class="step" [class.active]="etape === 1" [class.done]="etape > 1">
            <div class="step-num">{{ etape > 1 ? '✓' : '1' }}</div>
            <span>Informations entreprise</span>
          </div>
          <div class="step-line" [class.done]="etape > 1"></div>
          <div class="step" [class.active]="etape === 2" [class.done]="etape > 2">
            <div class="step-num">{{ etape > 2 ? '✓' : '2' }}</div>
            <span>Compte & sécurité</span>
          </div>
        </div>

        <!-- ══ ÉTAPE 1 ══ -->
        <div class="card" *ngIf="etape === 1">
          <form [formGroup]="form1" (ngSubmit)="etapeSuivante()">

            <div class="field">
              <label>Raison sociale *</label>
              <input formControlName="raisonSociale" placeholder="Ex: GRPO Transport SARL" [class.error]="submitted1 && f1['raisonSociale'].errors">
              <span class="err" *ngIf="submitted1 && f1['raisonSociale'].errors?.['required']">Champ obligatoire</span>
            </div>

            <div class="field">
              <label>Matricule fiscale *</label>
              <input formControlName="matriculeFiscale" placeholder="Ex: 1234567/A/M/000" [class.error]="submitted1 && f1['matriculeFiscale'].errors">
              <span class="err" *ngIf="submitted1 && f1['matriculeFiscale'].errors?.['required']">Champ obligatoire</span>
            </div>

            <div class="field">
              <label>Secteur d'activité *</label>
              <select formControlName="activite" [class.error]="submitted1 && f1['activite'].errors">
                <option value="">-- Sélectionner --</option>
                <option>Transport</option>
                <option>Logistique</option>
                <option>Commerce</option>
                <option>Distribution</option>
                <option>Import/Export</option>
                <option>Industrie</option>
                <option>Agriculture</option>
                <option>Services</option>
                <option>Autre</option>
              </select>
              <span class="err" *ngIf="submitted1 && f1['activite'].errors?.['required']">Champ obligatoire</span>
            </div>

            <div class="field">
              <label>Responsable de l'entreprise *</label>
              <input formControlName="responsableEntreprise" placeholder="Nom et prénom" [class.error]="submitted1 && f1['responsableEntreprise'].errors">
              <span class="err" *ngIf="submitted1 && f1['responsableEntreprise'].errors?.['required']">Champ obligatoire</span>
            </div>

            <div class="field">
              <label>Adresse complète</label>
              <textarea formControlName="adresseComplete" rows="2" placeholder="Adresse, ville, code postal"></textarea>
            </div>

            <button type="submit" class="btn-primary">
              Continuer →
            </button>
          </form>
        </div>

        <!-- ══ ÉTAPE 2 ══ -->
        <div class="card" *ngIf="etape === 2">
          <form [formGroup]="form2" (ngSubmit)="soumettre()">

            <div class="field">
              <label>Email professionnel *</label>
              <input formControlName="email" type="email" placeholder="contact@entreprise.com" [class.error]="submitted2 && f2['email'].errors">
              <span class="err" *ngIf="submitted2 && f2['email'].errors?.['required']">Champ obligatoire</span>
              <span class="err" *ngIf="submitted2 && f2['email'].errors?.['email']">Email invalide</span>
            </div>

            <div class="field">
              <label>Téléphone</label>
              <input formControlName="telephone" placeholder="+216 XX XXX XXX">
            </div>

            <div class="field">
              <label>Mot de passe *</label>
              <div class="pwd-wrap">
                <input formControlName="password" [type]="showPwd ? 'text' : 'password'" placeholder="Min. 8 caractères" [class.error]="submitted2 && f2['password'].errors">
                <button type="button" class="pwd-toggle" (click)="showPwd=!showPwd">
                  {{ showPwd ? '🙈' : '👁️' }}
                </button>
              </div>
              <div class="pwd-strength" *ngIf="f2['password'].value">
                <div class="pwd-bar">
                  <div class="pwd-fill" [style.width]="pwdStrength+'%'" [style.background]="pwdColor"></div>
                </div>
                <span [style.color]="pwdColor">{{ pwdLabel }}</span>
              </div>
              <span class="err" *ngIf="submitted2 && f2['password'].errors?.['required']">Champ obligatoire</span>
              <span class="err" *ngIf="submitted2 && f2['password'].errors?.['minlength']">Minimum 8 caractères</span>
            </div>

            <div class="field">
              <label>Confirmer le mot de passe *</label>
              <input formControlName="confirmPassword" type="password" placeholder="Répétez le mot de passe" [class.error]="submitted2 && (f2['confirmPassword'].errors || form2.errors?.['mismatch'])">
              <span class="err" *ngIf="submitted2 && form2.errors?.['mismatch']">Les mots de passe ne correspondent pas</span>
            </div>

            <div class="field-check">
              <input type="checkbox" formControlName="acceptTerms" id="terms">
              <label for="terms">J'accepte les conditions d'utilisation de TMS</label>
            </div>
            <span class="err" *ngIf="submitted2 && f2['acceptTerms'].errors?.['required']">Vous devez accepter les conditions</span>

            <!-- Erreur serveur -->
            <div class="alert-error" *ngIf="erreurServeur">
              ⚠️ {{ erreurServeur }}
            </div>

            <div class="btn-row">
              <button type="button" class="btn-secondary" (click)="etape=1">← Retour</button>
              <button type="submit" class="btn-primary" [disabled]="chargement">
                <span *ngIf="chargement">⏳ Envoi en cours...</span>
                <span *ngIf="!chargement">✅ Créer mon compte</span>
              </button>
            </div>
          </form>
        </div>

        <!-- ══ SUCCÈS ══ -->
        <div class="card success-card" *ngIf="etape === 3">
          <div class="success-icon">🎉</div>
          <h2>Demande envoyée !</h2>
          <p>Votre demande d'inscription a été soumise avec succès.<br>
             Un administrateur va examiner votre dossier et vous contactera par email.</p>
          <button class="btn-primary" (click)="router.navigate(['/login'])">
            Aller à la page de connexion
          </button>
        </div>

        <!-- Lien retour -->
        <div class="back-link" *ngIf="etape < 3">
          <a (click)="router.navigate(['/'])">← Retour à l'accueil</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .insc-page { min-height:100vh; background:linear-gradient(135deg,#0D2940,#1B4F72); font-family:'Inter',sans-serif; }

    /* NAV */
    .nav {
      display:flex; align-items:center; justify-content:space-between;
      padding:0 48px; height:64px; background:rgba(0,0,0,0.2);
    }
    .nav-logo { display:flex;align-items:center;gap:10px;cursor:pointer; }
    .nav-logo-text { font-size:20px;font-weight:800;color:white;letter-spacing:3px; }
    .btn-nav {
      padding:8px 18px; border-radius:8px; border:1.5px solid rgba(255,255,255,0.4);
      background:transparent; color:white; font-size:13px; font-weight:600;
      cursor:pointer; transition:all .2s;
    }
    .btn-nav:hover { background:rgba(255,255,255,0.1); border-color:white; }

    /* CONTAINER */
    .insc-container { max-width:560px; margin:0 auto; padding:40px 24px 60px; }

    .insc-header { text-align:center; margin-bottom:32px; color:white; }
    .insc-header h1 { font-size:28px; font-weight:800; margin-bottom:10px; }
    .insc-header p { font-size:15px; opacity:0.8; }

    /* STEPPER */
    .stepper { display:flex; align-items:center; justify-content:center; margin-bottom:32px; }
    .step { display:flex; align-items:center; gap:10px; }
    .step-num {
      width:32px; height:32px; border-radius:50%;
      background:rgba(255,255,255,0.2); color:white;
      display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:700; transition:all .3s;
    }
    .step.active .step-num { background:#E67E22; }
    .step.done .step-num { background:#27ae60; }
    .step span { font-size:13px; color:rgba(255,255,255,0.7); font-weight:600; }
    .step.active span, .step.done span { color:white; }
    .step-line { width:60px; height:2px; background:rgba(255,255,255,0.2); margin:0 12px; }
    .step-line.done { background:#27ae60; }

    /* CARD */
    .card {
      background:white; border-radius:20px; padding:36px;
      box-shadow:0 20px 60px rgba(0,0,0,0.3);
    }
    .success-card { text-align:center; }
    .success-icon { font-size:56px; margin-bottom:20px; }
    .success-card h2 { font-size:24px; font-weight:800; color:#0f172a; margin-bottom:12px; }
    .success-card p { font-size:15px; color:#64748b; line-height:1.7; margin-bottom:28px; }

    /* FORM */
    .field { margin-bottom:20px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; }
    .field input, .field select, .field textarea {
      width:100%; padding:11px 14px; border:1.5px solid #e2e8f0; border-radius:10px;
      font-size:14px; font-family:inherit; color:#1e293b; outline:none; transition:border .2s;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color:#1B4F72; }
    .field input.error, .field select.error { border-color:#ef4444; }
    .field textarea { resize:vertical; }

    .pwd-wrap { position:relative; }
    .pwd-toggle {
      position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; font-size:16px;
    }
    .pwd-strength { margin-top:8px; }
    .pwd-bar { height:4px; background:#e2e8f0; border-radius:2px; margin-bottom:4px; }
    .pwd-fill { height:100%; border-radius:2px; transition:width .3s; }
    .pwd-strength span { font-size:12px; font-weight:600; }

    .field-check { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
    .field-check input { width:auto; }
    .field-check label { font-size:13px; color:#374151; cursor:pointer; }

    .err { display:block; font-size:12px; color:#ef4444; margin-top:4px; }

    .alert-error {
      background:#FEF2F2; border:1px solid #FECACA; border-radius:10px;
      padding:12px 16px; color:#dc2626; font-size:14px; margin-bottom:16px;
    }

    .btn-row { display:flex; gap:12px; margin-top:8px; }
    .btn-primary {
      flex:1; padding:13px; border-radius:10px; border:none;
      background:#E67E22; color:white; font-size:15px; font-weight:700;
      cursor:pointer; transition:all .2s;
    }
    .btn-primary:hover:not(:disabled) { background:#d97706; transform:translateY(-1px); }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-secondary {
      padding:13px 24px; border-radius:10px; border:1.5px solid #e2e8f0;
      background:white; color:#374151; font-size:15px; font-weight:600;
      cursor:pointer; transition:all .2s;
    }
    .btn-secondary:hover { background:#f1f5f9; }

    .back-link { text-align:center; margin-top:20px; }
    .back-link a { color:rgba(255,255,255,0.7); font-size:13px; cursor:pointer; }
    .back-link a:hover { color:white; text-decoration:underline; }
  `]
})
export class InscriptionComponent implements OnInit {
  etape = 1;
  form1!: FormGroup;
  form2!: FormGroup;
  submitted1 = false;
  submitted2 = false;
  showPwd = false;
  chargement = false;
  erreurServeur = '';

  get f1() { return this.form1.controls; }
  get f2() { return this.form2.controls; }

  get pwdStrength(): number {
    const p = this.f2['password']?.value || '';
    let s = 0;
    if (p.length >= 8) s += 25;
    if (/[A-Z]/.test(p)) s += 25;
    if (/[0-9]/.test(p)) s += 25;
    if (/[^A-Za-z0-9]/.test(p)) s += 25;
    return s;
  }
  get pwdColor(): string {
    if (this.pwdStrength <= 25) return '#ef4444';
    if (this.pwdStrength <= 50) return '#f97316';
    if (this.pwdStrength <= 75) return '#eab308';
    return '#22c55e';
  }
  get pwdLabel(): string {
    if (this.pwdStrength <= 25) return 'Faible';
    if (this.pwdStrength <= 50) return 'Moyen';
    if (this.pwdStrength <= 75) return 'Bon';
    return 'Excellent';
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.form1 = this.fb.group({
      raisonSociale:        ['', Validators.required],
      matriculeFiscale:     ['', Validators.required],
      activite:             ['', Validators.required],
      responsableEntreprise:['', Validators.required],
      adresseComplete:      [''],
    });

    this.form2 = this.fb.group({
      email:          ['', [Validators.required, Validators.email]],
      telephone:      [''],
      password:       ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword:['', Validators.required],
      acceptTerms:    [false, Validators.requiredTrue],
    }, { validators: this.passwordMatch });
  }

  passwordMatch(g: AbstractControl) {
    const pwd = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pwd === confirm ? null : { mismatch: true };
  }

  etapeSuivante(): void {
    this.submitted1 = true;
    if (this.form1.invalid) return;
    this.etape = 2;
    this.submitted1 = false;
  }

  soumettre(): void {
    this.submitted2 = true;
    this.erreurServeur = '';
    if (this.form2.invalid) return;

    this.chargement = true;
    const payload = { ...this.form1.value, ...this.form2.value };
    delete payload.confirmPassword;
    delete payload.acceptTerms;

    this.http.post(`${environment.apiUrl}/inscription/demande`, payload).subscribe({
      next: () => {
        this.chargement = false;
        this.etape = 3;
      },
      error: (err) => {
        this.chargement = false;
        if (err.status === 0) {
          this.erreurServeur = 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
        } else if (err.status === 409) {
          this.erreurServeur = 'Cet email est déjà utilisé.';
        } else {
          this.erreurServeur = `Erreur ${err.status}. Réessayez dans un instant.`;
        }
      }
    });
  }
}
