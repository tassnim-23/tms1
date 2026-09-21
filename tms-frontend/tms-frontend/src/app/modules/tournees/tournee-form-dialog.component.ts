import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TourneeService, ChauffeurService, VehiculeService, CommandeService } from '../../core/services/crud.services';
import { Tournee, Chauffeur, Vehicule, Commande } from '../../core/models/models';

@Component({
  selector: 'app-tournee-form-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isEdit ? 'edit' : 'add_road' }}</mat-icon>
      {{ isEdit ? 'Modifier la Tournée' : 'Nouvelle Tournée' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">

        <!-- DATE ET HEURES -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date de la tournée *</mat-label>
          <input matInput formControlName="dateTournee" type="date" [min]="today">
          <mat-error>Obligatoire</mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Heure de début</mat-label>
            <input matInput formControlName="heureDebut" type="time">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Heure de fin estimée</mat-label>
            <input matInput formControlName="heureFin" type="time">
          </mat-form-field>
        </div>

        <!-- CHAUFFEUR -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chauffeur *</mat-label>
          <mat-select formControlName="chauffeurId">
            <mat-option *ngIf="chauffeurs.length === 0" disabled>Chargement...</mat-option>
            <mat-option *ngFor="let c of chauffeurs" [value]="c.id">
              <span [style.color]="c.disponible ? '#27AE60' : '#E74C3C'">●</span>
              {{ c.prenom }} {{ c.nom }} {{ c.disponible ? '(disponible)' : '(indisponible)' }}
            </mat-option>
          </mat-select>
          <mat-error>Obligatoire</mat-error>
        </mat-form-field>

        <!-- VEHICULE -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Véhicule *</mat-label>
          <mat-select formControlName="vehiculeId">
            <mat-option *ngIf="vehicules.length === 0" disabled>Chargement...</mat-option>
            <mat-option *ngFor="let v of vehicules" [value]="v.id">
              {{ v.immatriculation }} — {{ v.marque }} {{ v.modele }}
              <span style="color:#27AE60" *ngIf="v.statut === 'DISPONIBLE'"> (disponible)</span>
              <span style="color:#E74C3C" *ngIf="v.statut !== 'DISPONIBLE'"> ({{ v.statut }})</span>
            </mat-option>
          </mat-select>
          <mat-error>Obligatoire</mat-error>
        </mat-form-field>

        <!-- COMMANDES -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Commandes à livrer</mat-label>
          <mat-select formControlName="commandeIds" multiple>
            <mat-option *ngIf="commandes.length === 0" disabled>Aucune commande disponible</mat-option>
            <mat-option *ngFor="let c of commandes" [value]="c.id">
              {{ c.numeroCommande }} — {{ c.adresseLivraison | slice:0:40 }} ({{ c.poids || 0 }} kg)
            </mat-option>
          </mat-select>
          <mat-hint>Sélectionnez les commandes à inclure dans cette tournée</mat-hint>
        </mat-form-field>

        <!-- DISTANCE -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Distance totale (km)</mat-label>
          <input matInput formControlName="distanceTotale" type="number" min="0">
          <span matSuffix>km</span>
        </mat-form-field>

        <!-- STATUT -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Statut</mat-label>
          <mat-select formControlName="statut">
            <mat-option value="PLANIFIEE">📅 Planifiée</mat-option>
            <mat-option value="EN_COURS">🚛 En cours</mat-option>
            <mat-option value="TERMINEE">✅ Terminée</mat-option>
          </mat-select>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close><mat-icon>close</mat-icon> Annuler</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        <mat-spinner *ngIf="saving" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
        <mat-icon *ngIf="!saving">{{ isEdit ? 'save' : 'add' }}</mat-icon>
        {{ isEdit ? 'Modifier' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 560px; max-height: 70vh; }
    .full-width { width: 100%; }
    .form-row { display: flex; gap: 16px; width: 100%; }
    .form-row mat-form-field { flex: 1; }
    .form-grid { display: flex; flex-direction: column; gap: 4px; }
  `]
})
export class TourneeFormDialogComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  saving = false;
  chauffeurs: Chauffeur[] = [];
  vehicules: Vehicule[] = [];
  commandes: Commande[] = [];
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private tourneeService: TourneeService,
    private chauffeurService: ChauffeurService,
    private vehiculeService: VehiculeService,
    private commandeService: CommandeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TourneeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tournee?: Tournee }
  ) {
    this.form = this.fb.group({
      dateTournee:    ['', Validators.required],
      heureDebut:     ['07:00'],
      heureFin:       ['17:00'],
      chauffeurId:    [null, Validators.required],
      vehiculeId:     [null, Validators.required],
      commandeIds:    [[]],
      distanceTotale: [null],
      statut:         ['PLANIFIEE']
    });
  }

  ngOnInit(): void {
    // Charger chauffeurs, véhicules et commandes en parallèle
    this.chauffeurService.getAll(0, 100).subscribe({ next: d => this.chauffeurs = d.content });
    this.vehiculeService.getAll(0, 100).subscribe({ next: d => this.vehicules = d.content });
    this.commandeService.getAll(0, 100, 'EN_ATTENTE').subscribe({ next: d => this.commandes = d.content });

    if (this.data?.tournee) {
      this.isEdit = true;
      this.form.patchValue(this.data.tournee);
      // Si en édition, charger aussi les commandes ASSIGNEE
      this.commandeService.getAll(0, 100, 'ASSIGNEE').subscribe({
        next: d => this.commandes = [...this.commandes, ...d.content]
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.isEdit
      ? this.tourneeService.update(this.data.tournee!.id!, this.form.value)
      : this.tourneeService.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`✅ Tournée ${this.isEdit ? 'modifiée' : 'créée'}`, 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('❌ ' + (err?.error?.message || 'Erreur'), 'OK', { duration: 5000, panelClass: 'snack-error' });
      }
    });
  }
}
