import {
  ExpenseCategoryResponse,
  ExpenseResponse,
  ExpensesResponse
} from '@ghostfolio/common/interfaces';
import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';

import { GfCreateOrUpdateExpenseDialogComponent } from './create-or-update-expense-dialog/create-or-update-expense-dialog.component';

@Component({
  host: { class: 'page' },
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
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
  public from = '';
  public isLoading = true;
  public totalCount = 0;
  public to = '';

  public constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dataService: DataService,
    private readonly destroyRef: DestroyRef,
    private readonly dialog: MatDialog
  ) {
    addIcons({ addOutline, createOutline, trashOutline });
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
        from: this.from || undefined,
        to: this.to || undefined
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
      });
  }
}
