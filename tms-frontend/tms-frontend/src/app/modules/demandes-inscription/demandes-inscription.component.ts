import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Demande {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  matriculeFiscale: string;
  raisonSociale: string;
  activite: string;
  responsableEntreprise: string;
  adresseComplete: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
  dateCreation: string;
  dateTraitement: string;
  commentaireAdmin: string;
}

@Component({
  selector: 'app-demandes-inscription',
  template: `
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="header-icon">📋</div>
      <div>
        <h1>Demandes d'inscription</h1>
        <p class="subtitle">Gérez les demandes d'accès à la plateforme TMS</p>
      </div>
    </div>
    <button class="btn-refresh" (click)="chargerDemandes()" [disabled]="loading">
      <span [class.spin]="loading">🔄</span> Rafraîchir
    </button>
  </div>

  <div class="stats-row">
    <div class="stat-card stat-attente" (click)="filtrer('EN_ATTENTE')" [class.active]="filtreActif==='EN_ATTENTE'">
      <div class="stat-number">{{ compter('EN_ATTENTE') }}</div>
      <div class="stat-label">En attente</div>
      <div class="stat-bar"></div>
    </div>
    <div class="stat-card stat-approuvee" (click)="filtrer('APPROUVEE')" [class.active]="filtreActif==='APPROUVEE'">
      <div class="stat-number">{{ compter('APPROUVEE') }}</div>
      <div class="stat-label">Approuvées</div>
      <div class="stat-bar"></div>
    </div>
    <div class="stat-card stat-rejetee" (click)="filtrer('REJETEE')" [class.active]="filtreActif==='REJETEE'">
      <div class="stat-number">{{ compter('REJETEE') }}</div>
      <div class="stat-label">Rejetées</div>
      <div class="stat-bar"></div>
    </div>
    <div class="stat-card stat-total" (click)="filtrer('TOUS')" [class.active]="filtreActif==='TOUS'">
      <div class="stat-number">{{ demandes.length }}</div>
      <div class="stat-label">Total</div>
      <div class="stat-bar"></div>
    </div>
  </div>

  <div *ngIf="loading" class="loading-box">
    <div class="loader"></div>
    <span>Chargement des demandes...</span>
  </div>

  <div *ngIf="erreur && !loading" class="alert-erreur">
    <span>{{ erreur }}</span>
    <button (click)="chargerDemandes()">Réessayer</button>
  </div>

  <div *ngIf="!loading && !erreur && demandesFiltrees.length === 0" class="vide">
    <div class="vide-icon">📭</div>
    <p>Aucune demande pour ce filtre</p>
    <small>Les nouvelles demandes apparaîtront ici automatiquement</small>
  </div>

  <div *ngIf="!loading && demandesFiltrees.length > 0" class="demandes-grid">
    <div *ngFor="let d of demandesFiltrees; trackBy: trackById"
         class="demande-card"
         [class.card-approuvee]="d.statut==='APPROUVEE'"
         [class.card-rejetee]="d.statut==='REJETEE'">

      <div class="card-ribbon"
           [class.ribbon-attente]="d.statut==='EN_ATTENTE'"
           [class.ribbon-approuvee]="d.statut==='APPROUVEE'"
           [class.ribbon-rejetee]="d.statut==='REJETEE'">
        <span *ngIf="d.statut==='EN_ATTENTE'">⏳ En attente de traitement</span>
        <span *ngIf="d.statut==='APPROUVEE'">✅ Compte créé et approuvé</span>
        <span *ngIf="d.statut==='REJETEE'">❌ Demande rejetée</span>
      </div>

      <div class="card-body">
        <div class="entreprise-nom">{{ d.raisonSociale || d.nom || '—' }}</div>
        <div class="entreprise-activite">{{ d.activite || 'Activité non précisée' }}</div>

        <div class="infos-grid">
          <div class="info-item">
            <span class="info-icon">👤</span>
            <div>
              <div class="info-key">Responsable</div>
              <div class="info-val">{{ d.responsableEntreprise || d.prenom || '—' }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">📧</span>
            <div>
              <div class="info-key">Email</div>
              <div class="info-val">{{ d.email }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">📞</span>
            <div>
              <div class="info-key">Téléphone</div>
              <div class="info-val">{{ d.telephone || '—' }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">🔢</span>
            <div>
              <div class="info-key">Matricule fiscal</div>
              <div class="info-val">{{ d.matriculeFiscale || '—' }}</div>
            </div>
          </div>
          <div class="info-item info-full">
            <span class="info-icon">📍</span>
            <div>
              <div class="info-key">Adresse</div>
              <div class="info-val">{{ d.adresseComplete || '—' }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">📅</span>
            <div>
              <div class="info-key">Date de soumission</div>
              <div class="info-val">{{ fmtDate(d.dateCreation) }}</div>
            </div>
          </div>
          <div *ngIf="d.dateTraitement" class="info-item">
            <span class="info-icon">🕐</span>
            <div>
              <div class="info-key">Traitée le</div>
              <div class="info-val">{{ fmtDate(d.dateTraitement) }}</div>
            </div>
          </div>
        </div>

        <div *ngIf="d.commentaireAdmin" class="motif-rejet">
          💬 <strong>Motif :</strong> {{ d.commentaireAdmin }}
        </div>
      </div>

      <div *ngIf="d.statut==='EN_ATTENTE'" class="card-actions">
        <button class="btn-approuver" (click)="approuver(d)" [disabled]="traitementEnCours[d.id]">
          {{ traitementEnCours[d.id] ? '⏳ Traitement en cours...' : '✅ Approuver la demande' }}
        </button>
        <button class="btn-rejeter" (click)="ouvrirRejet(d)" [disabled]="traitementEnCours[d.id]">
          ❌ Rejeter
        </button>
      </div>

      <div *ngIf="d.statut!=='EN_ATTENTE'" class="card-traitee">
        Traitée le {{ fmtDate(d.dateTraitement) }}
      </div>
    </div>
  </div>
</div>

<div *ngIf="showRejetDialog" class="overlay" (click)="annulerRejet()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <div class="dialog-header">
      <h2>Rejeter la demande</h2>
      <button class="dialog-close" (click)="annulerRejet()">✕</button>
    </div>
    <div class="dialog-body">
      <div class="dialog-info">
        <strong>{{ demandeATraiter?.raisonSociale || demandeATraiter?.nom }}</strong>
        <span>{{ demandeATraiter?.email }}</span>
      </div>
      <label class="form-label">Motif du rejet <small>(optionnel)</small></label>
      <textarea class="form-textarea"
                [value]="motifRejet"
                (input)="motifRejet = $any($event.target).value"
                rows="4"
                placeholder="Ex : Dossier incomplet, matricule fiscal invalide..."></textarea>
    </div>
    <div class="dialog-footer">
      <button class="btn-annuler" (click)="annulerRejet()">Annuler</button>
      <button class="btn-rejeter-confirm" (click)="confirmerRejet()">❌ Confirmer le rejet</button>
    </div>
  </div>
</div>

<div *ngIf="toastVisible" class="toast"
     [class.toast-ok]="toastType==='ok'"
     [class.toast-ko]="toastType==='ko'">
  {{ toastMsg }}
</div>
  `,
  styles: [`
    .page { padding: 0; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .header-icon { font-size:32px; line-height:1; }
    h1 { margin:0; font-size:22px; font-weight:700; color:#1a237e; }
    .subtitle { margin:2px 0 0; font-size:13px; color:#888; }
    .btn-refresh { display:flex; align-items:center; gap:6px; padding:9px 18px; background:white; border:1.5px solid #e0e0e0; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; transition:all .2s; color:#333; }
    .btn-refresh:hover:not(:disabled) { border-color:#3f51b5; color:#3f51b5; }
    .btn-refresh:disabled { opacity:.6; cursor:not-allowed; }
    .spin { display:inline-block; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .stat-card { background:white; border-radius:12px; padding:16px 20px; box-shadow:0 2px 8px rgba(0,0,0,.07); cursor:pointer; border:2px solid transparent; transition:all .2s; position:relative; overflow:hidden; }
    .stat-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.12); }
    .stat-card.active { border-color:currentColor; }
    .stat-number { font-size:32px; font-weight:800; line-height:1; margin-bottom:4px; }
    .stat-label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; opacity:.7; }
    .stat-bar { position:absolute; bottom:0; left:0; right:0; height:3px; }
    .stat-attente { color:#e65100; } .stat-attente .stat-bar { background:#ff9800; }
    .stat-approuvee { color:#1b5e20; } .stat-approuvee .stat-bar { background:#4caf50; }
    .stat-rejetee { color:#b71c1c; } .stat-rejetee .stat-bar { background:#f44336; }
    .stat-total { color:#1a237e; } .stat-total .stat-bar { background:#3f51b5; }

    .loading-box { display:flex; align-items:center; gap:12px; justify-content:center; padding:60px; color:#666; }
    .loader { width:28px; height:28px; border:3px solid #e0e0e0; border-top-color:#3f51b5; border-radius:50%; animation:spin .8s linear infinite; }

    .alert-erreur { background:#fff3e0; border:1px solid #ffcc02; border-radius:10px; padding:16px 20px; color:#e65100; display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .alert-erreur button { margin-left:auto; padding:6px 14px; background:#e65100; color:white; border:none; border-radius:6px; cursor:pointer; }

    .vide { text-align:center; padding:80px 20px; color:#aaa; }
    .vide-icon { font-size:56px; margin-bottom:12px; }
    .vide p { font-size:16px; margin:0 0 6px; color:#666; }

    .demandes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(420px,1fr)); gap:16px; }

    .demande-card { background:white; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); border-top:4px solid #ff9800; transition:transform .2s,box-shadow .2s; }
    .demande-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.12); }
    .card-approuvee { border-top-color:#4caf50; }
    .card-rejetee { border-top-color:#f44336; opacity:.85; }

    .card-ribbon { padding:6px 16px; font-size:12px; font-weight:700; }
    .ribbon-attente { background:#fff8e1; color:#e65100; }
    .ribbon-approuvee { background:#e8f5e9; color:#2e7d32; }
    .ribbon-rejetee { background:#ffebee; color:#c62828; }

    .card-body { padding:16px 20px; }
    .entreprise-nom { font-size:17px; font-weight:700; color:#1a237e; margin-bottom:3px; }
    .entreprise-activite { font-size:13px; color:#888; margin-bottom:16px; }

    .infos-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .info-full { grid-column:1/-1; }
    .info-item { display:flex; align-items:flex-start; gap:8px; }
    .info-icon { font-size:15px; margin-top:1px; flex-shrink:0; }
    .info-key { font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#999; font-weight:600; }
    .info-val { font-size:13px; color:#333; margin-top:1px; word-break:break-word; }

    .motif-rejet { margin-top:12px; padding:10px 14px; background:#ffebee; border-radius:8px; font-size:13px; color:#c62828; border-left:3px solid #f44336; }

    .card-actions { display:flex; gap:10px; padding:14px 20px; background:#fafafa; border-top:1px solid #f0f0f0; }
    .btn-approuver { flex:1; padding:11px; background:linear-gradient(135deg,#4caf50,#388e3c); color:white; border:none; border-radius:9px; cursor:pointer; font-weight:700; font-size:14px; transition:opacity .2s; }
    .btn-approuver:hover:not(:disabled) { opacity:.9; }
    .btn-rejeter { flex:1; padding:11px; background:white; color:#f44336; border:2px solid #f44336; border-radius:9px; cursor:pointer; font-weight:700; font-size:14px; transition:all .2s; }
    .btn-rejeter:hover:not(:disabled) { background:#ffebee; }
    button:disabled { opacity:.55; cursor:not-allowed; }
    .card-traitee { padding:10px 20px; background:#f9f9f9; border-top:1px solid #f0f0f0; font-size:12px; color:#999; text-align:center; }

    .overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:2000; animation:fadeIn .2s; }
    @keyframes fadeIn { from { opacity:0; } }
    .dialog { background:white; border-radius:16px; width:500px; max-width:92vw; box-shadow:0 20px 60px rgba(0,0,0,.25); animation:slideUp .25s ease; }
    @keyframes slideUp { from { transform:translateY(24px); opacity:0; } }
    .dialog-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0; }
    .dialog-header h2 { margin:0; font-size:17px; color:#333; }
    .dialog-close { background:none; border:none; font-size:18px; cursor:pointer; color:#999; padding:4px 8px; border-radius:6px; }
    .dialog-close:hover { background:#f5f5f5; color:#333; }
    .dialog-body { padding:16px 24px 20px; }
    .dialog-info { display:flex; flex-direction:column; gap:2px; padding:12px 14px; background:#f8f9ff; border-radius:8px; margin-bottom:16px; border-left:3px solid #3f51b5; }
    .dialog-info strong { font-size:15px; color:#1a237e; }
    .dialog-info span { font-size:13px; color:#666; }
    .form-label { display:block; font-weight:600; font-size:13px; color:#444; margin-bottom:8px; }
    .form-label small { font-weight:400; color:#999; margin-left:4px; }
    .form-textarea { width:100%; padding:12px; border:1.5px solid #e0e0e0; border-radius:9px; font-size:14px; font-family:inherit; resize:vertical; box-sizing:border-box; transition:border-color .2s; }
    .form-textarea:focus { outline:none; border-color:#3f51b5; box-shadow:0 0 0 3px rgba(63,81,181,.1); }
    .dialog-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; background:#fafafa; border-top:1px solid #f0f0f0; border-radius:0 0 16px 16px; }
    .btn-annuler { padding:10px 20px; background:white; border:1.5px solid #ddd; border-radius:8px; cursor:pointer; font-size:14px; }
    .btn-annuler:hover { background:#f5f5f5; }
    .btn-rejeter-confirm { padding:10px 22px; background:#f44336; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; }
    .btn-rejeter-confirm:hover { background:#d32f2f; }

    .toast { position:fixed; bottom:28px; right:28px; z-index:9999; padding:14px 22px; border-radius:10px; font-weight:600; font-size:14px; box-shadow:0 6px 24px rgba(0,0,0,.2); max-width:380px; animation:toastIn .3s ease; }
    @keyframes toastIn { from { transform:translateY(16px); opacity:0; } }
    .toast-ok { background:#2e7d32; color:white; }
    .toast-ko { background:#c62828; color:white; }

    @media (max-width:768px) {
      .stats-row { grid-template-columns:repeat(2,1fr); }
      .demandes-grid { grid-template-columns:1fr; }
      .infos-grid { grid-template-columns:1fr; }
    }
  `]
})
export class DemandesInscriptionComponent implements OnInit {

  demandes: Demande[] = [];
  demandesFiltrees: Demande[] = [];
  loading = false;
  erreur = '';
  filtreActif = 'EN_ATTENTE';
  traitementEnCours: { [id: number]: boolean } = {};

  showRejetDialog = false;
  demandeATraiter: Demande | null = null;
  motifRejet = '';

  toastVisible = false;
  toastMsg = '';
  toastType: 'ok' | 'ko' = 'ok';
  private toastTimer: any;

  private readonly api = `${environment.apiUrl}/inscription`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void { this.chargerDemandes(); }

  private get hdrs(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  chargerDemandes(): void {
    this.loading = true;
    this.erreur = '';
    this.http.get<Demande[]>(`${this.api}/demandes`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        this.demandes = data.sort((a, b) =>
          new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
        );
        console.log('[TMS] Demandes reçues:', data);
        this.appliquerFiltre();
        this.loading = false;
      },
      error: () => {
        this.erreur = 'Impossible de charger les demandes.';
        this.loading = false;
      }
    });
  }

  filtrer(statut: string): void {
    this.filtreActif = statut;
    this.appliquerFiltre();
  }

  private appliquerFiltre(): void {
    if (this.filtreActif === 'TOUS') {
      this.demandesFiltrees = [...this.demandes];
    } else {
      this.demandesFiltrees = this.demandes.filter(d =>
        (d.statut || '').toString().toUpperCase() === this.filtreActif.toUpperCase()
      );
    }
    console.log('[TMS] Filtre:', this.filtreActif, '| Total:', this.demandes.length, '| Filtrées:', this.demandesFiltrees.length);
    console.log('[TMS] Statuts présents:', this.demandes.map(d => d.statut));
  }

  compter(statut: string): number {
    return this.demandes.filter(d => d.statut === statut).length;
  }

  trackById(_: number, d: Demande): number { return d.id; }

  fmtDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
           + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  }

  approuver(demande: Demande): void {
    this.traitementEnCours[demande.id] = true;
    this.http.post(`${this.api}/demandes/${demande.id}/approuver`, {}, { headers: this.hdrs })
      .subscribe({
        next: () => {
          demande.statut = 'APPROUVEE';
          demande.dateTraitement = new Date().toISOString();
          this.appliquerFiltre();
          this.showToast('✅ Compte créé pour ' + demande.email, 'ok');
          this.traitementEnCours[demande.id] = false;
        },
        error: (err) => {
          this.showToast('❌ ' + (err.error?.erreur || 'Erreur approbation'), 'ko');
          this.traitementEnCours[demande.id] = false;
        }
      });
  }

  ouvrirRejet(demande: Demande): void {
    this.demandeATraiter = demande;
    this.motifRejet = '';
    this.showRejetDialog = true;
  }

  annulerRejet(): void {
    this.showRejetDialog = false;
    this.demandeATraiter = null;
  }

  confirmerRejet(): void {
    if (!this.demandeATraiter) return;
    const d = this.demandeATraiter;
    this.traitementEnCours[d.id] = true;
    this.showRejetDialog = false;
    this.http.post(`${this.api}/demandes/${d.id}/rejeter`,
      { commentaire: this.motifRejet }, { headers: this.hdrs })
      .subscribe({
        next: () => {
          d.statut = 'REJETEE';
          d.dateTraitement = new Date().toISOString();
          d.commentaireAdmin = this.motifRejet;
          this.appliquerFiltre();
          this.showToast('Demande rejetée.', 'ko');
          this.traitementEnCours[d.id] = false;
        },
        error: (err) => {
          this.showToast('❌ ' + (err.error?.erreur || 'Erreur rejet'), 'ko');
          this.traitementEnCours[d.id] = false;
        }
      });
  }

  private showToast(msg: string, type: 'ok' | 'ko'): void {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => this.toastVisible = false, 4500);
  }
}