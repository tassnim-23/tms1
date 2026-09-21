import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-demandes-inscription',
  template: `

    <div class="di-page">

      <!-- HEADER -->
      <div class="di-header">
        <div class="di-header-left">
          <div class="di-header-icon">
            <mat-icon>how_to_reg</mat-icon>
          </div>
          <div>
            <h1 class="di-titre">Demandes d'inscription</h1>
            <p class="di-sous-titre">Validez ou refusez les demandes d'accès au TMS</p>
          </div>
        </div>
        <div class="di-header-actions">
          <div class="badge-attente" *ngIf="nbAttente > 0">
            <mat-icon>pending</mat-icon>
            {{ nbAttente }} en attente
          </div>
          <button class="btn-actualiser" (click)="charger()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- FILTRES -->
      <div class="di-filtres">
        <button class="filtre-btn" *ngFor="let f of filtres"
                [class.actif]="filtreActif === f.val"
                (click)="filtreActif = f.val">
          <mat-icon>{{ f.icon }}</mat-icon>
          {{ f.label }}
          <span class="filtre-count" *ngIf="compter(f.val) > 0">{{ compter(f.val) }}</span>
        </button>
      </div>

      <!-- CHARGEMENT -->
      <div class="di-chargement" *ngIf="chargement">
        <mat-spinner diameter="48"></mat-spinner>
        <span>Chargement des demandes...</span>
      </div>

      <!-- LISTE VIDE -->
      <div class="di-vide" *ngIf="!chargement && demandesFiltrees.length === 0">
        <mat-icon>inbox</mat-icon>
        <h3>Aucune demande {{ filtreActif !== 'TOUTES' ? filtreActif.toLowerCase() : '' }}</h3>
        <p>Les demandes d'inscription apparaîtront ici.</p>
      </div>

      <!-- CARTES DEMANDES -->
      <div class="di-grille" *ngIf="!chargement">
        <div class="di-carte" *ngFor="let d of demandesFiltrees" [class.en-attente]="d.statut === 'EN_ATTENTE'">

          <!-- EN-TÊTE CARTE -->
          <div class="carte-header">
            <div class="carte-avatar">{{ initiales(d) }}</div>
            <div class="carte-identite">
              <div class="carte-nom">{{ d.prenom }} {{ d.nom }}</div>
              <div class="carte-username">&#64;{{ d.username }}</div>
            </div>
            <div class="carte-statut">
              <span class="badge" [ngClass]="badgeStatut(d.statut)">
                <mat-icon>{{ iconeStatut(d.statut) }}</mat-icon>
                {{ labelStatut(d.statut) }}
              </span>
            </div>
          </div>

          <!-- INFOS -->
          <div class="carte-infos">
            <div class="info-item">
              <mat-icon>email</mat-icon>
              <span>{{ d.email }}</span>
            </div>
            <div class="info-item">
              <mat-icon>phone</mat-icon>
              <span>{{ d.telephone }}</span>
            </div>
            <div class="info-item">
              <mat-icon>business</mat-icon>
              <span>{{ d.client?.raisonSociale || '—' }}</span>
            </div>
            <div class="info-item">
              <mat-icon>badge</mat-icon>
              <span class="matricule">{{ d.matriculeFiscale }}</span>
            </div>
            <div class="info-item" *ngIf="d.dateDemande">
              <mat-icon>schedule</mat-icon>
              <span>{{ d.dateDemande | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>

          <!-- MESSAGE MOTIVATION -->
          <div class="carte-motivation" *ngIf="d.messageMotivation">
            <mat-icon>comment</mat-icon>
            <em>{{ d.messageMotivation }}</em>
          </div>

          <!-- RAISON REJET -->
          <div class="carte-rejet" *ngIf="d.statut === 'REJETEE' && d.raisonRejet">
            <mat-icon>block</mat-icon>
            <span>{{ d.raisonRejet }}</span>
          </div>

          <!-- ACTIONS (seulement EN_ATTENTE) -->
          <div class="carte-actions" *ngIf="d.statut === 'EN_ATTENTE'">
            <button class="btn-approuver" (click)="approuver(d)" [disabled]="traitement === d.id">
              <mat-icon>check_circle</mat-icon>
              Approuver
            </button>
            <button class="btn-rejeter" (click)="ouvrirRejet(d)" [disabled]="traitement === d.id">
              <mat-icon>cancel</mat-icon>
              Rejeter
            </button>
          </div>

          <!-- TRAITÉE INFO -->
          <div class="carte-traitee" *ngIf="d.statut !== 'EN_ATTENTE'">
            <mat-icon>{{ d.statut === 'APPROUVEE' ? 'verified_user' : 'do_not_disturb' }}</mat-icon>
            Demande traitée le {{ d.dateTraitement | date:'dd/MM/yyyy' }}
          </div>

        </div>
      </div>

    </div>

    <!-- MODAL REJET -->
    <div class="modal-overlay" *ngIf="demandeARejet" (click)="fermerRejet()">
      <div class="modal-boite" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <mat-icon>block</mat-icon>
          <div>
            <h3>Rejeter la demande</h3>
            <p>{{ demandeARejet.prenom }} {{ demandeARejet.nom }} (&#64;{{ demandeARejet.username }})</p>
          </div>
          <button class="modal-fermer" (click)="fermerRejet()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="modal-corps">
          <label class="modal-label">Raison du refus <span class="obligatoire">*</span></label>
          <textarea class="modal-textarea" [(ngModel)]="raisonRejet" rows="4"
                    placeholder="Expliquez pourquoi la demande est refusée..."></textarea>
          <div class="modal-hint" *ngIf="raisonRejet.length === 0">La raison est obligatoire</div>
        </div>
        <div class="modal-actions">
          <button class="btn-annuler" (click)="fermerRejet()">Annuler</button>
          <button class="btn-confirmer-rejet" (click)="confirmerRejet()" [disabled]="!raisonRejet.trim()">
            <mat-icon>block</mat-icon> Confirmer le rejet
          </button>
        </div>
      </div>
    </div>

  `,
  styles: [`
    :host { display:block; font-family:'Outfit',sans-serif; }

    /* ── HEADER ───────────────────────────── */
    .di-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px; }
    .di-header-left { display:flex;align-items:center;gap:16px; }
    .di-header-icon { width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(102,126,234,.4); }
    .di-header-icon mat-icon { color:white;font-size:26px;width:26px;height:26px; }
    .di-titre { font-size:24px;font-weight:800;color:#0f172a;margin:0; }
    .di-sous-titre { font-size:13.5px;color:#64748b;margin:4px 0 0; }
    .di-header-actions { display:flex;align-items:center;gap:10px; }
    .badge-attente { display:flex;align-items:center;gap:6px;background:#FEF3C7;color:#d97706;border:1px solid #FDE68A;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700; }
    .badge-attente mat-icon { font-size:16px;width:16px;height:16px; }
    .btn-actualiser { width:40px;height:40px;border-radius:10px;background:white;border:1.5px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s; }
    .btn-actualiser:hover { border-color:#667eea;color:#667eea; }

    /* ── FILTRES ───────────────────────────── */
    .di-filtres { display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap; }
    .filtre-btn { display:flex;align-items:center;gap:6px;background:white;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;transition:all .2s; }
    .filtre-btn.actif { background:#1B4F72;border-color:#1B4F72;color:white; }
    .filtre-btn mat-icon { font-size:16px;width:16px;height:16px; }
    .filtre-count { background:rgba(255,255,255,.25);border-radius:99px;padding:1px 7px;font-size:11px;font-weight:700; }
    .filtre-btn:not(.actif) .filtre-count { background:#e2e8f0;color:#475569; }

    /* ── GRILLE ───────────────────────────── */
    .di-grille { display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px; }
    .di-chargement { display:flex;flex-direction:column;align-items:center;gap:16px;padding:64px;color:#94a3b8; }
    .di-vide { text-align:center;padding:64px;color:#94a3b8; }
    .di-vide mat-icon { font-size:52px;width:52px;height:52px;display:block;margin:0 auto 16px; }
    .di-vide h3 { font-size:18px;font-weight:700;color:#475569;margin:0 0 8px; }

    /* ── CARTE ───────────────────────────── */
    .di-carte {
      background:white;border:1.5px solid #e2e8f0;border-radius:16px;padding:20px;
      transition:all .2s;
    }
    .di-carte.en-attente { border-color:#FDE68A;box-shadow:0 4px 20px rgba(251,191,36,.15); }
    .di-carte:hover { box-shadow:0 6px 24px rgba(0,0,0,.08); }

    .carte-header { display:flex;align-items:center;gap:12px;margin-bottom:14px; }
    .carte-avatar {
      width:44px;height:44px;border-radius:12px;flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white;font-size:16px;font-weight:800;
      display:flex;align-items:center;justify-content:center;
    }
    .carte-identite { flex:1;min-width:0; }
    .carte-nom { font-size:15px;font-weight:700;color:#0f172a; }
    .carte-username { font-size:12.5px;color:#94a3b8; }

    .carte-infos { display:flex;flex-direction:column;gap:6px;margin-bottom:12px; }
    .info-item { display:flex;align-items:center;gap:8px;font-size:13px;color:#475569; }
    .info-item mat-icon { font-size:16px;width:16px;height:16px;color:#94a3b8;flex-shrink:0; }
    .matricule { font-family:monospace;font-size:13.5px;font-weight:700;color:#1B4F72; }

    .carte-motivation { display:flex;align-items:flex-start;gap:8px;background:#f8fafc;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12.5px;color:#64748b; }
    .carte-motivation mat-icon { color:#94a3b8;font-size:16px;width:16px;height:16px;flex-shrink:0;margin-top:1px; }

    .carte-rejet { display:flex;align-items:flex-start;gap:8px;background:#FEF2F2;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12.5px;color:#dc2626; }
    .carte-rejet mat-icon { font-size:16px;width:16px;height:16px;flex-shrink:0; }

    .carte-actions { display:flex;gap:8px; }
    .btn-approuver { flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#11998e,#38ef7d);color:white;border:none;border-radius:10px;padding:10px;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s; }
    .btn-approuver:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 4px 14px rgba(17,153,142,.4); }
    .btn-rejeter { flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:#FEF2F2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:10px;padding:10px;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s; }
    .btn-rejeter:hover:not(:disabled) { background:#dc2626;color:white; }
    .btn-approuver mat-icon,.btn-rejeter mat-icon { font-size:18px;width:18px;height:18px; }

    .carte-traitee { display:flex;align-items:center;gap:8px;font-size:12.5px;color:#94a3b8;padding-top:8px;border-top:1px solid #f1f5f9; }
    .carte-traitee mat-icon { font-size:16px;width:16px;height:16px; }

    /* ── BADGES ───────────────────────────── */
    .badge { display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:700; }
    .badge mat-icon { font-size:14px;width:14px;height:14px; }
    .badge-attente { background:#FEF3C7;color:#d97706; }
    .badge-approuvee { background:#DCFCE7;color:#16a34a; }
    .badge-rejetee { background:#FEE2E2;color:#dc2626; }

    /* ── MODAL ───────────────────────────── */
    .modal-overlay { position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px; }
    .modal-boite { background:white;border-radius:20px;width:100%;max-width:480px;box-shadow:0 24px 64px rgba(0,0,0,.2); }
    .modal-header { display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #f1f5f9; }
    .modal-header mat-icon { color:#dc2626;font-size:28px;width:28px;height:28px; }
    .modal-header h3 { font-size:17px;font-weight:800;color:#0f172a;margin:0; }
    .modal-header p { font-size:13px;color:#64748b;margin:4px 0 0; }
    .modal-fermer { margin-left:auto;width:32px;height:32px;border-radius:8px;background:#f1f5f9;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer; }
    .modal-corps { padding:20px 24px; }
    .modal-label { font-size:13.5px;font-weight:700;color:#1e293b;display:block;margin-bottom:8px; }
    .obligatoire { color:#dc2626; }
    .modal-textarea { width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:14px;font-family:inherit;resize:vertical;transition:border .15s;box-sizing:border-box; }
    .modal-textarea:focus { outline:none;border-color:#dc2626; }
    .modal-hint { font-size:12px;color:#ef4444;margin-top:4px; }
    .modal-actions { display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #f1f5f9; }
    .btn-annuler { background:#f1f5f9;border:none;border-radius:10px;padding:10px 20px;font-size:13.5px;font-weight:600;color:#64748b;cursor:pointer; }
    .btn-confirmer-rejet { display:flex;align-items:center;gap:6px;background:#dc2626;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s; }
    .btn-confirmer-rejet:disabled { opacity:.5;cursor:not-allowed; }
    .btn-confirmer-rejet mat-icon { font-size:18px;width:18px;height:18px; }
  `]
})
export class DemandesInscriptionComponent implements OnInit {
  demandes: any[] = [];
  chargement = false;
  filtreActif = 'TOUTES';
  demandeARejet: any = null;
  raisonRejet = '';
  traitement: number | null = null;

  filtres = [
    { val: 'TOUTES', label: 'Toutes', icon: 'list' },
    { val: 'EN_ATTENTE', label: 'En attente', icon: 'pending' },
    { val: 'APPROUVEE', label: 'Approuvées', icon: 'check_circle' },
    { val: 'REJETEE', label: 'Rejetées', icon: 'cancel' },
  ];

  constructor(
    private http: HttpClient,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.charger(); }

  get nbAttente(): number {
    return this.demandes.filter(d => d.statut === 'EN_ATTENTE').length;
  }

  get demandesFiltrees(): any[] {
    if (this.filtreActif === 'TOUTES') return this.demandes;
    return this.demandes.filter(d => d.statut === this.filtreActif);
  }

  compter(val: string): number {
    if (val === 'TOUTES') return this.demandes.length;
    return this.demandes.filter(d => d.statut === val).length;
  }

  charger(): void {
    this.chargement = true;
    this.http.get<any[]>(`${environment.apiUrl}/inscription/demandes`).subscribe({
      next: (data) => { this.demandes = data; this.chargement = false; },
      error: () => { this.chargement = false; }
    });
  }

  initiales(d: any): string {
    return ((d.prenom?.[0] || '') + (d.nom?.[0] || '')).toUpperCase();
  }

  badgeStatut(s: string): string {
    const map: any = { EN_ATTENTE: 'badge-attente', APPROUVEE: 'badge-approuvee', REJETEE: 'badge-rejetee' };
    return map[s] || '';
  }

  iconeStatut(s: string): string {
    const map: any = { EN_ATTENTE: 'schedule', APPROUVEE: 'verified_user', REJETEE: 'block' };
    return map[s] || 'help';
  }

  labelStatut(s: string): string {
    const map: any = { EN_ATTENTE: 'En attente', APPROUVEE: 'Approuvée', REJETEE: 'Rejetée' };
    return map[s] || s;
  }

  approuver(d: any): void {
    this.traitement = d.id;
    this.http.post<any>(`${environment.apiUrl}/inscription/demandes/${d.id}/approuver`, {}).subscribe({
      next: (res) => {
        this.traitement = null;
        d.statut = 'APPROUVEE';
        this.snack.open('✅ ' + res.message, 'OK', { duration: 4000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        this.traitement = null;
        this.snack.open('❌ ' + (err.error?.message || 'Erreur'), 'Fermer', { duration: 5000 });
      }
    });
  }

  ouvrirRejet(d: any): void {
    this.demandeARejet = d;
    this.raisonRejet = '';
  }

  fermerRejet(): void { this.demandeARejet = null; }

  confirmerRejet(): void {
    if (!this.raisonRejet.trim()) return;
    this.traitement = this.demandeARejet.id;
    this.http.post<any>(`${environment.apiUrl}/inscription/demandes/${this.demandeARejet.id}/rejeter`, {
      commentaire: this.raisonRejet
    }).subscribe({
      next: (res) => {
        this.traitement = null;
        this.demandeARejet.statut = 'REJETEE';
        this.demandeARejet.commentaire = this.raisonRejet;
        this.fermerRejet();
        this.snack.open('❌ ' + res.message, 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.traitement = null;
        this.snack.open('Erreur : ' + (err.error?.message || 'Inconnue'), 'Fermer', { duration: 5000 });
      }
    });
  }
}
