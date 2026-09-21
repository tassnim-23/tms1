import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  template: `

    <!-- ══ PAGE WRAPPER ══════════════════════════════════════════ -->
    <div class="reg-page">

      <!-- FOND DÉCORATIF -->
      <div class="reg-fond">
        <div class="reg-fond-cercle c1"></div>
        <div class="reg-fond-cercle c2"></div>
        <div class="reg-fond-cercle c3"></div>
      </div>

      <!-- COLONNE GAUCHE — BRANDING -->
      <div class="reg-gauche">
        <div class="reg-logo">
          <div class="reg-logo-icone"><mat-icon>local_shipping</mat-icon></div>
          <div>
            <div class="reg-logo-nom">TMS GRPO</div>
            <div class="reg-logo-sous">Transport Management System</div>
          </div>
        </div>

        <div class="reg-pitch">
          <h1>Rejoignez <br><span class="accent">GRPO Consulting</span></h1>
          <p>Gérez vos transports, suivez vos livraisons et optimisez votre logistique depuis une interface professionnelle.</p>
        </div>

        <div class="reg-steps">
          <div class="step" [class.actif]="etapeActive === 1">
            <div class="step-num">1</div>
            <div class="step-info">
              <div class="step-titre">Informations personnelles</div>
              <div class="step-sous">Identité et coordonnées</div>
            </div>
          </div>
          <div class="step-ligne"></div>
          <div class="step" [class.actif]="etapeActive === 2">
            <div class="step-num">2</div>
            <div class="step-info">
              <div class="step-titre">Sécurité du compte</div>
              <div class="step-sous">Username et mot de passe</div>
            </div>
          </div>
          <div class="step-ligne"></div>
          <div class="step" [class.actif]="etapeActive === 3">
            <div class="step-num">3</div>
            <div class="step-info">
              <div class="step-titre">Vérification entreprise</div>
              <div class="step-sous">Matricule fiscale</div>
            </div>
          </div>
        </div>

        <div class="reg-deja">
          <span>Déjà un compte ?</span>
          <button class="btn-connexion" (click)="allerLogin()">
            <mat-icon>login</mat-icon> Se connecter
          </button>
        </div>
      </div>

      <!-- COLONNE DROITE — FORMULAIRE -->
      <div class="reg-droite">

        <!-- ══ SUCCÈS ══ -->
        <div class="succes-panel" *ngIf="succes">
          <div class="succes-icone">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h2>Demande envoyée !</h2>
          <p>Votre demande d'inscription a été soumise avec succès.<br>
          Vous recevrez un email dès que votre compte sera <strong>validé par l'administrateur</strong>.</p>
          <div class="succes-details">
            <div class="succes-detail">
              <mat-icon>person</mat-icon>
              <span>{{ registerForm.get('username')?.value }}</span>
            </div>
            <div class="succes-detail">
              <mat-icon>email</mat-icon>
              <span>{{ registerForm.get('email')?.value }}</span>
            </div>
            <div class="succes-detail">
              <mat-icon>business</mat-icon>
              <span>Matricule : {{ registerForm.get('matriculeFiscale')?.value }}</span>
            </div>
          </div>
          <div class="succes-timer">
            Redirection vers la connexion dans <strong>{{ countdown }}</strong>s...
          </div>
          <button class="btn-primaire" (click)="allerLogin()">
            <mat-icon>login</mat-icon> Se connecter maintenant
          </button>
        </div>

        <!-- ══ FORMULAIRE ══ -->
        <div class="form-container" *ngIf="!succes">
          <div class="form-header">
            <h2>Créer votre compte</h2>
            <p>Remplissez le formulaire — un administrateur validera votre demande</p>
          </div>

          <!-- ÉTAPES MOBILE -->
          <div class="steps-mobile">
            <div class="step-dot" [class.actif]="etapeActive >= 1" [class.fait]="etapeActive > 1">1</div>
            <div class="step-bar" [class.actif]="etapeActive > 1"></div>
            <div class="step-dot" [class.actif]="etapeActive >= 2" [class.fait]="etapeActive > 2">2</div>
            <div class="step-bar" [class.actif]="etapeActive > 2"></div>
            <div class="step-dot" [class.actif]="etapeActive >= 3">3</div>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="soumettre()" novalidate>

            <!-- ────────────── ÉTAPE 1 — IDENTITÉ ────────────── -->
            <div class="etape-bloc" [class.visible]="etapeActive === 1">
              <div class="etape-titre-form">
                <mat-icon>person</mat-icon> Informations personnelles
              </div>

              <div class="champ-grille">
                <mat-form-field appearance="outline" class="champ-moitie">
                  <mat-label>Prénom</mat-label>
                  <input matInput formControlName="prenom" placeholder="Mohamed">
                  <mat-icon matSuffix>person_outline</mat-icon>
                  <mat-error *ngIf="f['prenom'].errors?.['required']">Prénom requis</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="champ-moitie">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="nom" placeholder="Ben Ali">
                  <mat-icon matSuffix>person_outline</mat-icon>
                  <mat-error *ngIf="f['nom'].errors?.['required']">Nom requis</mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Email professionnel</mat-label>
                <input matInput type="email" formControlName="email" placeholder="m.benali&#64;entreprise.tn">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="f['email'].errors?.['required']">Email requis</mat-error>
                <mat-error *ngIf="f['email'].errors?.['email']">Email invalide</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="telephone" placeholder="+21650123456">
                <mat-icon matSuffix>phone</mat-icon>
                <mat-hint>Format : +216 suivi de 8 chiffres</mat-hint>
                <mat-error *ngIf="f['telephone'].errors?.['required']">Téléphone requis</mat-error>
                <mat-error *ngIf="f['telephone'].errors?.['pattern']">Format invalide (+216XXXXXXXX)</mat-error>
              </mat-form-field>

              <div class="form-actions">
                <div></div>
                <button type="button" class="btn-suivant" (click)="etapeSuivante(1)"
                        [disabled]="!etape1Valide()">
                  Suivant <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>

            <!-- ────────────── ÉTAPE 2 — SÉCURITÉ ────────────── -->
            <div class="etape-bloc" [class.visible]="etapeActive === 2">
              <div class="etape-titre-form">
                <mat-icon>lock</mat-icon> Sécurité du compte
              </div>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Nom d'utilisateur</mat-label>
                <input matInput formControlName="username" placeholder="m.benali">
                <mat-icon matSuffix>alternate_email</mat-icon>
                <mat-hint>Entre 3 et 50 caractères</mat-hint>
                <mat-error *ngIf="f['username'].errors?.['required']">Username requis</mat-error>
                <mat-error *ngIf="f['username'].errors?.['minlength']">Minimum 3 caractères</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Mot de passe</mat-label>
                <input matInput [type]="voirMdp ? 'text' : 'password'" formControlName="password">
                <button mat-icon-button matSuffix type="button" (click)="voirMdp = !voirMdp">
                  <mat-icon>{{ voirMdp ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>Min. 8 car. avec majuscule, chiffre et caractère spécial</mat-hint>
                <mat-error *ngIf="f['password'].errors?.['required']">Mot de passe requis</mat-error>
                <mat-error *ngIf="f['password'].errors?.['minlength']">Minimum 8 caractères</mat-error>
                <mat-error *ngIf="f['password'].errors?.['pattern']">Doit contenir : majuscule, chiffre, caractère spécial (&#64;#$%^&+=)</mat-error>
              </mat-form-field>

              <!-- Jauge de force du mot de passe -->
              <div class="mdp-force" *ngIf="f['password'].value">
                <div class="mdp-force-barres">
                  <div class="barre" [class.actif]="forceMdp >= 1" [class.couleur1]="forceMdp === 1" [class.couleur2]="forceMdp === 2" [class.couleur3]="forceMdp === 3" [class.couleur4]="forceMdp >= 4"></div>
                  <div class="barre" [class.actif]="forceMdp >= 2" [class.couleur2]="forceMdp === 2" [class.couleur3]="forceMdp === 3" [class.couleur4]="forceMdp >= 4"></div>
                  <div class="barre" [class.actif]="forceMdp >= 3" [class.couleur3]="forceMdp === 3" [class.couleur4]="forceMdp >= 4"></div>
                  <div class="barre" [class.actif]="forceMdp >= 4" [class.couleur4]="forceMdp >= 4"></div>
                </div>
                <span class="mdp-force-label" [style.color]="couleurForceMdp">{{ labelForceMdp }}</span>
              </div>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Confirmer le mot de passe</mat-label>
                <input matInput [type]="voirConfirm ? 'text' : 'password'" formControlName="confirmPassword">
                <button mat-icon-button matSuffix type="button" (click)="voirConfirm = !voirConfirm">
                  <mat-icon>{{ voirConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="f['confirmPassword'].errors?.['required']">Confirmation requise</mat-error>
                <mat-error *ngIf="f['confirmPassword'].errors?.['mismatch']">Les mots de passe ne correspondent pas</mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button type="button" class="btn-retour" (click)="etapeActive = 1">
                  <mat-icon>arrow_back</mat-icon> Retour
                </button>
                <button type="button" class="btn-suivant" (click)="etapeSuivante(2)"
                        [disabled]="!etape2Valide()">
                  Suivant <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>

            <!-- ────────────── ÉTAPE 3 — ENTREPRISE ────────────── -->
            <div class="etape-bloc" [class.visible]="etapeActive === 3">
              <div class="etape-titre-form">
                <mat-icon>business</mat-icon> Vérification entreprise
              </div>

              <div class="info-box">
                <mat-icon>info</mat-icon>
                <div>
                  <strong>Votre entreprise doit être enregistrée dans notre système.</strong><br>
                  <span>Si ce n'est pas le cas, contactez l'administrateur pour ajouter votre entreprise.</span>
                </div>
              </div>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Matricule fiscale</mat-label>
                <input matInput formControlName="matriculeFiscale" placeholder="1234567ABC"
                       style="text-transform:uppercase" (input)="majuscule($event)">
                <mat-icon matSuffix>badge</mat-icon>
                <mat-hint>Format : 7 chiffres + 3 lettres majuscules (ex: 1234567ABC)</mat-hint>
                <mat-error *ngIf="f['matriculeFiscale'].errors?.['required']">Matricule requis</mat-error>
                <mat-error *ngIf="f['matriculeFiscale'].errors?.['pattern']">Format invalide (7 chiffres + 3 lettres)</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="champ-plein">
                <mat-label>Message de motivation (optionnel)</mat-label>
                <textarea matInput formControlName="messageMotivation" rows="3"
                          placeholder="Expliquez pourquoi vous souhaitez accéder au TMS..."></textarea>
                <mat-hint align="end">{{ f['messageMotivation'].value?.length || 0 }}/500</mat-hint>
              </mat-form-field>

              <!-- Récapitulatif -->
              <div class="recap-box">
                <div class="recap-titre"><mat-icon>checklist</mat-icon> Récapitulatif</div>
                <div class="recap-ligne"><span>Nom :</span><strong>{{ f['prenom'].value }} {{ f['nom'].value }}</strong></div>
                <div class="recap-ligne"><span>Email :</span><strong>{{ f['email'].value }}</strong></div>
                <div class="recap-ligne"><span>Username :</span><strong>{{ f['username'].value }}</strong></div>
                <div class="recap-ligne"><span>Téléphone :</span><strong>{{ f['telephone'].value }}</strong></div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-retour" (click)="etapeActive = 2">
                  <mat-icon>arrow_back</mat-icon> Retour
                </button>
                <button type="submit" class="btn-soumettre" [disabled]="registerForm.invalid || chargement">
                  <mat-icon *ngIf="!chargement">send</mat-icon>
                  <mat-spinner *ngIf="chargement" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
                  {{ chargement ? 'Envoi en cours...' : 'Soumettre la demande' }}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ─── BASE ─────────────────────────────── */
    :host { display:block; font-family:'Outfit', sans-serif; }

    .reg-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 420px 1fr;
      position: relative;
      overflow: hidden;
    }

    /* ─── FOND ─────────────────────────────── */
    .reg-fond { position:fixed; inset:0; z-index:0; pointer-events:none; }
    .reg-fond-cercle {
      position:absolute; border-radius:50%;
      background:radial-gradient(circle, rgba(102,126,234,.12) 0%, transparent 70%);
    }
    .c1 { width:600px; height:600px; top:-200px; left:-100px; }
    .c2 { width:400px; height:400px; bottom:100px; left:200px; background:radial-gradient(circle, rgba(230,126,34,.08) 0%, transparent 70%); }
    .c3 { width:500px; height:500px; top:200px; right:-150px; background:radial-gradient(circle, rgba(17,153,142,.08) 0%, transparent 70%); }

    /* ─── COLONNE GAUCHE ────────────────────── */
    .reg-gauche {
      background: linear-gradient(160deg, #0D2940 0%, #1B4F72 50%, #0d3320 100%);
      padding: 48px 40px;
      display: flex; flex-direction: column; gap: 32px;
      position: relative; z-index: 1;
    }
    .reg-logo { display:flex; align-items:center; gap:14px; }
    .reg-logo-icone {
      width:52px; height:52px; border-radius:14px;
      background:linear-gradient(135deg,#E67E22,#f39c12);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 6px 20px rgba(230,126,34,.4);
    }
    .reg-logo-icone mat-icon { color:white; font-size:28px; width:28px; height:28px; }
    .reg-logo-nom { font-size:20px; font-weight:800; color:white; letter-spacing:2px; }
    .reg-logo-sous { font-size:11px; color:rgba(255,255,255,.55); letter-spacing:1px; }

    .reg-pitch { flex:1; }
    .reg-pitch h1 { font-size:32px; font-weight:800; color:white; line-height:1.3; margin:0 0 16px; }
    .reg-pitch .accent { color:#f5a742; }
    .reg-pitch p { font-size:15px; color:rgba(255,255,255,.7); line-height:1.7; margin:0; }

    .reg-steps { display:flex; flex-direction:column; gap:0; }
    .step { display:flex; align-items:center; gap:14px; padding:10px 0; transition:all .2s; }
    .step-num {
      width:32px; height:32px; border-radius:50%; flex-shrink:0;
      background:rgba(255,255,255,.1); color:rgba(255,255,255,.5);
      display:flex; align-items:center; justify-content:center;
      font-size:14px; font-weight:700; transition:all .3s;
    }
    .step.actif .step-num { background:#E67E22; color:white; box-shadow:0 4px 14px rgba(230,126,34,.5); }
    .step-titre { font-size:13.5px; font-weight:600; color:rgba(255,255,255,.5); transition:color .2s; }
    .step.actif .step-titre { color:white; }
    .step-sous { font-size:11.5px; color:rgba(255,255,255,.35); }
    .step.actif .step-sous { color:rgba(255,255,255,.65); }
    .step-ligne { width:2px; height:20px; background:rgba(255,255,255,.1); margin-left:15px; }

    .reg-deja { display:flex; align-items:center; gap:12px; }
    .reg-deja span { font-size:13.5px; color:rgba(255,255,255,.55); }
    .btn-connexion {
      display:flex; align-items:center; gap:6px;
      background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
      color:white; border-radius:10px; padding:8px 16px;
      font-size:13px; font-weight:600; cursor:pointer; transition:all .2s;
    }
    .btn-connexion:hover { background:rgba(255,255,255,.2); }
    .btn-connexion mat-icon { font-size:16px; width:16px; height:16px; }

    /* ─── COLONNE DROITE ────────────────────── */
    .reg-droite {
      background: #f8fafc; padding: 48px;
      display: flex; flex-direction: column; justify-content: center;
      position: relative; z-index: 1; overflow-y: auto;
    }

    /* ─── FORMULAIRE ────────────────────────── */
    .form-container { max-width: 540px; margin: 0 auto; width: 100%; }
    .form-header { margin-bottom: 28px; }
    .form-header h2 { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
    .form-header p { font-size: 14px; color: #64748b; margin: 0; }

    /* ÉTAPES MOBILE */
    .steps-mobile {
      display:flex; align-items:center; margin-bottom:28px;
    }
    .step-dot {
      width:32px; height:32px; border-radius:50%; flex-shrink:0;
      background:#e2e8f0; color:#94a3b8;
      display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:700; transition:all .3s;
    }
    .step-dot.actif { background:#1B4F72; color:white; }
    .step-dot.fait { background:#27ae60; color:white; }
    .step-bar { flex:1; height:3px; background:#e2e8f0; transition:background .3s; }
    .step-bar.actif { background:#27ae60; }

    .etape-titre-form {
      display:flex; align-items:center; gap:10px;
      font-size:15px; font-weight:700; color:#1e293b;
      margin-bottom:20px; padding-bottom:14px; border-bottom:1.5px solid #e2e8f0;
    }
    .etape-titre-form mat-icon { color:#1B4F72; }

    .etape-bloc { display:none; }
    .etape-bloc.visible { display:block; animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }

    .champ-grille { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .champ-moitie { width:100%; }
    .champ-plein { width:100%; display:block; margin-bottom:4px; }

    /* JAUGE MOT DE PASSE */
    .mdp-force { display:flex; align-items:center; gap:10px; margin:-8px 0 12px; }
    .mdp-force-barres { display:flex; gap:4px; }
    .barre { width:48px; height:4px; background:#e2e8f0; border-radius:99px; transition:all .3s; }
    .barre.actif.couleur1 { background:#ef4444; }
    .barre.actif.couleur2 { background:#f97316; }
    .barre.actif.couleur3 { background:#eab308; }
    .barre.actif.couleur4 { background:#22c55e; }
    .mdp-force-label { font-size:12px; font-weight:600; }

    /* INFO BOX */
    .info-box {
      display:flex; gap:12px; align-items:flex-start;
      background:#EBF5FB; border:1px solid #bee3f8; border-radius:12px;
      padding:14px 16px; margin-bottom:16px;
    }
    .info-box mat-icon { color:#1B4F72; flex-shrink:0; }
    .info-box strong { font-size:13.5px; color:#1B4F72; }
    .info-box span { font-size:12.5px; color:#2980b9; }

    /* RECAP BOX */
    .recap-box {
      background:white; border:1.5px solid #e2e8f0; border-radius:12px;
      padding:16px 20px; margin: 8px 0 16px;
    }
    .recap-titre {
      display:flex; align-items:center; gap:8px;
      font-size:13px; font-weight:700; color:#1e293b; margin-bottom:12px;
    }
    .recap-titre mat-icon { color:#667eea; font-size:18px; width:18px; height:18px; }
    .recap-ligne {
      display:flex; justify-content:space-between; align-items:center;
      font-size:13px; padding:5px 0; border-bottom:1px solid #f1f5f9;
    }
    .recap-ligne:last-child { border-bottom:none; }
    .recap-ligne span { color:#64748b; }
    .recap-ligne strong { color:#1e293b; }

    /* ACTIONS */
    .form-actions { display:flex; justify-content:space-between; align-items:center; margin-top:20px; gap:12px; }
    .btn-suivant {
      display:flex; align-items:center; gap:8px;
      background:linear-gradient(135deg,#1B4F72,#2980b9);
      color:white; border:none; border-radius:12px;
      padding:12px 24px; font-size:14px; font-weight:700;
      cursor:pointer; transition:all .2s; box-shadow:0 4px 14px rgba(27,79,114,.3);
    }
    .btn-suivant:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 20px rgba(27,79,114,.4); }
    .btn-suivant:disabled { opacity:.5; cursor:not-allowed; }
    .btn-retour {
      display:flex; align-items:center; gap:6px;
      background:transparent; border:1.5px solid #e2e8f0; border-radius:12px;
      padding:11px 18px; font-size:14px; font-weight:600; color:#64748b;
      cursor:pointer; transition:all .2s;
    }
    .btn-retour:hover { border-color:#1B4F72; color:#1B4F72; }
    .btn-soumettre {
      display:flex; align-items:center; gap:8px;
      background:linear-gradient(135deg,#E67E22,#f39c12);
      color:white; border:none; border-radius:12px;
      padding:13px 28px; font-size:15px; font-weight:700;
      cursor:pointer; transition:all .2s; box-shadow:0 4px 16px rgba(230,126,34,.35);
    }
    .btn-soumettre:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 24px rgba(230,126,34,.5); }
    .btn-soumettre:disabled { opacity:.6; cursor:not-allowed; }

    /* ─── PANNEAU SUCCÈS ────────────────────── */
    .succes-panel {
      max-width:480px; margin:0 auto; text-align:center;
      background:white; border:1.5px solid #e2e8f0; border-radius:20px;
      padding:48px 40px; box-shadow:0 8px 32px rgba(0,0,0,.08);
    }
    .succes-icone mat-icon {
      font-size:72px; width:72px; height:72px; color:#27ae60;
      animation:pop .4s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes pop { from{transform:scale(0)} to{transform:scale(1)} }
    .succes-panel h2 { font-size:26px; font-weight:800; color:#0f172a; margin:16px 0 8px; }
    .succes-panel p { font-size:14.5px; color:#64748b; line-height:1.7; margin:0 0 24px; }
    .succes-details { display:flex; flex-direction:column; gap:8px; margin-bottom:20px; text-align:left; background:#f8fafc; border-radius:12px; padding:16px; }
    .succes-detail { display:flex; align-items:center; gap:10px; font-size:13.5px; color:#475569; }
    .succes-detail mat-icon { color:#1B4F72; font-size:18px; }
    .succes-timer { font-size:13px; color:#94a3b8; margin-bottom:20px; }
    .btn-primaire {
      display:inline-flex; align-items:center; gap:8px;
      background:linear-gradient(135deg,#1B4F72,#2980b9);
      color:white; border:none; border-radius:12px;
      padding:13px 28px; font-size:15px; font-weight:700;
      cursor:pointer; box-shadow:0 4px 16px rgba(27,79,114,.3);
    }

    @media (max-width:900px) {
      .reg-page { grid-template-columns:1fr; }
      .reg-gauche { display:none; }
      .reg-droite { padding:32px 24px; }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  voirMdp = false;
  voirConfirm = false;
  chargement = false;
  succes = false;
  etapeActive = 1;
  countdown = 5;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      prenom: ['', [Validators.required]],
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\+216[0-9]{8}$/)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [
        Validators.required, Validators.minLength(8),
        Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
      matriculeFiscale: ['', [Validators.required, Validators.pattern(/^[0-9]{7}[A-Z]{3}$/)]],
      messageMotivation: ['', Validators.maxLength(500)]
    }, { validators: this.mdpCorrespondant });
  }

  ngOnInit(): void {}

  get f() { return this.registerForm.controls; }

  mdpCorrespondant(group: AbstractControl): ValidationErrors | null {
    const mdp = group.get('password')?.value;
    const conf = group.get('confirmPassword')?.value;
    if (mdp && conf && mdp !== conf) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  get forceMdp(): number {
    const v = this.f['password'].value || '';
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[@#$%^&+=!]/.test(v)) score++;
    return score;
  }

  get labelForceMdp(): string {
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    return labels[this.forceMdp] || '';
  }

  get couleurForceMdp(): string {
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    return colors[this.forceMdp] || '';
  }

  etape1Valide(): boolean {
    return !this.f['prenom'].invalid && !this.f['nom'].invalid &&
           !this.f['email'].invalid && !this.f['telephone'].invalid;
  }

  etape2Valide(): boolean {
    return !this.f['username'].invalid && !this.f['password'].invalid &&
           !this.f['confirmPassword'].invalid && this.forceMdp >= 3;
  }

  etapeSuivante(etape: number): void {
    if (etape === 1 && this.etape1Valide()) this.etapeActive = 2;
    if (etape === 2 && this.etape2Valide()) this.etapeActive = 3;
  }

  majuscule(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart;
    input.value = input.value.toUpperCase();
    this.f['matriculeFiscale'].setValue(input.value, { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }

  soumettre(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.chargement = true;

    this.http.post<any>(`${environment.apiUrl}/inscription/demande`, this.registerForm.value)
      .subscribe({
        next: (res) => {
          this.chargement = false;
          if (res.success) {
            this.succes = true;
            this.lancerCompteur();
          } else {
            this.snack.open(res.message, 'Fermer', { duration: 6000, panelClass: ['snack-error'] });
          }
        },
        error: (err) => {
          this.chargement = false;
          const msg = err.error?.message || 'Erreur lors de la soumission. Vérifiez vos informations.';
          this.snack.open(msg, 'Fermer', { duration: 6000, panelClass: ['snack-error'] });
        }
      });
  }

  lancerCompteur(): void {
    const t = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) { clearInterval(t); this.allerLogin(); }
    }, 1000);
  }

  allerLogin(): void { this.router.navigate(['/login']); }
}
