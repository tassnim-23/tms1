// ✅ FRONTEND - FacturesComponent
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/components/factures/factures.component.ts

import { Component, OnInit } from '@angular/core';
import { FacturesService } from '../../../../core/services/factures.service';
import { Facture } from '../../../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-factures',
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.scss']
})
export class FacturesComponent implements OnInit {

  factures: Facture[] = [];
  loading = true;
  displayedColumns: string[] = ['numero', 'date', 'montant', 'statut', 'actions'];

  constructor(
    private facturesService: FacturesService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadFactures();
  }

  /**
   * Charger les factures
   */
  loadFactures(): void {
    this.loading = true;
    this.facturesService.getMesFactures().subscribe(
      (data: Facture[]) => {
        this.factures = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur chargement factures:', error);
        this.snackBar.open('Erreur lors du chargement des factures', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    );
  }

  /**
   * Télécharger une facture
   */
  telechargerFacture(facture: Facture): void {
    this.facturesService.telechargerFacture(facture.id);
    this.snackBar.open('Téléchargement en cours...', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
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
      case 'PAYEE':
        return 'accent';
      default:
        return 'primary';
    }
  }
}
