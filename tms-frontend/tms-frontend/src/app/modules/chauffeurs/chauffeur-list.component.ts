import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

// ✅ Aligné exactement avec ChauffeurDTO.java
interface Chauffeur {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroPermis: string;          // PAS numeroPerm
  dateValiditePermis: string;    // PAS dateExpirationPerm — LocalDate @Future
  disponible?: boolean;
  nombreTournees?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-chauffeur-list',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-titre"><mat-icon>badge</mat-icon> Gestion des chauffeurs</h1>
        <p class="page-sous-titre">{{ totalElements }} chauffeur(s) enregistré(s)</p>
      </div>
      <button class="btn-primaire" (click)="ouvrirFormulaire()">
        <mat-icon>add</mat-icon> Ajouter un chauffeur
      </button>
    </div>

    <div class="tms-card">
      <div class="barre-outils">
        <div class="champ-recherche">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="recherche" (ngModelChange)="appliquerFiltres()"
                 placeholder="Nom, email, numéro de permis...">
          <button *ngIf="recherche" (click)="recherche=''; appliquerFiltres()" class="clear-btn">✕</button>
        </div>
        <select class="filtre-select" [(ngModel)]="filtreDisponible" (ngModelChange)="appliquerFiltres()">
          <option value="">Tous</option>
          <option value="true">✅ Disponibles</option>
          <option value="false">🔴 Non disponibles</option>
        </select>
        <span class="compteur-total">{{ chauffeursAffiches.length }} résultat(s)</span>
        <button class="btn-refresh" (click)="charger()" [disabled]="chargement">
          <mat-icon [class.spin]="chargement">refresh</mat-icon>
        </button>
      </div>

      <div class="mini-stats" *ngIf="!chargement && tousLesChauffeurs.length > 0">
        <div class="mini-stat ms-green" (click)="filtreDisponible='true'; appliquerFiltres()">
          <span class="ms-num">{{ compter(true) }}</span><span class="ms-lbl">Disponibles</span>
        </div>
        <div class="mini-stat ms-rouge" (click)="filtreDisponible='false'; appliquerFiltres()">
          <span class="ms-num">{{ compter(false) }}</span><span class="ms-lbl">Non disponibles</span>
        </div>
        <div class="mini-stat ms-orange">
          <span class="ms-num">{{ permisAExpirer() }}</span><span class="ms-lbl">Permis à renouveler</span>
        </div>
        <div class="mini-stat ms-total" (click)="filtreDisponible=''; appliquerFiltres()">
          <span class="ms-num">{{ tousLesChauffeurs.length }}</span><span class="ms-lbl">Total</span>
        </div>
      </div>

      <div class="chargement" *ngIf="chargement">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Chargement des chauffeurs...</span>
      </div>

      <div *ngIf="erreur && !chargement" class="etat-erreur">
        <mat-icon>error_outline</mat-icon>
        <div><strong>Erreur</strong><p>{{ erreur }}</p></div>
        <button class="btn-primaire" (click)="charger()">↻ Réessayer</button>
      </div>

      <div class="table-wrapper" *ngIf="!chargement && !erreur">
        <table class="tms-table" *ngIf="chauffeursAffiches.length > 0; else aucun">
          <thead>
            <tr>
              <th>Chauffeur</th><th>Contact</th><th>N° Permis</th>
              <th>Validité permis</th><th>Tournées</th><th>Disponibilité</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of chauffeursAffiches; trackBy: trackById">
              <td>
                <div class="chauffeur-cell">
                  <div class="chauffeur-avatar">{{ getInitiales(c.nom, c.prenom) }}</div>
                  <div>
                    <div class="col-nom">{{ c.prenom }} {{ c.nom }}</div>
                    <div class="col-sub">Chauffeur n°{{ c.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div>{{ c.email }}</div>
                <div class="col-sub">{{ c.telephone }}</div>
              </td>
              <td><span class="badge badge-bleu mono">{{ c.numeroPermis }}</span></td>
              <td>
                <span [ngClass]="getClassePermis(c.dateValiditePermis)">{{ fmtDate(c.dateValiditePermis) }}</span>
                <div *ngIf="permisExpireBientot(c.dateValiditePermis)" class="alerte-permis">⚠️ Expire bientôt</div>
              </td>
              <td><span class="badge badge-gris">{{ c.nombreTournees || 0 }} tournée(s)</span></td>
              <td>
                <span class="badge" [ngClass]="c.disponible ? 'badge-vert' : 'badge-rouge'">
                  {{ c.disponible ? '✅ Disponible' : '🔴 Non disponible' }}
                </span>
              </td>
              <td>
                <div class="cellule-actions">
                  <button class="btn-modifier" (click)="ouvrirFormulaire(c)"><mat-icon>edit</mat-icon> Modifier</button>
                  <button class="btn-supprimer" (click)="supprimer(c)"><mat-icon>delete_outline</mat-icon> Supprimer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #aucun>
          <div class="etat-vide">
            <div class="etat-vide-icone"><mat-icon>badge</mat-icon></div>
            <h3>Aucun chauffeur trouvé</h3>
            <p>{{ (recherche || filtreDisponible) ? 'Aucun résultat.' : 'Ajoutez votre premier chauffeur.' }}</p>
            <button class="btn-primaire" *ngIf="!recherche && !filtreDisponible" (click)="ouvrirFormulaire()">
              <mat-icon>add</mat-icon> Ajouter un chauffeur
            </button>
          </div>
        </ng-template>
      </div>

      <div class="tms-pagination" *ngIf="!chargement && !erreur && totalElements > taillePage">
        <span>{{ chauffeursAffiches.length }} sur {{ totalElements }}</span>
        <div class="pag-ctrl">
          <button class="btn-icone" (click)="pagePrecedente()" [disabled]="page === 0"><mat-icon>chevron_left</mat-icon></button>
          <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="btn-icone" (click)="pageSuivante()" [disabled]="page >= totalPages - 1"><mat-icon>chevron_right</mat-icon></button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div *ngIf="modalOuvert" class="overlay" (click)="fermerModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-hdr">
          <h2>{{ form.id ? '✏️ Modifier' : '➕ Nouveau chauffeur' }}</h2>
          <button (click)="fermerModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label>Nom *</label>
              <input [(ngModel)]="form.nom" placeholder="Ben Ali" [class.err-input]="submitted && !form.nom">
              <span class="err-msg" *ngIf="submitted && !form.nom">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Prénom *</label>
              <input [(ngModel)]="form.prenom" placeholder="Mohamed" [class.err-input]="submitted && !form.prenom">
              <span class="err-msg" *ngIf="submitted && !form.prenom">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Email *</label>
              <input [(ngModel)]="form.email" type="email" placeholder="m.benali@grpo.tn" [class.err-input]="submitted && !form.email">
              <span class="err-msg" *ngIf="submitted && !form.email">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Téléphone * <span class="hint">(8-15 chiffres)</span></label>
              <input [(ngModel)]="form.telephone" placeholder="71234567" [class.err-input]="submitted && !form.telephone">
              <span class="err-msg" *ngIf="submitted && !form.telephone">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>N° Permis *</label>
              <input [(ngModel)]="form.numeroPermis" placeholder="P-123456" [class.err-input]="submitted && !form.numeroPermis">
              <span class="err-msg" *ngIf="submitted && !form.numeroPermis">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Date validité permis * <span class="hint">(future)</span></label>
              <input [(ngModel)]="form.dateValiditePermis" type="date" [min]="demain"
                     [class.err-input]="submitted && !form.dateValiditePermis">
              <span class="err-msg" *ngIf="submitted && !form.dateValiditePermis">Obligatoire</span>
            </div>
            <div class="form-field full">
              <label>Disponibilité</label>
              <div class="toggle-group">
                <button type="button" [class.active]="form.disponible === true" (click)="form.disponible = true">✅ Disponible</button>
                <button type="button" [class.active]="form.disponible === false" (click)="form.disponible = false">🔴 Non disponible</button>
              </div>
            </div>
          </div>
          <div *ngIf="erreurSauvegarde" class="err-banner">❌ {{ erreurSauvegarde }}</div>
        </div>
        <div class="modal-ftr">
          <button class="btn-annuler" (click)="fermerModal()">Annuler</button>
          <button class="btn-primaire" (click)="sauvegarder()" [disabled]="sauvegarde">
            {{ sauvegarde ? '⟳...' : (form.id ? 'Modifier' : 'Créer') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chauffeur-cell{display:flex;align-items:center;gap:10px}
    .chauffeur-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#059669,#34d399);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0}
    .col-sub{font-size:11.5px;color:#94a3b8;margin-top:1px}
    .mono{font-family:monospace}
    .alerte-permis{font-size:11px;color:#d97706;font-weight:600;margin-top:3px}
    .permis-expire{color:#dc2626;font-weight:700}
    .permis-ok{color:#1e293b}
    .permis-bientot{color:#d97706;font-weight:600}
    .mini-stats{display:flex;gap:12px;margin-bottom:16px}
    .mini-stat{flex:1;background:white;border-radius:10px;padding:14px 16px;cursor:pointer;border:2px solid transparent;transition:all .2s;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06)}
    .mini-stat:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
    .ms-num{display:block;font-size:24px;font-weight:800}
    .ms-lbl{display:block;font-size:11px;color:#64748b;margin-top:2px;font-weight:500}
    .ms-green .ms-num{color:#16a34a} .ms-rouge .ms-num{color:#dc2626} .ms-orange .ms-num{color:#d97706} .ms-total .ms-num{color:#1a2233}
    .etat-erreur{display:flex;align-items:center;gap:16px;padding:20px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;color:#b91c1c;margin:16px 0}
    .etat-erreur mat-icon{font-size:32px;width:32px;height:32px;flex-shrink:0}
    .btn-refresh{background:none;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;cursor:pointer;display:flex;align-items:center}
    .clear-btn{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:12px;padding:2px 6px}
    .spin{animation:rot 1s linear infinite} @keyframes rot{to{transform:rotate(360deg)}}
    .pag-ctrl{display:flex;align-items:center;gap:8px} .page-info{font-size:13px;font-weight:600}
    .filtre-select{background:white;border:1px solid #e2e8f0;border-radius:10px;padding:0 32px 0 12px;height:38px;font-size:13px;cursor:pointer;outline:none;-webkit-appearance:none;appearance:none}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
    .modal{background:white;border-radius:16px;width:620px;max-width:94vw;box-shadow:0 24px 60px rgba(0,0,0,.25)}
    .modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f1f5f9}
    .modal-hdr h2{font-size:17px;color:#1a2233;margin:0}
    .modal-hdr button{background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8;padding:4px 8px;border-radius:6px}
    .modal-body{padding:24px;max-height:65vh;overflow-y:auto}
    .modal-ftr{display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f1f5f9}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .form-field{display:flex;flex-direction:column;gap:6px}
    .form-field.full{grid-column:1/-1}
    .form-field label{font-size:13px;font-weight:600;color:#374151}
    .hint{font-weight:400;color:#94a3b8;font-size:11px}
    .form-field input{padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;color:#1a2233;transition:border-color .2s}
    .form-field input:focus{border-color:#1B4F72}
    .err-input{border-color:#ef4444 !important} .err-msg{font-size:12px;color:#ef4444}
    .err-banner{background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px;color:#b91c1c}
    .toggle-group{display:flex;gap:8px}
    .toggle-group button{flex:1;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;transition:all .2s}
    .toggle-group button.active{border-color:#1B4F72;background:#eff6ff;color:#1B4F72;font-weight:700}
    .btn-annuler{padding:10px 20px;background:white;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit}
  `]
})
export class ChauffeurListComponent implements OnInit {
  tousLesChauffeurs: Chauffeur[] = [];
  chauffeursAffiches: Chauffeur[] = [];
  chargement = false; erreur = ''; recherche = ''; filtreDisponible = '';
  totalElements = 0; taillePage = 10; page = 0;
  modalOuvert = false; form: Partial<Chauffeur> = {};
  submitted = false; sauvegarde = false; erreurSauvegarde = '';

  get demain(): string { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
  get totalPages(): number { return Math.ceil(this.totalElements / this.taillePage) || 1; }
  private get hdrs(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}`, 'Content-Type': 'application/json' });
  }

  constructor(private http: HttpClient, private auth: AuthService, private dialog: MatDialog, private snack: MatSnackBar) {}
  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement = true; this.erreur = '';
    this.http.get<any>(`${environment.apiUrl}/chauffeurs?page=${this.page}&size=${this.taillePage}`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        if (Array.isArray(data)) { this.tousLesChauffeurs = data; this.totalElements = data.length; }
        else if (data?.content) { this.tousLesChauffeurs = data.content; this.totalElements = data.totalElements ?? data.content.length; }
        else { this.tousLesChauffeurs = []; this.totalElements = 0; }
        this.appliquerFiltres(); this.chargement = false;
      },
      error: (err: any) => { this.erreur = `Erreur ${err.status} : ${err.error?.message || 'Chargement impossible.'}`; this.chargement = false; }
    });
  }

  appliquerFiltres(): void {
    let l = [...this.tousLesChauffeurs];
    if (this.filtreDisponible === 'true') l = l.filter(c => c.disponible === true);
    if (this.filtreDisponible === 'false') l = l.filter(c => c.disponible === false);
    if (this.recherche.trim()) {
      const q = this.recherche.trim().toLowerCase();
      l = l.filter(c => (c.nom||'').toLowerCase().includes(q)||(c.prenom||'').toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.numeroPermis||'').toLowerCase().includes(q));
    }
    this.chauffeursAffiches = l;
  }

  compter(d: boolean): number { return this.tousLesChauffeurs.filter(c => c.disponible === d).length; }
  permisAExpirer(): number {
    const d60 = new Date(); d60.setDate(d60.getDate()+60);
    return this.tousLesChauffeurs.filter(c => c.dateValiditePermis && new Date(c.dateValiditePermis) <= d60).length;
  }
  trackById(_: number, c: Chauffeur): number { return c.id || 0; }
  pageSuivante(): void { if (this.page < this.totalPages-1) { this.page++; this.charger(); } }
  pagePrecedente(): void { if (this.page > 0) { this.page--; this.charger(); } }
  getInitiales(n: string, p: string): string { return ((p?.[0]||'')+(n?.[0]||'')).toUpperCase()||'?'; }
  fmtDate(d?: string): string { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric'}); }
  getClassePermis(d?: string): string {
    if (!d) return '';
    const dt = new Date(d); const now = new Date(); const d30 = new Date(); d30.setDate(now.getDate()+30);
    if (dt < now) return 'permis-expire';
    if (dt <= d30) return 'permis-bientot';
    return 'permis-ok';
  }
  permisExpireBientot(d?: string): boolean { if (!d) return false; const diff=(new Date(d).getTime()-Date.now())/86400000; return diff>=0&&diff<=30; }

  ouvrirFormulaire(c?: Chauffeur): void { this.form = c ? {...c} : {disponible:true}; this.submitted=false; this.erreurSauvegarde=''; this.modalOuvert=true; }
  fermerModal(): void { this.modalOuvert = false; }

  sauvegarder(): void {
    this.submitted = true;
    if (!this.form.nom||!this.form.prenom||!this.form.email||!this.form.telephone||!this.form.numeroPermis||!this.form.dateValiditePermis) return;
    this.sauvegarde = true; this.erreurSauvegarde = '';
    const payload = { nom:this.form.nom, prenom:this.form.prenom, email:this.form.email, telephone:this.form.telephone, numeroPermis:this.form.numeroPermis, dateValiditePermis:this.form.dateValiditePermis, disponible:this.form.disponible??true };
    const req = this.form.id ? this.http.put(`${environment.apiUrl}/chauffeurs/${this.form.id}`, payload, {headers:this.hdrs}) : this.http.post(`${environment.apiUrl}/chauffeurs`, payload, {headers:this.hdrs});
    req.subscribe({
      next: () => { this.snack.open(this.form.id ? '✅ Chauffeur modifié' : '✅ Chauffeur créé', 'Fermer', {duration:3500}); this.fermerModal(); this.charger(); this.sauvegarde=false; },
      error: (err: any) => { this.erreurSauvegarde = err.error?.message||`Erreur ${err.status}`; this.sauvegarde=false; }
    });
  }

  supprimer(c: Chauffeur): void {
    this.dialog.open(ConfirmDialogComponent, {width:'440px', data:{message:`Supprimer "${c.prenom} ${c.nom}" ?`}})
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        this.http.delete(`${environment.apiUrl}/chauffeurs/${c.id}`, {headers:this.hdrs}).subscribe({
          next: () => { this.snack.open('✅ Chauffeur supprimé','Fermer',{duration:3500}); this.charger(); },
          error: (err: any) => this.snack.open(`❌ ${err.error?.message||'Erreur'}`, 'Fermer', {duration:4000})
        });
      });
  }
}