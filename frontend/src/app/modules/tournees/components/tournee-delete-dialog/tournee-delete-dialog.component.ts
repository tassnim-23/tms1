import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournee } from '../../models/tournee.model';

@Component({
  selector: 'app-tournee-delete-dialog',
  template: `
<div class="dialog-shell">
  <div class="dialog-icon"><mat-icon>warning_amber</mat-icon></div>
  <h2>Supprimer la tournée ?</h2>
  <p>
    Vous êtes sur le point de supprimer la tournée
    <strong>{{ data.numeroTournee }}</strong>
    du <strong>{{ formatDate(data.dateTournee) }}</strong>.
  </p>
  <div class="dialog-warn" *ngIf="data.nombreCommandes > 0">
    <mat-icon>info</mat-icon>
    <span>
      {{ data.nombreCommandes }} commande{{ data.nombreCommandes > 1 ? 's' : '' }}
      {{ data.nombreCommandes > 1 ? 'seront remises' : 'sera remise' }} en attente.
    </span>
  </div>
  <p class="dialog-irreversible">Cette action est irréversible.</p>
  <div class="dialog-actions">
    <button mat-stroked-button (click)="ref.close(false)">Annuler</button>
    <button mat-flat-button class="btn-confirm" (click)="ref.close(true)">
      <mat-icon>delete_forever</mat-icon> Supprimer définitivement
    </button>
  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    .dialog-shell {
      font-family: 'Outfit', sans-serif;
      padding: 32px;
      text-align: center;
      max-width: 400px;
    }
    .dialog-icon mat-icon {
      font-size: 52px; width: 52px; height: 52px;
      color: #e74c3c;
    }
    h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 14px 0 10px; }
    p { font-size: 14px; color: #64748b; margin: 0 0 14px; line-height: 1.6; }
    strong { color: #0f172a; }
    .dialog-warn {
      display: flex; align-items: flex-start; gap: 8px;
      background: #FEF3E2; border: 1px solid #f5cba7;
      border-radius: 10px; padding: 12px 14px;
      color: #D68910; font-size: 13px; font-weight: 500;
      text-align: left; margin-bottom: 12px;
      mat-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    }
    .dialog-irreversible { font-size: 12px; color: #94a3b8; }
    .dialog-actions {
      display: flex; justify-content: center; gap: 12px; margin-top: 24px;
    }
    .btn-confirm {
      background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
      color: white !important;
      border-radius: 10px !important;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 600 !important;
      display: flex; align-items: center; gap: 6px;
      mat-icon { font-size: 16px; }
    }
  `]
})
export class TourneeDeleteDialogComponent {
  constructor(
    public ref: MatDialogRef<TourneeDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Tournee
  ) {}

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}
