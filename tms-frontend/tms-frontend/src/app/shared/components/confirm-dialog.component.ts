import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">

      <div class="confirm-icone">
        <mat-icon>warning_amber</mat-icon>
      </div>

      <h2 class="confirm-titre">Confirmation requise</h2>

      <p class="confirm-message" [innerHTML]="messageFormate"></p>

      <div class="confirm-actions">
        <button class="btn-secondaire" (click)="dialogRef.close(false)">
          <mat-icon>close</mat-icon>
          Non, annuler
        </button>
        <button class="btn-confirmer" (click)="dialogRef.close(true)">
          <mat-icon>check</mat-icon>
          Oui, confirmer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 32px 28px; gap: 14px;
    }
    .confirm-icone {
      width: 60px; height: 60px; border-radius: 50%;
      background: #FEF3C7; display: flex; align-items: center; justify-content: center;
    }
    .confirm-icone mat-icon { font-size: 30px; width: 30px; height: 30px; color: #d97706; }
    .confirm-titre { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
    .confirm-message { font-size: 14px; color: #475569; line-height: 1.6; max-width: 340px; white-space: pre-line; }
    .confirm-actions { display: flex; gap: 10px; margin-top: 6px; }
    .btn-confirmer {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 0 20px; height: 40px;
      background: #dc2626; color: white;
      border: none; border-radius: 10px;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all .18s ease;
    }
    .btn-confirmer:hover { background: #b91c1c; }
    .btn-confirmer mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondaire {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 0 16px; height: 40px;
      background: white; color: #475569;
      border: 1px solid #e2e8f0; border-radius: 10px;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all .18s ease;
    }
    .btn-secondaire:hover { background: #f1f5f9; }
    .btn-secondaire mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class ConfirmDialogComponent {
  get messageFormate(): string {
    return (this.data.message || 'Êtes-vous sûr de vouloir effectuer cette action ?');
  }

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message?: string }
  ) {}
}
