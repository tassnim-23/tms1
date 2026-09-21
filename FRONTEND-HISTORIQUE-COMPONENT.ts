// ✅ FRONTEND - HistoriqueComponent
// Fichier: tms-frontend/tms-frontend/src/app/modules/client-dashboard/components/historique/historique.component.ts

import { Component, OnInit } from '@angular/core';
import { HistoriqueService } from '../../../../core/services/historique.service';
import { Historique } from '../../../../core/models/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit {

  historique: Historique[] = [];
  loading = true;
  filterType: 'ALL' | 'COMMANDE' | 'FACTURE' = 'ALL';
  displayedColumns: string[] = ['reference', 'dateCreation', 'type', 'statut', 'montant'];

  constructor(
    private historiqueService: HistoriqueService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadHistorique();
  }

  /**
   * Charger l'historique
   */
  loadHistorique(): void {
    this.loading = true;

    const service$ = this.filterType === 'ALL'
      ? this.historiqueService.getHistorique()
      : this.historiqueService.getHistoriqueByType(
          this.filterType as 'COMMANDE' | 'FACTURE'
        );

    service$.subscribe(
      (data: Historique[]) => {
        this.historique = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur chargement historique:', error);
        this.snackBar.open('Erreur lors du chargement de l\'historique', 'Fermer', {
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
   * Filtrer par type
   */
  filterByType(type: 'ALL' | 'COMMANDE' | 'FACTURE'): void {
    this.filterType = type;
    this.loadHistorique();
  }

  /**
   * Télécharger l'historique en PDF
   */
  downloadPdf(): void {
    this.historiqueService.downloadHistoriquePdf().subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historique.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      (error) => {
        console.error('Erreur téléchargement PDF:', error);
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    );
  }

  /**
   * Télécharger l'historique en CSV
   */
  downloadCsv(): void {
    this.historiqueService.downloadHistoriqueCsv().subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historique.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      (error) => {
        console.error('Erreur téléchargement CSV:', error);
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    );
  }

  /**
   * Formater la date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtenir couleur du statut
   */
  getStatusColor(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'warn';
      case 'EN_COURS':
      case 'PAYEE':
        return 'accent';
      case 'LIVREE':
      case 'COMPLETE':
        return 'primary';
      default:
        return '';
    }
  }

  /**
   * Obtenir icône du type
   */
  getTypeIcon(type: string): string {
    return type === 'COMMANDE' ? 'shopping_cart' : 'receipt';
  }
}
