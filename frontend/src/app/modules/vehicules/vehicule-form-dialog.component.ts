import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VehiculeService } from '../../core/services/crud.services';
import { Vehicule } from '../../core/models/models';

@Component({
  selector: 'app-vehicule-form-dialog',
  template: `
    <div class="dialog-en-tete">
      <h2>
        <mat-icon>{{ estModification ? 'edit' : 'add' }}</mat-icon>
        {{ estModification ? 'Modifier le véhicule' : 'Ajouter un véhicule' }}
      </h2>
      <button class="btn-icone" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <div mat-dialog-content style="max-height:70vh;overflow-y:auto;padding:0;">
      <form [formGroup]="formulaire">

        <div class="form-corps">
          <div class="form-titre-section">🚛 Identification du véhicule</div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Numéro d'immatriculation <span class="requis">*</span></label>
              <input class="form-input" formControlName="immatriculation"
                     [class.invalide]="inv('immatriculation')"
                     placeholder="Ex : TU-123-AB"
                     style="font-family:monospace;letter-spacing:.08em;text-transform:uppercase">
              <span class="form-erreur" *ngIf="inv('immatriculation')">L'immatriculation est obligatoire</span>
            </div>
            <div class="form-champ">
              <label class="form-label">Type de véhicule <span class="requis">*</span></label>
              <select class="form-select" formControlName="type">
                <option value="CAMION">🚛 Camion (poids lourd)</option>
                <option value="FOURGON">🚐 Fourgon (utilitaire)</option>
                <option value="VOITURE">🚗 Voiture légère</option>
                <option value="MOTO">🏍️ Moto / Scooter</option>
              </select>
            </div>
          </div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Marque</label>
              <input class="form-input" formControlName="marque" placeholder="Ex : Mercedes, Renault, Iveco">
            </div>
            <div class="form-champ">
              <label class="form-label">Modèle</label>
              <input class="form-input" formControlName="modele" placeholder="Ex : Actros, Master, Daily">
            </div>
          </div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Année de mise en service</label>
              <input class="form-input" type="number" formControlName="annee"
                     [min]="1990" [max]="anneeMax"
                     placeholder="Ex : 2020">
            </div>
            <div class="form-champ">
              <label class="form-label">Capacité de charge (kg)</label>
              <input class="form-input" type="number" formControlName="capacite"
                     min="0" placeholder="Ex : 10000">
              <span class="form-aide">Poids maximum que peut transporter le véhicule</span>
            </div>
          </div>
        </div>

        <div class="form-corps" style="padding-top:0;">
          <div class="form-titre-section">📋 État et disponibilité</div>
          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">État du véhicule</label>
              <select class="form-select" formControlName="etat">
                <option value="BON">✅ En bon état — opérationnel</option>
                <option value="MAINTENANCE">🔧 En maintenance — indisponible temporairement</option>
                <option value="HORS_SERVICE">❌ Hors service — ne peut pas circuler</option>
              </select>
            </div>
            <div class="form-champ">
              <label class="form-label">Disponibilité pour les tournées</label>
              <select class="form-select" formControlName="disponible">
                <option [value]="true">✅ Disponible — peut être affecté</option>
                <option [value]="false">🔴 Non disponible — déjà affecté ou en panne</option>
              </select>
            </div>
          </div>
        </div>

      </form>
    </div>

    <div class="dialog-pied">
      <span style="font-size:12px;color:#94a3b8;margin-right:auto"><span style="color:#dc2626">*</span> Champs obligatoires</span>
      <button class="btn-secondaire" mat-dialog-close><mat-icon>close</mat-icon> Annuler</button>
      <button class="btn-primaire" (click)="enregistrer()" [disabled]="formulaire.invalid || enregistrement">
        <mat-spinner *ngIf="enregistrement" diameter="16" style="margin-right:6px"></mat-spinner>
        <mat-icon *ngIf="!enregistrement">{{ estModification ? 'save' : 'add' }}</mat-icon>
        {{ enregistrement ? 'Enregistrement...' : (estModification ? 'Enregistrer les modifications' : 'Ajouter le véhicule') }}
      </button>
    </div>
  `,
  styles: [`.form-aide{font-size:11.5px;color:#94a3b8;margin-top:3px;}`]
})
export class VehiculeFormDialogComponent implements OnInit {
  formulaire: FormGroup;
  estModification = false;
  enregistrement = false;
  anneeMax = new Date().getFullYear() + 1;

  constructor(
    private fb: FormBuilder, private svc: VehiculeService, private snack: MatSnackBar,
    public dialogRef: MatDialogRef<VehiculeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vehicule?: Vehicule }
  ) {
    this.formulaire = this.fb.group({
      immatriculation: ['', Validators.required],
      type:            ['CAMION'],
      marque:          [''],
      modele:          [''],
      annee:           [null],
      capacite:        [null],
      etat:            ['BON'],
      disponible:      [true]
    });
  }

  ngOnInit(): void {
    if (this.data?.vehicule) {
      this.estModification = true;
      this.formulaire.patchValue(this.data.vehicule);
    }
  }

  inv(c: string): boolean { const f = this.formulaire.get(c); return !!(f && f.invalid && (f.dirty || f.touched)); }

  enregistrer(): void {
    if (this.formulaire.invalid) { this.formulaire.markAllAsTouched(); return; }
    this.enregistrement = true;
    const val = { ...this.formulaire.value, disponible: this.formulaire.value.disponible === 'true' || this.formulaire.value.disponible === true };
    const obs = this.estModification ? this.svc.update(this.data.vehicule!.id!, val) : this.svc.create(val);
    obs.subscribe({
      next: () => { this.snack.open(this.estModification ? '✅ Véhicule modifié' : '✅ Véhicule ajouté', 'Fermer', { duration: 3500 }); this.dialogRef.close(true); },
      error: () => { this.enregistrement = false; this.snack.open('❌ Erreur lors de l\'enregistrement', 'Fermer', { duration: 4000 }); }
    });
  }
}
