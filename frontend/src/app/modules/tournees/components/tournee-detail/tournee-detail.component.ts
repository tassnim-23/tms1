import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { TourneeService } from '../../services/tournee.service';
import { Tournee, STATUT_TOURNEE_CONFIG } from '../../models/tournee.model';
import { TourneeDeleteDialogComponent } from '../tournee-delete-dialog/tournee-delete-dialog.component';

@Component({
  selector: 'app-tournee-detail',
  templateUrl: './tournee-detail.component.html',
  styleUrls: ['./tournee-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourneeDetailComponent implements OnInit {

  tournee?: Tournee;
  loading = true;
  statutConfig = STATUT_TOURNEE_CONFIG;

  private destroy$ = new Subject<void>();

  constructor(
    private svc: TourneeService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['id']) this.charger(+p['id']);
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  charger(id: number): void {
    this.loading = true;
    this.svc.getTournee(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: t => { this.tournee = t; this.loading = false; this.cd.markForCheck(); },
      error: () => { this.loading = false; this.router.navigate(['/tournees']); }
    });
  }

  modifier(): void {
    this.router.navigate(['/tournees', this.tournee!.id, 'edit']);
  }

  supprimer(): void {
    const ref = this.dialog.open(TourneeDeleteDialogComponent, {
      data: this.tournee, width: '440px'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.deleteTournee(this.tournee!.id).subscribe({
        next: () => {
          this.snack.open('Tournée supprimée', '✓', { duration: 3000 });
          this.router.navigate(['/tournees']);
        },
        error: (e) => this.snack.open(e?.error?.message || 'Erreur suppression', 'Fermer', { duration: 5000 })
      });
    });
  }

  retour(): void { this.router.navigate(['/tournees']); }

  getStatutConfig(s: any) { return this.statutConfig[s as keyof typeof this.statutConfig] || this.statutConfig.PLANIFIEE; }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
}
