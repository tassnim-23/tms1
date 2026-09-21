import { NgModule }           from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule }     from '@angular/forms';
import { HttpClientModule }   from '@angular/common/http';

// Angular Material
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatSnackBarModule }        from '@angular/material/snack-bar';
import { MatDialogModule }          from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatAutocompleteModule }    from '@angular/material/autocomplete';
import { MatChipsModule }           from '@angular/material/chips';
import { MatBadgeModule }           from '@angular/material/badge';
import { MatMenuModule }            from '@angular/material/menu';
import { MatCardModule }            from '@angular/material/card';
import { MatDividerModule }         from '@angular/material/divider';
import { DragDropModule }           from '@angular/cdk/drag-drop';

// Composants
import { CommandeListComponent }         from './components/commande-list/commande-list.component';
import { CommandeFormComponent }         from './components/commande-form/commande-form.component';
import { CommandeDetailComponent }       from './components/commande-detail/commande-detail.component';
import { CommandeDeleteDialogComponent } from './components/commande-delete-dialog/commande-delete-dialog.component';
import { CommandeKanbanComponent }       from './components/commande-kanban/commande-kanban.component';

// Routing
import { CommandesRoutingModule } from './commandes-routing.module';

@NgModule({
  declarations: [
    CommandeListComponent,
    CommandeFormComponent,
    CommandeDetailComponent,
    CommandeDeleteDialogComponent,
    CommandeKanbanComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommandesRoutingModule,
    DecimalPipe,
    SlicePipe,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    DragDropModule,
  ],
})
export class CommandesModule {}