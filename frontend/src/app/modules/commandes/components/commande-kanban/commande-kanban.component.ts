// ═══════════════════════════════════════════════════════════════
// commande-kanban.component.ts — Vue Kanban
// ═══════════════════════════════════════════════════════════════
import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommandeService } from '../../services/commande.service';
import { Commande, StatutCommande, STATUT_CONFIG } from '../../models/commande.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-commande-kanban',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="kanban-board">
  <div class="kanban-col" *ngFor="let col of columns">
    <div class="kanban-col__header" [style.border-top-color]="col.color">
      <span class="col-ico">{{ col.ico }}</span>
      <span class="col-lbl">{{ col.label }}</span>
      <span class="col-count">{{ col.items.length }}</span>
    </div>
    <div class="kanban-list"
         cdkDropList
         [id]="col.statut"
         [cdkDropListData]="col.items"
         [cdkDropListConnectedTo]="connectedTo"
         (cdkDropListDropped)="onDrop($event, col.statut)">
      <div *ngFor="let c of col.items; trackBy:trackById"
           class="kanban-card" cdkDrag>
        <div class="kanban-card__num">{{ c.numeroCommande }}</div>
        <div class="kanban-card__client">
          <span class="k-avatar" [style.background]="avatarColor(c)">{{ avatarIni(c) }}</span>
          {{ clientNom(c) }}
        </div>
        <div class="kanban-card__dest">
          <mat-icon>place</mat-icon> {{ c.villeLivraison }}
        </div>
        <div class="kanban-card__meta">
          <span *ngIf="c.poids"><mat-icon>scale</mat-icon> {{ c.poids }}kg</span>
          <span class="kanban-card__date">{{ fmtDate(c.dateLivraisonPrevue) }}</span>
        </div>
      </div>
      <div class="kanban-empty" *ngIf="col.items.length === 0">
        <mat-icon>inbox</mat-icon>
        <span>Aucune commande</span>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { font-family:'Outfit','Segoe UI',sans-serif; display:block; }
    .kanban-board { display:flex; gap:16px; overflow-x:auto; padding:4px 2px 24px; min-height:500px; }
    .kanban-col { width:260px; flex-shrink:0; }
    .kanban-col__header {
      display:flex; align-items:center; gap:8px;
      background:white; border-radius:10px 10px 0 0;
      border-top:3px solid; padding:12px 14px;
      box-shadow:0 1px 3px rgba(0,0,0,.06);
    }
    .col-ico { font-size:16px; }
    .col-lbl { flex:1; font-size:13px; font-weight:700; color:#0f172a; }
    .col-count {
      background:#f1f5f9; color:#64748b; border-radius:10px;
      padding:1px 8px; font-size:11px; font-weight:700;
    }
    .kanban-list { background:#f8fafc; border-radius:0 0 10px 10px; min-height:200px; padding:8px; }
    .kanban-card {
      background:white; border-radius:8px; padding:12px 14px;
      margin-bottom:8px; box-shadow:0 1px 2px rgba(0,0,0,.06);
      cursor:grab; transition:box-shadow .15s;
      &:hover { box-shadow:0 4px 12px rgba(0,0,0,.1); }
    }
    .cdk-drag-preview { box-shadow:0 8px 24px rgba(0,0,0,.15); border-radius:8px; }
    .cdk-drag-placeholder { opacity:.4; }
    .cdk-drag-animating { transition:transform .25s; }
    .kanban-card__num { font-family:monospace; font-size:11px; font-weight:700; color:#1B4F72; margin-bottom:6px; }
    .kanban-card__client {
      display:flex; align-items:center; gap:7px;
      font-size:13px; font-weight:600; color:#0f172a; margin-bottom:6px;
    }
    .k-avatar {
      width:22px; height:22px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:10px; font-weight:700; color:white; flex-shrink:0;
    }
    .kanban-card__dest {
      display:flex; align-items:center; gap:4px;
      font-size:12px; color:#64748b; margin-bottom:8px;
      mat-icon { font-size:13px!important; width:13px!important; height:13px!important; color:#E67E22; }
    }
    .kanban-card__meta {
      display:flex; justify-content:space-between; align-items:center;
      font-size:11px; color:#94a3b8;
      span { display:flex; align-items:center; gap:2px; }
      mat-icon { font-size:12px!important; width:12px!important; height:12px!important; }
    }
    .kanban-card__date { font-weight:600; color:#64748b; }
    .kanban-empty {
      display:flex; flex-direction:column; align-items:center; gap:8px;
      padding:30px 16px; color:#cbd5e1; font-size:13px;
      mat-icon { font-size:28px!important; width:28px!important; height:28px!important; }
    }
  `]
})
export class CommandeKanbanComponent implements OnChanges {
  @Input() commandes: Commande[] = [];

  columns = [
    { statut: 'EN_ATTENTE' as StatutCommande, label: 'En attente', ico: '⏳', color: '#1B4F72', items: [] as Commande[] },
    { statut: 'ASSIGNEE'   as StatutCommande, label: 'Assignée',   ico: '🎯', color: '#D68910', items: [] as Commande[] },
    { statut: 'EN_COURS'   as StatutCommande, label: 'En cours',   ico: '🚛', color: '#E67E22', items: [] as Commande[] },
    { statut: 'LIVREE'     as StatutCommande, label: 'Livrée',     ico: '✅', color: '#1E8449', items: [] as Commande[] },
  ];

  get connectedTo(): string[] { return this.columns.map(c => c.statut); }

  constructor(private svc: CommandeService, private snack: MatSnackBar) {}

  ngOnChanges(): void {
    this.columns.forEach(col => {
      col.items = this.commandes.filter(c => c.statut === col.statut);
    });
  }

  onDrop(event: CdkDragDrop<Commande[]>, targetStatut: StatutCommande): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const commande = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.svc.updateStatut(commande.id, targetStatut).subscribe({
        next: () => this.snack.open(`Statut mis à jour : ${STATUT_CONFIG[targetStatut].label}`, '✕', { duration: 3000 }),
        error: () => {
          transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
          this.snack.open('Erreur lors de la mise à jour', '✕', { duration: 3000 });
        }
      });
    }
  }

  trackById(_: number, c: Commande): number { return c.id; }
  clientNom(c: Commande): string { return c.client?.raisonSociale || c.clientNom || `#${c.clientId}`; }
  avatarIni(c: Commande): string { return (c.client?.raisonSociale || 'C')[0].toUpperCase(); }
  avatarColor(c: Commande): string {
    const colors = ['#1B4F72','#0e6655','#7d3c98','#c0392b'];
    const nom = c.client?.raisonSociale || '';
    return colors[(nom.charCodeAt(0) || 0) % colors.length];
  }
  fmtDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
  }
}