// ✅ FRONTEND - CommandesComponent (NOUVEAU - Créer nouvelles commandes)
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/components/commandes/commandes.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommandesService } from '../../../../core/services/commandes.service';
import { Commande } from '../../../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-commandes',
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.scss']
})
export class CommandesComponent implements OnInit {

  // Créer nouvelle commande
  createForm: FormGroup;
  typesTransport: string[] = [];
  showCreateForm = false;
  creatingCommande = false;

  // Historique des commandes
  mesCommandes: Commande[] = [];
  loadingCommandes = true;
  displayedColumns: string[] = ['reference', 'origine', 'destination', 'dateDepart', 'type', 'statut', 'actions'];

  constructor(
    private fb: FormBuilder,
    private commandesService: CommandesService,
    private snackBar: MatSnackBar
  ) {
    this.createForm = this.fb.group({
      origine: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', [Validators.required, Validators.minLength(3)]],
      dateDepart: ['', Validators.required],
      type: ['', Validators.required],
      poids: ['', [Validators.required, Validators.min(0.1)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadMesCommandes();
    this.loadTransportTypes();
  }

  /**
   * Charger mes commandes
   */
  loadMesCommandes(): void {
    this.loadingCommandes = true;
    this.commandesService.getMesCommandes().subscribe(
      (data: Commande[]) => {
        this.mesCommandes = data;
        this.loadingCommandes = false;
      },
      (error) => {
        console.error('Erreur chargement commandes:', error);
        this.snackBar.open('Erreur lors du chargement des commandes', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
        this.loadingCommandes = false;
      }
    );
  }

  /**
   * Charger types de transport
   */
  loadTransportTypes(): void {
    this.commandesService.getTransportTypes().subscribe(
      (types: string[]) => {
        this.typesTransport = types;
      },
      (error) => {
        console.error('Erreur chargement types:', error);
      }
    );
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.createForm.reset();
    this.showCreateForm = false;
  }

  /**
   * Créer une nouvelle commande
   */
  creerCommande(): void {
    if (this.createForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', {
        duration: 5000
      });
      return;
    }

    this.creatingCommande = true;

    const commande: Commande = {
      ...this.createForm.value,
      dateDepart: new Date(this.createForm.value.dateDepart)
    };

    this.commandesService.creerCommande(commande).subscribe(
      (response: Commande) => {
        this.snackBar.open('Commande créée avec succès! Référence: ' + response.reference, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.creatingCommande = false;
        this.resetForm();
        this.loadMesCommandes();  // Recharger la liste
      },
      (error) => {
        console.error('Erreur création commande:', error);
        this.snackBar.open('Erreur lors de la création de la commande', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
        this.creatingCommande = false;
      }
    );
  }

  /**
   * Voir détail d'une commande
   */
  voirDetail(commande: Commande): void {
    console.log('Détail commande:', commande);
    // Implémentation: router vers détail commande ou ouvrir modal
  }

  /**
   * Formater la date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  /**
   * Obtenir couleur du statut
   */
  getStatusColor(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'warn';
      case 'EN_COURS':
        return 'accent';
      case 'LIVREE':
        return 'primary';
      default:
        return '';
    }
  }
}
