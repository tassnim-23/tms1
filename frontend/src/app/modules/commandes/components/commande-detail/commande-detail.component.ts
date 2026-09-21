// ═══════════════════════════════════════════════════════════════
// commande-detail.component.ts — Page détail avec timeline
// ═══════════════════════════════════════════════════════════════
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommandeService } from '../../services/commande.service';
import { Commande, STATUT_CONFIG } from '../../models/commande.model';
import { CommandeDeleteDialogComponent } from '../commande-delete-dialog/commande-delete-dialog.component';

@Component({
  selector: 'app-commande-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="detail-shell">

  <!-- HEADER -->
  <header class="detail-header">
    <button class="back-btn" (click)="retour()">
      <mat-icon>arrow_back</mat-icon> Commandes
    </button>
    <div class="detail-header__title" *ngIf="commande">
      <span class="detail-num">{{ commande.numeroCommande }}</span>
      <span class="statut-badge"
            [style.background]="cfg(commande.statut)?.bg"
            [style.color]="cfg(commande.statut)?.color"
            [style.border-color]="cfg(commande.statut)?.border">
        <span class="statut-dot" [style.background]="cfg(commande.statut)?.color"></span>
        {{ cfg(commande.statut)?.label }}
      </span>
    </div>
    <div class="detail-header__actions" *ngIf="commande">
      <button mat-stroked-button (click)="modifier()" [disabled]="commande.statut==='LIVREE'||commande.statut==='ANNULEE'">
        <mat-icon>edit</mat-icon> Modifier
      </button>
      <button mat-stroked-button class="btn-danger-outline" (click)="supprimer()">
        <mat-icon>delete</mat-icon> Supprimer
      </button>
    </div>
  </header>

  <!-- LOADING -->
  <div class="loading-wrap" *ngIf="loading">
    <mat-spinner diameter="40"></mat-spinner>
    <span>Chargement...</span>
  </div>

  <!-- CONTENT -->
  <div class="detail-body" *ngIf="!loading && commande">

    <!-- ROW 1 : CLIENT + LIVRAISON -->
    <div class="cards-row">

      <div class="info-card">
        <div class="info-card__header">
          <mat-icon>corporate_fare</mat-icon>
          <h3>Client</h3>
        </div>
        <div class="info-card__body">
          <div class="info-client">
            <div class="avatar-lg" [style.background]="avatarColor()">
              {{ avatarInitiale() }}
            </div>
            <div>
              <div class="info-val info-val--big">{{ commande.client?.raisonSociale || commande.clientNom }}</div>
              <div class="info-meta" *ngIf="commande.client?.matriculeFiscale">
                Mat. {{ commande.client?.matriculeFiscale }}
              </div>
              <div class="info-meta" *ngIf="commande.client?.responsableEntreprise">
                Resp. : {{ commande.client?.responsableEntreprise }}
              </div>
              <div class="info-link" *ngIf="commande.client?.email">
                <mat-icon>email</mat-icon> {{ commande.client?.email }}
              </div>
              <div class="info-link" *ngIf="commande.client?.telephone">
                <mat-icon>phone</mat-icon> {{ commande.client?.telephone }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card__header">
          <mat-icon>place</mat-icon>
          <h3>Adresse de livraison</h3>
        </div>
        <div class="info-card__body">
          <div class="itin-block">
            <div class="itin-dot itin-dot--to"></div>
            <div>
              <div class="info-val">{{ commande.adresseLivraison }}</div>
              <div class="info-meta">{{ commande.codePostalLivraison }} {{ commande.villeLivraison }}, {{ commande.paysLivraison }}</div>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <mat-icon>person</mat-icon>
            <div>
              <div class="info-lbl">Contact sur place</div>
              <div class="info-val">{{ commande.contactLivraison || '—' }}</div>
            </div>
          </div>
          <div class="info-row" *ngIf="commande.telephoneContactLivraison">
            <mat-icon>phone</mat-icon>
            <div>
              <div class="info-lbl">Téléphone</div>
              <div class="info-val">{{ commande.telephoneContactLivraison }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ROW 2 : MARCHANDISE + DATES -->
    <div class="cards-row">

      <div class="info-card">
        <div class="info-card__header">
          <mat-icon>inventory</mat-icon>
          <h3>Marchandise</h3>
        </div>
        <div class="info-card__body">
          <p class="desc-text" *ngIf="commande.descriptionMarchandise">{{ commande.descriptionMarchandise }}</p>
          <p class="desc-text muted" *ngIf="!commande.descriptionMarchandise">Aucune description fournie</p>
          <div class="metrics-row">
            <div class="metric" *ngIf="commande.poids">
              <mat-icon>scale</mat-icon>
              <span class="metric-val">{{ commande.poids | number:'1.0-2' }} kg</span>
              <span class="metric-lbl">Poids</span>
            </div>
            <div class="metric" *ngIf="commande.volume">
              <mat-icon>straighten</mat-icon>
              <span class="metric-val">{{ commande.volume }} m³</span>
              <span class="metric-lbl">Volume</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card__header">
          <mat-icon>event</mat-icon>
          <h3>Dates</h3>
        </div>
        <div class="info-card__body">
          <div class="date-item">
            <span class="date-lbl">Date de commande</span>
            <span class="date-val">{{ fmtDate(commande.dateCommande || "") }}</span>
          </div>
          <div class="date-item">
            <span class="date-lbl">Livraison prévue</span>
            <span class="date-val date-val--main">{{ fmtDate(commande.dateLivraisonPrevue) }}</span>
          </div>
          <div class="date-item" *ngIf="commande.updatedAt">
            <span class="date-lbl">Dernière mise à jour</span>
            <span class="date-val">{{ fmtDateHeure(commande.updatedAt) }}</span>
          </div>
          <div class="date-item" *ngIf="commande.createdAt">
            <span class="date-lbl">Créée le</span>
            <span class="date-val">{{ fmtDateHeure(commande.createdAt) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- REMARQUES -->
    <div class="info-card info-card--full" *ngIf="commande.remarques">
      <div class="info-card__header">
        <mat-icon>notes</mat-icon>
        <h3>Remarques & Instructions spéciales</h3>
      </div>
      <div class="info-card__body">
        <p class="remarks-text">{{ commande.remarques }}</p>
      </div>
    </div>

    <!-- TIMELINE -->
    <div class="info-card info-card--full">
      <div class="info-card__header">
        <mat-icon>timeline</mat-icon>
        <h3>Historique de la commande</h3>
      </div>
      <div class="info-card__body">
        <div class="timeline">
          <div class="tl-item" *ngFor="let evt of timeline">
            <div class="tl-marker">
              <div class="tl-dot" [style.background]="evt.color"></div>
              <div class="tl-line" *ngIf="!evt.last"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">{{ evt.title }}</div>
              <div class="tl-date">{{ evt.date }}</div>
              <div class="tl-desc" *ngIf="evt.desc">{{ evt.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ACTIONS RAPIDES -->
    <div class="quick-actions" *ngIf="commande.statut !== 'LIVREE' && commande.statut !== 'ANNULEE'">
      <h4>Actions rapides</h4>
      <div class="quick-actions__btns">
        <button *ngIf="commande.statut==='EN_ATTENTE'" mat-flat-button class="qa-btn qa-btn--start"
                (click)="changerStatut('EN_COURS')">
          <mat-icon>play_arrow</mat-icon> Démarrer la livraison
        </button>
        <button *ngIf="commande.statut==='EN_COURS'" mat-flat-button class="qa-btn qa-btn--done"
                (click)="changerStatut('LIVREE')">
          <mat-icon>check_circle</mat-icon> Confirmer la livraison
        </button>
        <button *ngIf="commande.statut==='EN_ATTENTE'||commande.statut==='EN_COURS'||commande.statut==='ASSIGNEE'"
                mat-stroked-button class="qa-btn qa-btn--cancel"
                (click)="changerStatut('ANNULEE')">
          <mat-icon>cancel</mat-icon> Annuler la commande
        </button>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    :host { --blue:#1B4F72; --orange:#E67E22; --border:#E2E8F0; --text:#0F172A;
            --text-2:#475569; --text-3:#94A3B8; --card:#fff; --bg:#F0F2F5;
            font-family:'Outfit','Segoe UI',sans-serif; display:block; }

    .detail-shell { min-height:100vh; background:var(--bg); }

    .detail-header {
      display:flex; align-items:center; gap:16px;
      padding:16px 32px; background:var(--card);
      border-bottom:1px solid var(--border);
    }
    .back-btn {
      display:flex; align-items:center; gap:4px;
      background:none; border:none; cursor:pointer;
      color:var(--text-2); font-size:14px; font-weight:500; font-family:inherit;
      padding:6px 10px; border-radius:8px;
      &:hover { background:#f1f5f9; }
      mat-icon { font-size:18px!important; }
    }
    .detail-header__title { display:flex; align-items:center; gap:12px; flex:1; }
    .detail-num { font-family:monospace; font-size:18px; font-weight:800; color:var(--text); }
    .statut-badge {
      display:inline-flex; align-items:center; gap:6px;
      padding:6px 14px; border-radius:8px; font-size:13px; font-weight:600; border:1.5px solid;
    }
    .statut-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .detail-header__actions { display:flex; gap:10px; }
    .btn-danger-outline { color:#cb4335!important; border-color:#f1948a!important; }
    .loading-wrap { display:flex; align-items:center; justify-content:center; gap:16px; padding:80px; color:var(--text-3); }
    .detail-body { padding:24px 32px; max-width:1100px; }
    .cards-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

    .info-card {
      background:var(--card); border-radius:12px;
      box-shadow:0 1px 3px rgba(0,0,0,.06); overflow:hidden;
      &--full { grid-column:1/-1; }
    }
    .info-card__header {
      display:flex; align-items:center; gap:10px;
      padding:16px 20px 12px; border-bottom:1px solid var(--border);
      mat-icon { color:var(--blue); font-size:20px!important; }
      h3 { font-size:14px; font-weight:700; color:var(--text); margin:0;
           text-transform:uppercase; letter-spacing:.04em; }
    }
    .info-card__body { padding:18px 20px; }

    .info-client { display:flex; gap:16px; align-items:flex-start; }
    .avatar-lg {
      width:52px; height:52px; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:20px; font-weight:700; color:white; flex-shrink:0;
    }
    .info-val { font-size:14px; font-weight:600; color:var(--text); margin-bottom:3px; }
    .info-val--big { font-size:16px; font-weight:800; }
    .info-meta { font-size:12px; color:var(--text-3); margin-bottom:3px; }
    .info-link { display:flex; align-items:center; gap:5px; font-size:12.5px; color:var(--blue); margin-top:4px;
                 mat-icon { font-size:14px!important; width:14px!important; height:14px!important; } }
    .info-divider { height:1px; background:var(--border); margin:14px 0; }
    .info-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px;
                mat-icon { color:var(--text-3); font-size:18px!important; margin-top:2px; } }
    .info-lbl { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:2px; }

    .itin-block { display:flex; align-items:flex-start; gap:12px; }
    .itin-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:4px; }
    .itin-dot--to { background:var(--orange); box-shadow:0 0 0 3px #ffedd5; }

    .desc-text { font-size:14px; color:var(--text-2); line-height:1.6; margin:0 0 16px; }
    .desc-text.muted { color:var(--text-3); font-style:italic; }
    .metrics-row { display:flex; gap:16px; }
    .metric { display:flex; align-items:center; gap:6px; background:#f8fafc; padding:8px 14px; border-radius:8px; flex:1;
              mat-icon { color:var(--blue); font-size:18px!important; } }
    .metric-val { font-size:15px; font-weight:700; color:var(--text); }
    .metric-lbl { font-size:11px; color:var(--text-3); }

    .date-item { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f8fafc; }
    .date-lbl { font-size:12px; color:var(--text-3); font-weight:500; }
    .date-val { font-size:13.5px; color:var(--text); font-weight:600; }
    .date-val--main { color:var(--blue); font-size:15px; }

    .remarks-text { font-size:14px; color:var(--text-2); line-height:1.7; white-space:pre-wrap; margin:0; }

    /* TIMELINE */
    .timeline { display:flex; flex-direction:column; }
    .tl-item { display:flex; gap:16px; }
    .tl-marker { display:flex; flex-direction:column; align-items:center; width:16px; flex-shrink:0; }
    .tl-dot { width:14px; height:14px; border-radius:50%; flex-shrink:0; border:2px solid white; box-shadow:0 0 0 2px var(--border); }
    .tl-line { flex:1; width:2px; background:var(--border); min-height:20px; }
    .tl-content { padding-bottom:20px; flex:1; }
    .tl-title { font-size:13.5px; font-weight:600; color:var(--text); }
    .tl-date { font-size:12px; color:var(--text-3); margin-top:2px; }
    .tl-desc { font-size:12px; color:var(--text-2); margin-top:4px; }

    /* QUICK ACTIONS */
    .quick-actions {
      background:var(--card); border-radius:12px; padding:20px 24px;
      box-shadow:0 1px 3px rgba(0,0,0,.06);
      h4 { font-size:13px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:.08em; margin:0 0 14px; }
    }
    .quick-actions__btns { display:flex; gap:12px; flex-wrap:wrap; }
    .qa-btn { border-radius:10px!important; font-weight:600!important; mat-icon { margin-right:6px; } }
    .qa-btn--start { background:var(--blue)!important; color:white!important; }
    .qa-btn--done { background:#1E8449!important; color:white!important; }
    .qa-btn--cancel { color:#cb4335!important; border-color:#f1948a!important; }

    @media (max-width:768px) {
      .detail-body { padding:16px; }
      .cards-row { grid-template-columns:1fr; }
    }
  `]
})
export class CommandeDetailComponent implements OnInit {
  commande?: Commande;
  loading = true;
  readonly cfgMap = STATUT_CONFIG;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: CommandeService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(p => {
      if (p['id']) this.charger(+p['id']);
    });
  }

  charger(id: number): void {
    this.svc.getById(id).subscribe({
      next: c => { this.commande = c; this.loading = false; this.cd.markForCheck(); },
      error: () => { this.loading = false; this.router.navigate(['/commandes']); }
    });
  }

  cfg(statut: string): any { return (this.cfgMap as any)[statut]; }

  avatarColor(): string {
    const nom = this.commande?.client?.raisonSociale || '';
    const colors = ['#1B4F72','#0e6655','#7d3c98','#c0392b'];
    return colors[(nom.charCodeAt(0) || 0) % colors.length];
  }

  avatarInitiale(): string {
    return (this.commande?.client?.raisonSociale || 'C')[0].toUpperCase();
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  fmtDateHeure(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get timeline(): any[] {
    if (!this.commande) return [];
    const events: any[] = [];
    const statutColors: any = {
      EN_ATTENTE: '#1B4F72', ASSIGNEE: '#D68910',
      EN_COURS: '#E67E22', LIVREE: '#1E8449', ANNULEE: '#CB4335'
    };

    events.push({
      title: 'Commande créée', date: this.fmtDateHeure(this.commande.createdAt || this.commande.dateCommande || ""),
      color: '#94A3B8', desc: `N° ${this.commande.numeroCommande}`
    });

    if (this.commande.statut !== 'EN_ATTENTE') {
      events.push({
        title: `Statut : ${this.cfg(this.commande.statut)?.label}`,
        date: this.fmtDateHeure(this.commande.updatedAt || ''),
        color: statutColors[this.commande.statut]
      });
    }

    events[events.length - 1].last = true;
    return events;
  }

  modifier(): void { this.router.navigate(['/commandes', this.commande?.id, 'edit']); }
  retour(): void    { this.router.navigate(['/commandes']); }

  supprimer(): void {
    const ref = this.dialog.open(CommandeDeleteDialogComponent, {
      data: this.commande, width: '420px'
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.delete(this.commande!.id).subscribe({
        next: () => {
          this.snack.open('Commande supprimée', '✕', { duration: 3000 });
          this.router.navigate(['/commandes']);
        }
      });
    });
  }

  changerStatut(statut: any): void {
    this.svc.updateStatut(this.commande!.id, statut).subscribe({
      next: c => {
        this.commande = c;
        this.snack.open(`Statut : ${this.cfg(statut)?.label}`, '✕', { duration: 3000 });
        this.cd.markForCheck();
      }
    });
  }
}