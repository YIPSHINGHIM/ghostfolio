import {
  ExpenseCategoryResponse,
  ExpenseResponse
} from '@ghostfolio/common/interfaces';
import { DataService } from '@ghostfolio/ui/services';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { GfCreateOrUpdateExpenseDialogComponent } from './create-or-update-expense-dialog.component';

(global as any).$localize = (
  messageParts: TemplateStringsArray,
  ...expressions: any[]
) => {
  return String.raw({ raw: messageParts }, ...expressions);
};

jest.mock('@angular/localize', () => {
  return {};
});

describe('GfCreateOrUpdateExpenseDialogComponent', () => {
  const createdAt = new Date('2026-06-01');
  const updatedAt = new Date('2026-06-01');
  const categories: ExpenseCategoryResponse[] = [
    { color: '#0055aa', createdAt, id: 'category-1', name: 'Food', updatedAt }
  ];

  let component: GfCreateOrUpdateExpenseDialogComponent;
  let dataService: jest.Mocked<Pick<DataService, 'createExpense' | 'updateExpense'>>;
  let dialogRef: jest.Mocked<
    Pick<MatDialogRef<GfCreateOrUpdateExpenseDialogComponent>, 'close'>
  >;
  let fixture: ComponentFixture<GfCreateOrUpdateExpenseDialogComponent>;

  beforeEach(async () => {
    dataService = {
      createExpense: jest
        .fn()
        .mockReturnValue(of({ id: 'expense-1' } as ExpenseResponse)),
      updateExpense: jest
        .fn()
        .mockReturnValue(of({ id: 'expense-1' } as ExpenseResponse))
    };
    dialogRef = { close: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [
        GfCreateOrUpdateExpenseDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { categories } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GfCreateOrUpdateExpenseDialogComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  });

  it('creates an expense and closes with refresh', async () => {
    component.expenseForm.setValue({
      accountId: '',
      amount: 25,
      categoryId: 'category-1',
      comment: 'Lunch',
      currency: 'USD',
      date: '2026-06-15',
      merchant: 'Cafe'
    });

    component.onSubmit();
    await fixture.whenStable();

    expect(dataService.createExpense).toHaveBeenCalledWith({
      amount: 25,
      categoryId: 'category-1',
      comment: 'Lunch',
      currency: 'USD',
      date: '2026-06-15',
      merchant: 'Cafe'
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ refresh: true });
  });
});
