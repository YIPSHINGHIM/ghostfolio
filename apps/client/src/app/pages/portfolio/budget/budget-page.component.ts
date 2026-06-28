import { UserService } from '@ghostfolio/client/services/user/user.service';
import type { BudgetResponse, User } from '@ghostfolio/common/interfaces';
import { GfFabComponent } from '@ghostfolio/ui/fab';
import { DataService } from '@ghostfolio/ui/services';
import { GfValueComponent } from '@ghostfolio/ui/value';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerModule
} from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { format, startOfMonth } from 'date-fns';
import { addIcons } from 'ionicons';
import {
  calendarClearOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';

import { GfCreateOrUpdateBudgetDialogComponent } from './create-or-update-budget-dialog/create-or-update-budget-dialog.component';
import { GfManageBudgetCategoriesDialogComponent } from './manage-budget-categories-dialog/manage-budget-categories-dialog.component';

@Component({
  host: { class: 'page' },
  imports: [
    CommonModule,
    GfFabComponent,
    GfValueComponent,
    IonIcon,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  selector: 'gf-budget-page',
  styleUrls: ['./budget-page.scss'],
  templateUrl: './budget-page.html'
})
export class GfBudgetPageComponent implements OnInit {
  public dataSource = new MatTableDataSource<BudgetResponse>([]);
  public displayedColumns = [
    'name',
    'category',
    'account',
    'type',
    'amount',
    'spent',
    'remaining',
    'progress',
    'actions'
  ];
  public isLoading = true;
  public monthControl = new FormControl(startOfMonth(new Date()), {
    nonNullable: true
  });
  public totalBudgeted = 0;
  public totalMonthlySavings = 0;
  public totalPlannedSpend = 0;
  public totalRemaining = 0;
  public totalSpent = 0;
  public user: User;

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private destroyRef: DestroyRef,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    addIcons({ calendarClearOutline, createOutline, trashOutline });

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['createDialog']) {
          this.onCreateBudget();
        }
      });
  }

  public ngOnInit() {
    this.userService.stateChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state?.user) {
          this.user = state.user;
          this.changeDetectorRef.markForCheck();
        }
      });

    this.monthControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.fetchBudgets();
      });

    this.fetchBudgets();
  }

  public fetchBudgets() {
    this.isLoading = true;

    this.dataService
      .fetchBudgets({ month: this.getSelectedMonth() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        ({
          budgets,
          totalBudgeted,
          totalMonthlySavings,
          totalPlannedSpend,
          totalRemaining,
          totalSpent
        }) => {
          this.dataSource = new MatTableDataSource(budgets);
          this.totalBudgeted = totalBudgeted;
          this.totalMonthlySavings = totalMonthlySavings;
          this.totalPlannedSpend = totalPlannedSpend;
          this.totalRemaining = totalRemaining;
          this.totalSpent = totalSpent;
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }
      );
  }

  public getProgress({ amount, spent }: BudgetResponse) {
    if (amount <= 0) {
      return 0;
    }

    return Math.min((spent / amount) * 100, 100);
  }

  public getBudgetTypeLabel(type: BudgetResponse['type']) {
    switch (type) {
      case 'CASH_SAVINGS':
        return $localize`Cash savings`;
      case 'INVESTMENT_SAVINGS':
        return $localize`Investment savings`;
      case 'LIABILITY_AUTOMATIC':
        return $localize`Liability`;
      case 'YEARLY_EXPENSE_AUTOMATIC':
        return $localize`Yearly expense`;
      default:
        return $localize`Expense`;
    }
  }

  public onCreateBudget() {
    this.openBudgetDialog({
      currency: this.getCurrency(),
      month: this.getSelectedMonth()
    });
  }

  public onDeleteBudget(id: string) {
    this.dataService
      .deleteBudget(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.fetchBudgets();
      });
  }

  public onManageCategories() {
    this.dialog
      .open(GfManageBudgetCategoriesDialogComponent, {
        maxWidth: 'calc(100vw - 2rem)',
        width: '42rem'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  public onMonthSelected(month: Date, datepicker: MatDatepicker<Date>) {
    this.monthControl.setValue(startOfMonth(month));
    datepicker.close();
  }

  public onSelectCurrentMonth() {
    this.monthControl.setValue(startOfMonth(new Date()));
  }

  public onUpdateBudget(budget: BudgetResponse) {
    this.openBudgetDialog({
      budget,
      currency: this.getCurrency(budget.currency),
      month: this.getSelectedMonth()
    });
  }

  private getCurrency(fallback = 'USD') {
    return this.user?.settings?.baseCurrency ?? fallback;
  }

  private getSelectedMonth() {
    return format(this.monthControl.value, 'yyyy-MM');
  }

  private openBudgetDialog(data: {
    budget?: BudgetResponse;
    currency: string;
    month: string;
  }) {
    this.dialog
      .open(GfCreateOrUpdateBudgetDialogComponent, {
        data,
        width: '32rem'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.refresh) {
          this.fetchBudgets();
        }

        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }
}
