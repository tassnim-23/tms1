import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChauffeurService } from '../../core/services/crud.services';
import { Chauffeur } from '../../core/models/models';

@Component({
  selector: 'app-chauffeur-form-dialog',
  template: `
    <div class="dialog-en-tete">
      <h2>
        <mat-icon>{{ estModification ? 'edit' : 'person_add' }}</mat-icon>
        {{ estModification ? 'Modifier le chauffeur' : 'Ajouter un chauffeur' }}
      </h2>
      <button class="btn-icone" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <div mat-dialog-content style="max-height:70vh;overflow-y:auto;padding:0;">
      <form [formGroup]="formulaire">

        <div class="form-corps">
          <div class="form-titre-section">👤 Informations personnelles</div>
          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Nom <span class="requis">*</span></label>
              <input class="form-input" formControlName="nom" [class.invalide]="inv('nom')" placeholder="Ex : Ben Ali">
              <span class="form-erreur" *ngIf="inv('nom')">Le nom est obligatoire</span>
            </div>
            <div class="form-champ">
              <label class="form-label">Prénom <span class="requis">*</span></label>
              <input class="form-input" formControlName="prenom" [class.invalide]="inv('prenom')" placeholder="Ex : Ahmed">
              <span class="form-erreur" *ngIf="inv('prenom')">Le prénom est obligatoire</span>
            </div>
          </div>
          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Adresse email</label>
              <input class="form-input" type="email" formControlName="email" [class.invalide]="inv('email')" placeholder="ahmed.benali@grpo.tn">
              <span class="form-erreur" *ngIf="inv('email')">Format email invalide</span>
            </div>
            <div class="form-champ">
              <label class="form-label">Numéro de téléphone</label>
              <input class="form-input" formControlName="telephone" placeholder="+21612345678">
              <span class="form-aide">Format : +216 suivi de 8 chiffres</span>
            </div>
          </div>
        </div>

        <div class="form-corps" style="padding-top:0;">
          <div class="form-titre-section">🪪 Permis de conduire</div>
          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Numéro de permis</label>
              <input class="form-input" formControlName="numeroPerm" placeholder="Ex : 12345678"
                     style="font-family:monospace;letter-spacing:.04em">
            </div>
            <div class="form-champ">
              <label class="form-label">Date d'expiration du permis</label>
              <input class="form-input" type="date" formControlName="dateExpirationPerm">
              <span class="form-aide">Une alerte apparaîtra si le permis expire dans moins de 30 jours</span>
            </div>
          </div>
          <div class="form-champ" style="margin-top:14px;">
            <label class="form-label">Disponibilité actuelle</label>
            <select class="form-select" formControlName="disponible">
              <option [value]="true">✅ Disponible — peut être affecté à une tournée</option>
              <option [value]="false">🔴 Non disponible — en congé, maladie ou déjà affecté</option>
            </select>
          </div>
        </div>

      </form>
    </div>

    <div class="dialog-pied">
      <span style="font-size:12px;color:#94a3b8;margin-right:auto"><span style="color:#dc2626">*</span> Champs obligatoires</span>
      <button class="btn-secondaire" mat-dialog-close><mat-icon>close</mat-icon> Annuler</button>
      <button class="btn-primaire" (click)="enregistrer()" [disabled]="formulaire.invalid || enregistrement">
        <mat-spinner *ngIf="enregistrement" diameter="16" style="margin-right:6px"></mat-spinner>
        <mat-icon *ngIf="!enregistrement">{{ estModification ? 'save' : 'person_add' }}</mat-icon>
        {{ enregistrement ? 'Enregistrement...' : (estModification ? 'Enregistrer les modifications' : 'Ajouter le chauffeur') }}
      </button>
    </div>
  `,
  styles: [`.form-aide{font-size:11.5px;color:#94a3b8;margin-top:3px;}`]
})
export class ChauffeurFormDialogComponent implements OnInit {
  formulaire: FormGroup;
  estModification = false;
  enregistrement = false;

  constructor(
    private fb: FormBuilder, private svc: ChauffeurService, private snack: MatSnackBar,
    public dialogRef: MatDialogRef<ChauffeurFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { chauffeur?: Chauffeur }
  ) {
    this.formulaire = this.fb.group({
      nom:                  ['', Validators.required],
      prenom:               ['', Validators.required],
      email:                ['', Validators.email],
      telephone:            [''],
      numeroPerm:           [''],
      dateExpirationPerm:   [''],
      disponible:           [true]
    });
  }

  ngOnInit(): void {
    if (this.data?.chauffeur) {
      this.estModification = true;
      this.formulaire.patchValue(this.data.chauffeur);
    }
  }

  inv(c: string): boolean { const f = this.formulaire.get(c); return !!(f && f.invalid && (f.dirty || f.touched)); }

  enregistrer(): void {
    if (this.formulaire.invalid) { this.formulaire.markAllAsTouched(); return; }
    this.enregistrement = true;
    const val = { ...this.formulaire.value, disponible: this.formulaire.value.disponible === 'true' || this.formulaire.value.disponible === true };
    const obs = this.estModification ? this.svc.update(this.data.chauffeur!.id!, val) : this.svc.create(val);
    obs.subscribe({
      next: () => { this.snack.open(this.estModification ? '✅ Chauffeur modifié' : '✅ Chauffeur ajouté', 'Fermer', { duration: 3500 }); this.dialogRef.close(true); },
      error: () => { this.enregistrement = false; this.snack.open('❌ Erreur lors de l\'enregistrement', 'Fermer', { duration: 4000 }); }
    });
  }
}
