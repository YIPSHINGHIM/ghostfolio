import { CreateExpenseDto, UpdateExpenseDto } from '@ghostfolio/common/dtos';
import {
  ExpenseCategoryResponse,
  ExpenseResponse
} from '@ghostfolio/common/interfaces';
import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface DialogData {
  categories: ExpenseCategoryResponse[];
  expense?: ExpenseResponse;
}

@Component({
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  selector: 'gf-create-or-update-expense-dialog',
  styleUrls: ['./create-or-update-expense-dialog.scss'],
  templateUrl: './create-or-update-expense-dialog.html'
})
export class GfCreateOrUpdateExpenseDialogComponent {
  public expenseForm = new FormGroup({
    accountId: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    categoryId: new FormControl<string>('', { nonNullable: true }),
    comment: new FormControl<string>('', { nonNullable: true }),
    currency: new FormControl<string>('USD', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date: new FormControl<string>(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required]
    }),
    merchant: new FormControl<string>('', { nonNullable: true })
  });

  public constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly dataService: DataService,
    private readonly dialogRef: MatDialogRef<GfCreateOrUpdateExpenseDialogComponent>
  ) {
    if (data.expense) {
      this.expenseForm.patchValue({
        accountId: data.expense.accountId ?? '',
        amount: data.expense.amount,
        categoryId: data.expense.categoryId ?? '',
        comment: data.expense.comment ?? '',
        currency: data.expense.currency,
        date: new Date(data.expense.date).toISOString().slice(0, 10),
        merchant: data.expense.merchant ?? ''
      });
    }
  }

  public onCancel() {
    this.dialogRef.close();
  }

  public onSubmit() {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();

    if (this.data.expense) {
      this.dataService
        .updateExpense({
          expense: { ...payload, id: this.data.expense.id } as UpdateExpenseDto,
          id: this.data.expense.id
        })
        .subscribe(() => this.dialogRef.close({ refresh: true }));
    } else {
      this.dataService
        .createExpense(payload)
        .subscribe(() => this.dialogRef.close({ refresh: true }));
    }
  }

  private toPayload(): CreateExpenseDto {
    const value = this.expenseForm.getRawValue();

    return {
      ...(value.accountId ? { accountId: value.accountId } : {}),
      amount: value.amount,
      ...(value.categoryId ? { categoryId: value.categoryId } : {}),
      ...(value.comment ? { comment: value.comment } : {}),
      currency: value.currency,
      date: value.date,
      ...(value.merchant ? { merchant: value.merchant } : {})
    };
  }
}
