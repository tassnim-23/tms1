// ✅ FRONTEND - MonProfilComponent
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/components/mon-profil/mon-profil.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientProfileService } from '../../../../core/services/client-profile.service';
import { ClientProfile } from '../../../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-mon-profil',
  templateUrl: './mon-profil.component.html',
  styleUrls: ['./mon-profil.component.scss']
})
export class MonProfilComponent implements OnInit {

  profilForm: FormGroup;
  loading = true;
  updating = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ClientProfileService,
    private snackBar: MatSnackBar
  ) {
    this.profilForm = this.fb.group({
      raisonSociale: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9\s+\-()]*$/)]],
      matriculeFiscale: ['', Validators.required],
      adresseComplete: ['', [Validators.required, Validators.minLength(10)]],
      activite: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * Charger le profil
   */
  loadProfile(): void {
    this.loading = true;
    this.profileService.getMyProfile().subscribe(
      (data: ClientProfile) => {
        this.profilForm.patchValue(data);
        this.loading = false;
      },
      (error) => {
        console.error('Erreur chargement profil:', error);
        this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    );
  }

  /**
   * Sauvegarder le profil
   */
  saveProfil(): void {
    if (this.profilForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs correctement', 'Fermer', {
        duration: 5000
      });
      return;
    }

    this.updating = true;
    this.profileService.updateMyProfile(this.profilForm.value).subscribe(
      (data: ClientProfile) => {
        this.profilForm.patchValue(data);
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.updating = false;
      },
      (error) => {
        console.error('Erreur mise à jour profil:', error);
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.updating = false;
      }
    );
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.loadProfile();
  }
}
