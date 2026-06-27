import {
  ExpenseCategoryResponse,
  ExpenseResponse,
  ExpensesResponse
} from '@ghostfolio/common/interfaces';
import { GfFabComponent } from '@ghostfolio/ui/fab';
import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { addIcons } from 'ionicons';
import {
  calendarClearOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';

import { GfCreateOrUpdateExpenseDialogComponent } from './create-or-update-expense-dialog/create-or-update-expense-dialog.component';

@Component({
  host: { class: 'page' },
  imports: [
    CommonModule,
    FormsModule,
    GfFabComponent,
    IonIcon,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    RouterModule
  ],
  selector: 'gf-expenses-page',
  styleUrls: ['./expenses-page.scss'],
  templateUrl: './expenses-page.html'
})
export class GfExpensesPageComponent implements OnInit {
  public categories: ExpenseCategoryResponse[] = [];
  public categoryId = '';
  public dataSource = new MatTableDataSource<ExpenseResponse>([]);
  public displayedColumns = [
    'date',
    'merchant',
    'category',
    'amount',
    'currency',
    'comment',
    'actions'
  ];
  public from: Date | null = null;
  public isLoading = true;
  public totalCount = 0;
  public to: Date | null = null;

  public constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dataService: DataService,
    private readonly destroyRef: DestroyRef,
    private readonly dialog: MatDialog,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    addIcons({
      calendarClearOutline,
      createOutline,
      trashOutline
    });

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['createDialog']) {
          this.openExpenseDialog();
        }
      });
  }

  public ngOnInit() {
    this.loadCategories();
    this.loadExpenses();
  }

  public formatAmount({ amount, currency }: ExpenseResponse) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  public onApplyFilters() {
    this.loadExpenses();
  }

  public onCreateExpense() {
    this.openExpenseDialog();
  }

  public onSelectCurrentMonth() {
    const today = new Date();

    this.from = startOfMonth(today);
    this.to = endOfMonth(today);
  }

  public onDeleteExpense(id: string) {
    this.dataService
      .deleteExpense(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadExpenses();
      });
  }

  public onEditExpense(expense: ExpenseResponse) {
    this.openExpenseDialog(expense);
  }

  private loadCategories() {
    this.dataService
      .fetchExpenseCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categories = categories;
        this.changeDetectorRef.markForCheck();
      });
  }

  private loadExpenses() {
    this.isLoading = true;

    this.dataService
      .fetchExpenses({
        categoryId: this.categoryId || undefined,
        from: this.formatFilterDate(this.from),
        to: this.formatFilterDate(this.to)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ count, expenses }: ExpensesResponse) => {
        this.dataSource = new MatTableDataSource(expenses);
        this.isLoading = false;
        this.totalCount = count;
        this.changeDetectorRef.markForCheck();
      });
  }

  private openExpenseDialog(expense?: ExpenseResponse) {
    this.dialog
      .open(GfCreateOrUpdateExpenseDialogComponent, {
        data: {
          categories: this.categories,
          expense
        },
        width: '36rem'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: { refresh?: boolean }) => {
        if (result?.refresh) {
          this.loadExpenses();
        }

        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }

  private formatFilterDate(date: Date | null) {
    return date ? format(date, 'yyyy-MM-dd') : undefined;
  }
}
