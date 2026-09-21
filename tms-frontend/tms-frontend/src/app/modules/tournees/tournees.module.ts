import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule }         from '@angular/router';
import { OptimisationComponent } from './components/optimisation/optimisation.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatDialogModule }          from '@angular/material/dialog';
import { MatSnackBarModule }        from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatCardModule }            from '@angular/material/card';
import { MatDividerModule }         from '@angular/material/divider';

import { TourneeListComponent }         from './components/tournee-list/tournee-list.component';
import { TourneeFormComponent }         from './components/tournee-form/tournee-form.component';
import { TourneeDetailComponent }       from './components/tournee-detail/tournee-detail.component';
import { TourneeDeleteDialogComponent } from './components/tournee-delete-dialog/tournee-delete-dialog.component';
import { TourneesRoutingModule }        from './tournees-routing.module';

@NgModule({
  declarations: [
    TourneeListComponent,
    TourneeFormComponent,
    TourneeDetailComponent,
    OptimisationComponent,
    TourneeDeleteDialogComponent,
    
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule,
    TourneesRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatDividerModule,
  ],
})
export class TourneesModule {}
