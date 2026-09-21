// ═══════════════════════════════════════════════════════════════
// commande-delete-dialog.component.ts
// ═══════════════════════════════════════════════════════════════
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-commande-delete-dialog',
  template: `
<div class="del-dialog">
  <div class="del-dialog__ico">⚠️</div>
  <h2>Supprimer la commande ?</h2>
  <p>
    La commande <strong>{{ data.numeroCommande }}</strong>
    sera définitivement supprimée. Cette action est irréversible.
  </p>
  <div *ngIf="data.client" class="del-dialog__info">
    <mat-icon>corporate_fare</mat-icon>
    {{ data.client.raisonSociale }}
  </div>
  <div class="del-dialog__actions">
    <button mat-stroked-button mat-dialog-close>Annuler</button>
    <button mat-flat-button class="btn-confirm-del" [mat-dialog-close]="true">
      <mat-icon>delete_forever</mat-icon> Supprimer définitivement
    </button>
  </div>
</div>
  `,
  styles: [`
    .del-dialog { padding:28px; text-align:center; font-family:'Outfit','Segoe UI',sans-serif; }
    .del-dialog__ico { font-size:48px; margin-bottom:12px; }
    h2 { font-size:18px; font-weight:800; color:#0f172a; margin:0 0 10px; }
    p  { font-size:14px; color:#475569; line-height:1.6; margin:0 0 16px; }
    strong { color:#0f172a; font-weight:700; }
    .del-dialog__info {
      display:flex; align-items:center; justify-content:center; gap:6px;
      background:#f8fafc; border-radius:8px; padding:10px 16px;
      font-size:13px; color:#64748b; margin-bottom:24px;
      mat-icon { font-size:16px!important; width:16px!important; height:16px!important; }
    }
    .del-dialog__actions { display:flex; justify-content:center; gap:12px; }
    .btn-confirm-del { background:#CB4335!important; color:white!important; border-radius:10px!important;
                       font-weight:700!important; mat-icon { margin-right:4px; } }
  `]
})
export class CommandeDeleteDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<CommandeDeleteDialogComponent>
  ) {}
}