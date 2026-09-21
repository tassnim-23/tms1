import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientService } from '../../../core/services/crud.services';
import { Client } from '../../../core/models/models';
import { ClientFormDialogComponent } from './client-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { ClientDetailDialogComponent } from './client-detail-dialog.component';

@Component({
  selector: 'app-client-list',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-titre">
          <mat-icon>corporate_fare</mat-icon>
          Gestion des clients
        </h1>
        <p class="page-sous-titre">{{ totalElements }} client(s) entreprise enregistré(s)</p>
      </div>
      <button class="btn-primaire" (click)="ouvrirFormulaire()">
        <mat-icon>add</mat-icon>
        Ajouter un client
      </button>
    </div>

    <div class="tms-card">
      <div class="barre-outils">
        <div class="champ-recherche">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="recherche" (ngModelChange)="onRecherche()"
                 placeholder="Rechercher par raison sociale, email, responsable...">
        </div>
        <select class="filtre-select" [(ngModel)]="filtreActivite" (ngModelChange)="onFiltre()">
          <option value="">Tous les secteurs</option>
          <option value="Transport">Transport</option>
          <option value="Logistique">Logistique</option>
          <option value="Commerce">Commerce</option>
          <option value="Distribution">Distribution</option>
          <option value="Import/Export">Import / Export</option>
          <option value="Industrie">Industrie</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Services">Services</option>
          <option value="Autre">Autre</option>
        </select>
        <div class="separateur"></div>
        <span class="compteur-total">{{ totalElements }} client(s)</span>
      </div>

      <div class="chargement" *ngIf="chargement">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Chargement des clients...</span>
      </div>

      <div class="table-wrapper" *ngIf="!chargement">
        <table class="tms-table" *ngIf="clients.length > 0; else aucun">
          <thead>
            <tr>
              <th>Raison sociale</th>
              <th>Matricule fiscale</th>
              <th>Responsable</th>
              <th>Contact</th>
              <th>Secteur d'activité</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clients">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="client-avatar">{{ getInitiales(c.raisonSociale) }}</div>
                  <div>
                    <div class="col-nom">{{ c.raisonSociale }}</div>
                    <div style="font-size:11.5px;color:#94a3b8">Client n°{{ c.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-gris" style="font-family:monospace;font-size:11.5px">
                  {{ c.matriculeFiscale || '—' }}
                </span>
              </td>
              <td>{{ c.responsableEntreprise || '—' }}</td>
              <td>
                <div>
                  <a [href]="'mailto:' + c.email" class="lien-email" *ngIf="c.email">{{ c.email }}</a>
                  <span *ngIf="!c.email" style="color:#94a3b8">—</span>
                </div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">{{ c.telephone || '' }}</div>
              </td>
              <td>
                <span class="badge badge-bleu" *ngIf="c.activite">{{ c.activite }}</span>
                <span *ngIf="!c.activite" style="color:#94a3b8">—</span>
              </td>
              <td>
                <span class="adresse-cell" [matTooltip]="c.adresseComplete || ''" matTooltipPosition="above">
                  {{ (c.adresseComplete || '').substring(0, 35) }}{{ (c.adresseComplete || '').length > 35 ? '...' : '' }}
                </span>
              </td>
              <td>
                <div class="cellule-actions">
                  <button class="btn-voir" (click)="voirDetails(c)">
                    <mat-icon>visibility</mat-icon> Détails
                  </button>
                  <button class="btn-modifier" (click)="ouvrirFormulaire(c)">
                    <mat-icon>edit</mat-icon> Modifier
                  </button>
                  <button class="btn-supprimer" (click)="supprimer(c)">
                    <mat-icon>delete_outline</mat-icon> Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #aucun>
          <div class="etat-vide">
            <div class="etat-vide-icone"><mat-icon>corporate_fare</mat-icon></div>
            <h3>Aucun client trouvé</h3>
            <p>{{ recherche ? 'Aucun résultat pour votre recherche.' : 'Commencez par ajouter votre premier client.' }}</p>
            <button class="btn-primaire" *ngIf="!recherche" (click)="ouvrirFormulaire()">
              <mat-icon>add</mat-icon> Ajouter un client
            </button>
          </div>
        </ng-template>
      </div>

      <div class="tms-pagination" *ngIf="!chargement && clients.length > 0">
        <span>Affichage de {{ debut + 1 }} à {{ fin }} sur {{ totalElements }} clients</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn-icone" (click)="pagePrecedente()" [disabled]="page === 0">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span style="font-size:13px;font-weight:600">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="btn-icone" (click)="pageSuivante()" [disabled]="page >= totalPages - 1">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .client-avatar { width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#1B4F72,#2980b9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0; }
    .lien-email { color:#1B4F72;text-decoration:none;font-size:13px; }
    .lien-email:hover { text-decoration:underline; }
    .adresse-cell { font-size:12.5px;color:#475569;cursor:default; }
    .btn-voir { background:#e8f4fd;color:#1565c0;border:none;border-radius:7px;padding:6px 12px;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600; }
    .filtre-select { background:white;border:1px solid #e2e8f0;border-radius:10px;padding:0 32px 0 12px;height:38px;font-family:'Inter',sans-serif;font-size:13px;color:#1e293b;cursor:pointer;outline:none;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center; }
  `]
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  chargement = false;
  recherche = '';
  filtreActivite = '';
  totalElements = 0;
  taillePage = 10;
  page = 0;

  get totalPages(): number { return Math.ceil(this.totalElements / this.taillePage) || 1; }
  get debut(): number { return this.page * this.taillePage; }
  get fin(): number { return Math.min(this.debut + this.taillePage, this.totalElements); }

  constructor(
    private svc: ClientService, 
    private dialog: MatDialog, 
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { 
    this.charger(); 
  }

  charger(): void {
    this.chargement = true;
    this.svc.getAll(this.page, this.taillePage, this.recherche).subscribe({
      next: d => { 
        this.clients = d.content; 
        this.totalElements = d.totalElements; 
        this.chargement = false; 
      },
      error: () => { 
        this.chargement = false; 
        this.snack.open('Erreur de chargement', 'Fermer', { duration: 4000 }); 
      }
    });
  }

  voirDetails(c: Client): void {
    this.dialog.open(ClientDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { client: c }
    });
  }

  onRecherche(): void { 
    clearTimeout((this as any)._t); 
    (this as any)._t = setTimeout(() => { 
      this.page = 0; 
      this.charger(); 
    }, 350); 
  }

  onFiltre(): void { 
    this.page = 0; 
    this.charger(); 
  }

  pageSuivante(): void { 
    if (this.page < this.totalPages - 1) { 
      this.page++; 
      this.charger(); 
    } 
  }

  pagePrecedente(): void { 
    if (this.page > 0) { 
      this.page--; 
      this.charger(); 
    } 
  }

  getInitiales(nom?: string): string {
    if (!nom) return '?';
    return nom.split(' ').filter(p => p).map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  ouvrirFormulaire(c?: Client): void {
    this.dialog.open(ClientFormDialogComponent, { 
      width: '740px', 
      maxWidth: '95vw', 
      data: { client: c } 
    }).afterClosed().subscribe(r => { 
      if (r) this.charger(); 
    });
  }

  supprimer(c: Client): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: { message: `Voulez-vous vraiment supprimer le client "${c.raisonSociale}" ?\n\nToutes ses commandes associées seront également affectées.` }
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this.svc.delete(c.id!).subscribe({
          next: () => { 
            this.snack.open('✅ Client supprimé', 'Fermer', { duration: 3500 }); 
            this.charger(); 
          },
          error: () => this.snack.open('❌ Impossible de supprimer ce client', 'Fermer', { duration: 4000 })
        });
      }
    });
  }
}