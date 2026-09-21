import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransportService } from '../../core/services/crud.services';
import { Transport } from '../../core/models/models';
import { TransportFormDialogComponent } from './transport-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-transport-list',
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-titre">
          <mat-icon>inventory_2</mat-icon>
          Commandes de transport
        </h1>
        <p class="page-sous-titre">Suivez et gérez toutes vos commandes de livraison</p>
      </div>
      <button class="btn-primaire" (click)="ouvrirFormulaire()">
        <mat-icon>add</mat-icon>
        Nouvelle commande
      </button>
    </div>

    <div class="tms-card">

      <!-- BARRE D'OUTILS -->
      <div class="barre-outils">
        <div class="champ-recherche">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="recherche" (ngModelChange)="onRecherche()"
                 placeholder="Rechercher une commande (référence, client, ville...)">
        </div>

        <select class="filtre-select" [(ngModel)]="filtreStatut" (ngModelChange)="onFiltre()">
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">⏳ En attente de traitement</option>
          <option value="EN_COURS">🚚 En cours de livraison</option>
          <option value="LIVRE">✅ Livré</option>
          <option value="ANNULE">❌ Annulé</option>
        </select>

        <div class="separateur"></div>
        <span class="compteur-total">{{ totalElements }} commande(s)</span>
      </div>

      <!-- CHARGEMENT -->
      <div class="chargement" *ngIf="chargement">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Chargement des commandes...</span>
      </div>

      <!-- TABLEAU -->
      <div class="table-wrapper" *ngIf="!chargement">
        <table class="tms-table" *ngIf="transports.length > 0; else aucuneCommande">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Ville de départ</th>
              <th>Ville d'arrivée</th>
              <th>Date de départ</th>
              <th>Coût (DT)</th>
              <th>Statut de livraison</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of transports">
              <td>
                <span class="col-reference">{{ t.reference || 'CMD-' + t.id }}</span>
              </td>
              <td>
                <div class="client-cell">
                  <div class="client-avatar">{{ getInitiales(t.clientNom || '') }}</div>
                  <span class="col-nom">{{ t.clientNom || 'Client #' + t.clientId }}</span>
                </div>
              </td>
              <td>{{ t.origine || '—' }}</td>
              <td>{{ t.destination || '—' }}</td>
              <td>{{ t.dateDepart ? formatDate(t.dateDepart) : '—' }}</td>
              <td>
                <span class="col-montant">{{ t.cout ? (t.cout | number:'1.2-2') + ' DT' : '—' }}</span>
              </td>
              <td>
                <span class="badge" [ngClass]="getBadgeStatut(t.statut)">
                  {{ getLabelStatut(t.statut) }}
                </span>
              </td>
              <td>
                <div class="cellule-actions">
                  <button class="btn-modifier" (click)="ouvrirFormulaire(t)" matTooltip="Modifier cette commande">
                    <mat-icon>edit</mat-icon>
                    Modifier
                  </button>
                  <button class="btn-supprimer" (click)="supprimer(t)" matTooltip="Supprimer définitivement">
                    <mat-icon>delete_outline</mat-icon>
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ÉTAT VIDE -->
        <ng-template #aucuneCommande>
          <div class="etat-vide">
            <div class="etat-vide-icone">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <h3>Aucune commande trouvée</h3>
            <p>{{ recherche || filtreStatut ? 'Aucun résultat ne correspond à vos critères.' : 'Créez votre première commande de transport.' }}</p>
            <button class="btn-primaire" *ngIf="!recherche && !filtreStatut" (click)="ouvrirFormulaire()">
              <mat-icon>add</mat-icon> Créer une commande
            </button>
            <button class="btn-secondaire" *ngIf="recherche || filtreStatut" (click)="reinitialiserFiltres()">
              <mat-icon>clear</mat-icon> Effacer les filtres
            </button>
          </div>
        </ng-template>
      </div>

      <!-- PAGINATION -->
      <div class="tms-pagination" *ngIf="!chargement && transports.length > 0">
        <span>Affichage de {{ debut + 1 }} à {{ fin }} sur {{ totalElements }} commandes</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn-icone" (click)="pagePrecedente()" [disabled]="page === 0" matTooltip="Page précédente">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span style="font-size:13px;font-weight:600">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="btn-icone" (click)="pageSuivante()" [disabled]="page >= totalPages - 1" matTooltip="Page suivante">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .col-reference { font-family:monospace;font-size:13px;font-weight:600;color:#1B4F72;background:#EBF5FB;padding:3px 8px;border-radius:6px; }
    .col-montant { font-weight:600;color:#059669;font-family:monospace; }
    .client-cell { display:flex;align-items:center;gap:8px; }
    .client-avatar { width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1B4F72,#2980b9);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0; }
    .filtre-select { background:white;border:1px solid #e2e8f0;border-radius:10px;padding:0 32px 0 12px;height:38px;font-family:'Inter',sans-serif;font-size:13px;color:#1e293b;cursor:pointer;outline:none;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center; }
    .filtre-select:focus { border-color:#1B4F72;box-shadow:0 0 0 3px rgba(27,79,114,.1); }
  `]
})
export class TransportListComponent implements OnInit {
  transports: Transport[] = [];
  chargement = false;
  recherche = '';
  filtreStatut = '';
  totalElements = 0;
  taillePage = 10;
  page = 0;

  get totalPages(): number { return Math.ceil(this.totalElements / this.taillePage) || 1; }
  get debut(): number { return this.page * this.taillePage; }
  get fin(): number { return Math.min(this.debut + this.taillePage, this.totalElements); }

  constructor(
    private transportService: TransportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement = true;
    this.transportService.getAll(this.page, this.taillePage, this.filtreStatut).subscribe({
      next: (data: any) => {
        this.transports = data.content || [];
        this.totalElements = data.totalElements || 0;
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.snackBar.open('Erreur lors du chargement des commandes', 'Fermer', { duration: 4000 });
      }
    });
  }

  onRecherche(): void {
    clearTimeout((this as any)._timer);
    (this as any)._timer = setTimeout(() => { this.page = 0; this.charger(); }, 350);
  }

  onFiltre(): void { this.page = 0; this.charger(); }
  pageSuivante(): void { if (this.page < this.totalPages - 1) { this.page++; this.charger(); } }
  pagePrecedente(): void { if (this.page > 0) { this.page--; this.charger(); } }
  reinitialiserFiltres(): void { this.recherche = ''; this.filtreStatut = ''; this.page = 0; this.charger(); }

  getBadgeStatut(statut?: string): string {
    const m: Record<string, string> = {
      'EN_ATTENTE': 'badge-orange',
      'EN_COURS':   'badge-bleu',
      'LIVRE':      'badge-vert',
      'ANNULE':     'badge-rouge'
    };
    return m[statut || ''] || 'badge-gris';
  }

  getLabelStatut(statut?: string): string {
    const m: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS':   'En cours de livraison',
      'LIVRE':      'Livré',
      'ANNULE':     'Annulé'
    };
    return m[statut || ''] || statut || 'Inconnu';
  }

  getInitiales(nom: string): string {
    return nom ? nom.split(' ').map((p: string) => p[0]).join('').substring(0, 2).toUpperCase() : '?';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  ouvrirFormulaire(transport?: Transport): void {
    const ref = this.dialog.open(TransportFormDialogComponent, {
      width: '720px', maxWidth: '95vw', data: { transport }
    });
    ref.afterClosed().subscribe((r: boolean) => { if (r) this.charger(); });
  }

  supprimer(t: Transport): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: { message: `Voulez-vous vraiment supprimer la commande "${t.reference || 'CMD-' + t.id}" ?\n\nCette action est irréversible.` }
    });
    ref.afterClosed().subscribe((confirme: boolean) => {
      if (confirme) {
        this.transportService.delete(t.id!).subscribe({
          next: () => {
            this.snackBar.open('✅ Commande supprimée avec succès', 'Fermer', { duration: 3500 });
            this.charger();
          },
          error: () => this.snackBar.open('❌ Impossible de supprimer cette commande', 'Fermer', { duration: 4000 })
        });
      }
    });
  }
}
