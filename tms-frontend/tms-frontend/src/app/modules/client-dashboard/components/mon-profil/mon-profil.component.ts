import { Component, OnInit } from '@angular/core';
import { ClientProfileService } from '@app/core/services/client-profile.service';
import { ClientProfile } from '@app/core/models/models';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-mon-profil',
  templateUrl: './mon-profil.component.html',
  styleUrls: ['./mon-profil.component.scss']
})
export class MonProfilComponent implements OnInit {
  
  profile: ClientProfile | null = null;
  profileForm: FormGroup;
  loading = true;
  editing = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private clientProfileService: ClientProfileService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      raisonSociale: ['', Validators.required],
      email: ['', Validators.required],
      telephone: ['', Validators.required],
      matriculeFiscale: ['', Validators.required],
      adresseComplete: ['', Validators.required],
      activite: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.clientProfileService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
        console.error(err);
      }
    });
  }

  toggleEditing(): void {
    this.editing = !this.editing;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    this.clientProfileService.updateProfile(this.profileForm.value).subscribe({
      next: (data) => {
        this.profile = data;
        this.editing = false;
        this.success = 'Profil mis à jour avec succès';
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors de la mise à jour du profil';
        console.error(err);
      }
    });
  }
}
