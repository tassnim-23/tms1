import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

// ✅ Interface alignée exactement avec VehiculeDTO.java du backend
interface Vehicule {
  id?: number;
  immatriculation: string;
  marque: string;
  modele: string;
  capaciteCharge?: number;           // Double — PAS "capacite"
  statut?: 'DISPONIBLE' | 'EN_SERVICE' | 'EN_MAINTENANCE';  // enum StatutVehicule
  kilometrage?: number;
  dateMiseEnService?: string;        // LocalDate → string ISO
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-vehicule-list',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-titre">
          <mat-icon>local_shipping</mat-icon>
          Parc de véhicules
        </h1>
        <p class="page-sous-titre">{{ totalElements }} véhicule(s) dans la flotte</p>
      </div>
      <button class="btn-primaire" (click)="ouvrirFormulaire()">
        <mat-icon>add</mat-icon> Ajouter un véhicule
      </button>
    </div>

    <div class="tms-card">

      <!-- TOOLBAR -->
      <div class="barre-outils">
        <div class="champ-recherche">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="recherche" (ngModelChange)="appliquerFiltres()"
                 placeholder="Rechercher par immatriculation, marque, modèle...">
          <button *ngIf="recherche" (click)="recherche=''; appliquerFiltres()" class="clear-btn">✕</button>
        </div>
        <select class="filtre-select" [(ngModel)]="filtreStatut" (ngModelChange)="appliquerFiltres()">
          <option value="">Tous les statuts</option>
          <option value="DISPONIBLE">✅ Disponibles</option>
          <option value="EN_SERVICE">🚛 En service</option>
          <option value="EN_MAINTENANCE">🔧 En maintenance</option>
        </select>
        <span class="compteur-total">{{ vehiculesAffiches.length }} véhicule(s)</span>
        <button class="btn-refresh" (click)="charger()" [disabled]="chargement">
          <mat-icon [class.spin]="chargement">refresh</mat-icon>
        </button>
      </div>

      <!-- STATS RAPIDES -->
      <div class="mini-stats" *ngIf="!chargement && tousLesVehicules.length > 0">
        <div class="mini-stat ms-green" (click)="filtrerStatut('DISPONIBLE')">
          <span class="ms-num">{{ compter('DISPONIBLE') }}</span>
          <span class="ms-lbl">Disponibles</span>
        </div>
        <div class="mini-stat ms-blue" (click)="filtrerStatut('EN_SERVICE')">
          <span class="ms-num">{{ compter('EN_SERVICE') }}</span>
          <span class="ms-lbl">En service</span>
        </div>
        <div class="mini-stat ms-orange" (click)="filtrerStatut('EN_MAINTENANCE')">
          <span class="ms-num">{{ compter('EN_MAINTENANCE') }}</span>
          <span class="ms-lbl">Maintenance</span>
        </div>
        <div class="mini-stat ms-total" (click)="filtrerStatut('')">
          <span class="ms-num">{{ tousLesVehicules.length }}</span>
          <span class="ms-lbl">Total</span>
        </div>
      </div>

      <!-- CHARGEMENT -->
      <div class="chargement" *ngIf="chargement">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Chargement des véhicules...</span>
      </div>

      <!-- ERREUR -->
      <div *ngIf="erreur && !chargement" class="etat-erreur">
        <mat-icon>error_outline</mat-icon>
        <div>
          <strong>Erreur de chargement</strong>
          <p>{{ erreur }}</p>
        </div>
        <button class="btn-primaire" (click)="charger()">↻ Réessayer</button>
      </div>

      <!-- TABLEAU -->
      <div class="table-wrapper" *ngIf="!chargement && !erreur">
        <table class="tms-table" *ngIf="vehiculesAffiches.length > 0; else aucun">
          <thead>
            <tr>
              <th>Immatriculation</th>
              <th>Marque / Modèle</th>
              <th>Capacité de charge</th>
              <th>Kilométrage</th>
              <th>Mise en service</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of vehiculesAffiches; trackBy: trackById">
              <td>
                <span class="immat">{{ v.immatriculation }}</span>
              </td>
              <td>
                <div class="col-nom">{{ v.marque }}</div>
                <div class="col-sub">{{ v.modele }}</div>
              </td>
              <td>
                <span *ngIf="v.capaciteCharge" class="fw600">
                  {{ v.capaciteCharge | number:'1.0-0' }} kg
                </span>
                <span *ngIf="!v.capaciteCharge" class="muted">—</span>
              </td>
              <td>
                <span *ngIf="v.kilometrage !== undefined && v.kilometrage !== null">
                  {{ v.kilometrage | number:'1.0-0' }} km
                </span>
                <span *ngIf="v.kilometrage === undefined || v.kilometrage === null" class="muted">—</span>
              </td>
              <td>
                <span *ngIf="v.dateMiseEnService">{{ fmtDate(v.dateMiseEnService) }}</span>
                <span *ngIf="!v.dateMiseEnService" class="muted">—</span>
              </td>
              <td>
                <span class="badge" [ngClass]="getBadgeStatut(v.statut)">
                  {{ getLabelStatut(v.statut) }}
                </span>
              </td>
              <td>
                <div class="cellule-actions">
                  <button class="btn-modifier" (click)="ouvrirFormulaire(v)"
                          matTooltip="Modifier ce véhicule">
                    <mat-icon>edit</mat-icon> Modifier
                  </button>
                  <button class="btn-supprimer" (click)="supprimer(v)"
                          matTooltip="Supprimer ce véhicule">
                    <mat-icon>delete_outline</mat-icon> Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #aucun>
          <div class="etat-vide">
            <div class="etat-vide-icone"><mat-icon>local_shipping</mat-icon></div>
            <h3>Aucun véhicule trouvé</h3>
            <p>{{ (recherche || filtreStatut)
                 ? 'Aucun résultat pour vos critères de recherche.'
                 : 'Commencez par ajouter votre premier véhicule au parc.' }}</p>
            <button class="btn-primaire" *ngIf="!recherche && !filtreStatut"
                    (click)="ouvrirFormulaire()">
              <mat-icon>add</mat-icon> Ajouter un véhicule
            </button>
          </div>
        </ng-template>
      </div>

      <!-- PAGINATION -->
      <div class="tms-pagination"
           *ngIf="!chargement && !erreur && totalElements > taillePage">
        <span>{{ vehiculesAffiches.length }} sur {{ totalElements }} véhicules</span>
        <div class="pag-ctrl">
          <button class="btn-icone" (click)="pagePrecedente()" [disabled]="page === 0">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="btn-icone" (click)="pageSuivante()" [disabled]="page >= totalPages - 1">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORMULAIRE INLINE -->
    <div *ngIf="modalOuvert" class="overlay" (click)="fermerModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-hdr">
          <h2>{{ vehiculeEdite?.id ? '✏️ Modifier le véhicule' : '➕ Nouveau véhicule' }}</h2>
          <button (click)="fermerModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label>Immatriculation *</label>
              <input [(ngModel)]="form.immatriculation" placeholder="Ex: 100TU1234"
                     [class.err-input]="submitted && !form.immatriculation">
              <span class="err-msg" *ngIf="submitted && !form.immatriculation">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Marque *</label>
              <input [(ngModel)]="form.marque" placeholder="Ex: Mercedes"
                     [class.err-input]="submitted && !form.marque">
              <span class="err-msg" *ngIf="submitted && !form.marque">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Modèle *</label>
              <input [(ngModel)]="form.modele" placeholder="Ex: Actros"
                     [class.err-input]="submitted && !form.modele">
              <span class="err-msg" *ngIf="submitted && !form.modele">Obligatoire</span>
            </div>
            <div class="form-field">
              <label>Capacité de charge (kg)</label>
              <input [(ngModel)]="form.capaciteCharge" type="number"
                     placeholder="Ex: 20000" min="0">
            </div>
            <div class="form-field">
              <label>Kilométrage (km)</label>
              <input [(ngModel)]="form.kilometrage" type="number"
                     placeholder="Ex: 150000" min="0">
            </div>
            <div class="form-field">
              <label>Statut</label>
              <select [(ngModel)]="form.statut" class="form-select">
                <option value="DISPONIBLE">✅ Disponible</option>
                <option value="EN_SERVICE">🚛 En service</option>
                <option value="EN_MAINTENANCE">🔧 En maintenance</option>
              </select>
            </div>
            <div class="form-field full">
              <label>Date de mise en service</label>
              <input [(ngModel)]="form.dateMiseEnService" type="date">
            </div>
          </div>
          <div *ngIf="erreurSauvegarde" class="err-banner">❌ {{ erreurSauvegarde }}</div>
        </div>
        <div class="modal-ftr">
          <button class="btn-annuler" (click)="fermerModal()">Annuler</button>
          <button class="btn-primaire" (click)="sauvegarder()" [disabled]="sauvegarde">
            {{ sauvegarde ? '⟳ Sauvegarde...' : (vehiculeEdite?.id ? 'Modifier' : 'Créer') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .immat{font-family:monospace;font-size:13px;font-weight:700;color:#1B4F72;
           background:#EBF5FB;padding:3px 8px;border-radius:6px}
    .col-sub{font-size:12px;color:#64748b;margin-top:2px}
    .muted{color:#94a3b8;font-size:12px}
    .fw600{font-weight:600}
    .btn-refresh{background:none;border:1px solid #e2e8f0;border-radius:8px;
                 padding:6px 10px;cursor:pointer;display:flex;align-items:center}
    .btn-refresh:hover{background:#f1f5f9}
    .clear-btn{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:12px;padding:2px 6px}
    .spin{animation:rot 1s linear infinite}
    @keyframes rot{to{transform:rotate(360deg)}}
    .mini-stats{display:flex;gap:12px;margin-bottom:16px}
    .mini-stat{flex:1;background:white;border-radius:10px;padding:14px 16px;cursor:pointer;
               border:2px solid transparent;transition:all .2s;text-align:center;
               box-shadow:0 1px 4px rgba(0,0,0,.06)}
    .mini-stat:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
    .ms-num{display:block;font-size:24px;font-weight:800}
    .ms-lbl{display:block;font-size:11px;color:#64748b;margin-top:2px;font-weight:500}
    .ms-green .ms-num{color:#16a34a}
    .ms-blue  .ms-num{color:#2563eb}
    .ms-orange .ms-num{color:#d97706}
    .ms-total .ms-num{color:#1a2233}
    .etat-erreur{display:flex;align-items:center;gap:16px;padding:20px;
                 background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;
                 color:#b91c1c;margin:16px 0}
    .etat-erreur mat-icon{font-size:32px;width:32px;height:32px;flex-shrink:0}
    .etat-erreur p{margin:4px 0 0;font-size:13px}
    .pag-ctrl{display:flex;align-items:center;gap:8px}
    .page-info{font-size:13px;font-weight:600}
    .filtre-select{background:white;border:1px solid #e2e8f0;border-radius:10px;
                   padding:0 32px 0 12px;height:38px;font-size:13px;cursor:pointer;
                   outline:none;-webkit-appearance:none;appearance:none;
                   background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                   background-repeat:no-repeat;background-position:right 10px center}
    /* MODAL */
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;
             align-items:center;justify-content:center;z-index:1000}
    .modal{background:white;border-radius:16px;width:600px;max-width:94vw;
           box-shadow:0 24px 60px rgba(0,0,0,.25)}
    .modal-hdr{display:flex;justify-content:space-between;align-items:center;
               padding:20px 24px;border-bottom:1px solid #f1f5f9}
    .modal-hdr h2{font-size:17px;color:#1a2233;margin:0}
    .modal-hdr button{background:none;border:none;font-size:18px;cursor:pointer;
                      color:#94a3b8;padding:4px 8px;border-radius:6px}
    .modal-hdr button:hover{background:#f5f5f5}
    .modal-body{padding:24px}
    .modal-ftr{display:flex;justify-content:flex-end;gap:12px;
               padding:16px 24px;border-top:1px solid #f1f5f9}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .form-field{display:flex;flex-direction:column;gap:6px}
    .form-field.full{grid-column:1/-1}
    .form-field label{font-size:13px;font-weight:600;color:#374151}
    .form-field input,.form-select{padding:10px 14px;border:1.5px solid #e2e8f0;
                                   border-radius:8px;font-size:14px;outline:none;
                                   font-family:inherit;color:#1a2233;transition:border-color .2s}
    .form-field input:focus,.form-select:focus{border-color:#1B4F72}
    .err-input{border-color:#ef4444 !important}
    .err-msg{font-size:12px;color:#ef4444}
    .err-banner{background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;
                padding:12px 16px;margin-top:16px;font-size:13px;color:#b91c1c}
    .btn-annuler{padding:10px 20px;background:white;border:1.5px solid #e2e8f0;
                 border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit}
    .btn-annuler:hover{background:#f8fafc}
  `]
})
export class VehiculeListComponent implements OnInit {

  tousLesVehicules: Vehicule[] = [];
  vehiculesAffiches: Vehicule[] = [];
  chargement = false;
  erreur = '';
  recherche = '';
  filtreStatut = '';
  totalElements = 0;
  taillePage = 10;
  page = 0;

  // Modal
  modalOuvert = false;
  vehiculeEdite: Vehicule | null = null;
  form: Partial<Vehicule> = {};
  submitted = false;
  sauvegarde = false;
  erreurSauvegarde = '';

  get totalPages(): number { return Math.ceil(this.totalElements / this.taillePage) || 1; }

  private get hdrs(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement = true;
    this.erreur = '';
    const url = `${environment.apiUrl}/vehicules?page=${this.page}&size=${this.taillePage}`;

    this.http.get<any>(url, { headers: this.hdrs }).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.tousLesVehicules = data;
          this.totalElements = data.length;
        } else if (data?.content && Array.isArray(data.content)) {
          this.tousLesVehicules = data.content;
          this.totalElements = data.totalElements ?? data.content.length;
        } else {
          this.tousLesVehicules = [];
          this.totalElements = 0;
        }
        this.appliquerFiltres();
        this.chargement = false;
      },
      error: (err) => {
        this.erreur = `Erreur ${err.status} : ${err.error?.message || 'Impossible de charger les véhicules.'}`;
        this.chargement = false;
      }
    });
  }

  appliquerFiltres(): void {
    let liste = [...this.tousLesVehicules];
    if (this.filtreStatut) {
      liste = liste.filter(v => v.statut === this.filtreStatut);
    }
    if (this.recherche.trim()) {
      const q = this.recherche.trim().toLowerCase();
      liste = liste.filter(v =>
        (v.immatriculation || '').toLowerCase().includes(q) ||
        (v.marque || '').toLowerCase().includes(q) ||
        (v.modele || '').toLowerCase().includes(q)
      );
    }
    this.vehiculesAffiches = liste;
  }

  filtrerStatut(s: string): void { this.filtreStatut = s; this.appliquerFiltres(); }
  compter(s: string): number { return this.tousLesVehicules.filter(v => v.statut === s).length; }
  trackById(_: number, v: Vehicule): number { return v.id || 0; }
  pageSuivante(): void { if (this.page < this.totalPages - 1) { this.page++; this.charger(); } }
  pagePrecedente(): void { if (this.page > 0) { this.page--; this.charger(); } }

  getBadgeStatut(s?: string): string {
    return { DISPONIBLE:'badge-vert', EN_SERVICE:'badge-bleu', EN_MAINTENANCE:'badge-orange' }[s||''] || 'badge-gris';
  }
  getLabelStatut(s?: string): string {
    return { DISPONIBLE:'✅ Disponible', EN_SERVICE:'🚛 En service', EN_MAINTENANCE:'🔧 Maintenance' }[s||''] || s || '—';
  }
  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  ouvrirFormulaire(v?: Vehicule): void {
    this.vehiculeEdite = v || null;
    this.form = v ? { ...v } : { statut: 'DISPONIBLE', kilometrage: 0 };
    this.submitted = false;
    this.erreurSauvegarde = '';
    this.modalOuvert = true;
  }

  fermerModal(): void { this.modalOuvert = false; }

  sauvegarder(): void {
    this.submitted = true;
    if (!this.form.immatriculation || !this.form.marque || !this.form.modele) return;

    this.sauvegarde = true;
    this.erreurSauvegarde = '';

    // ✅ Payload aligné exactement avec VehiculeDTO.java
    const payload: any = {
      immatriculation: this.form.immatriculation,
      marque:          this.form.marque,
      modele:          this.form.modele,
      capaciteCharge:  this.form.capaciteCharge ? Number(this.form.capaciteCharge) : null,
      statut:          this.form.statut || 'DISPONIBLE',
      kilometrage:     this.form.kilometrage ? Number(this.form.kilometrage) : 0,
      dateMiseEnService: this.form.dateMiseEnService || null
    };

    const req = this.vehiculeEdite?.id
      ? this.http.put(`${environment.apiUrl}/vehicules/${this.vehiculeEdite.id}`, payload, { headers: this.hdrs })
      : this.http.post(`${environment.apiUrl}/vehicules`, payload, { headers: this.hdrs });

    req.subscribe({
      next: () => {
        this.snack.open(
          this.vehiculeEdite?.id ? '✅ Véhicule modifié' : '✅ Véhicule créé',
          'Fermer', { duration: 3500 }
        );
        this.fermerModal();
        this.charger();
        this.sauvegarde = false;
      },
      error: (err) => {
        this.erreurSauvegarde = err.error?.message || `Erreur ${err.status}`;
        this.sauvegarde = false;
      }
    });
  }

  supprimer(v: Vehicule): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: { message: `Supprimer définitivement le véhicule "${v.immatriculation}" ?` }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.http.delete(`${environment.apiUrl}/vehicules/${v.id}`, { headers: this.hdrs })
        .subscribe({
          next: () => { this.snack.open('✅ Véhicule supprimé', 'Fermer', { duration: 3500 }); this.charger(); },
          error: () => this.snack.open('❌ Impossible de supprimer', 'Fermer', { duration: 4000 })
        });
    });
  }
}