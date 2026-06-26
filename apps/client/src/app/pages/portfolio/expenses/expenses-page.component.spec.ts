import {
  ExpenseCategoryResponse,
  ExpensesResponse
} from '@ghostfolio/common/interfaces';
import { DataService } from '@ghostfolio/ui/services';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { GfExpensesPageComponent } from './expenses-page.component';

(global as any).$localize = (
  messageParts: TemplateStringsArray,
  ...expressions: any[]
) => {
  return String.raw({ raw: messageParts }, ...expressions);
};

jest.mock('@angular/localize', () => {
  return {};
});

jest.mock('@ionic/angular/standalone', () => {
  const { Component, Input } = require('@angular/core');

  @Component({
    selector: 'ion-icon',
    template: ''
  })
  class IonIcon {
    @Input() public name: string;
  }

  return { IonIcon };
});

jest.mock('ionicons', () => {
  return {
    addIcons: jest.fn()
  };
});

jest.mock('ionicons/icons', () => {
  return {
    addOutline: {},
    createOutline: {},
    trashOutline: {}
  };
});

describe('GfExpensesPageComponent', () => {
  const createdAt = new Date('2026-06-01');
  const updatedAt = new Date('2026-06-01');
  const categories: ExpenseCategoryResponse[] = [
    { color: '#0055aa', createdAt, id: 'category-1', name: 'Food', updatedAt }
  ];
  const expensesResponse: ExpensesResponse = {
    count: 1,
    expenses: [
      {
        accountId: 'account-1',
        amount: 25,
        category: categories[0],
        categoryId: 'category-1',
        comment: 'Lunch',
        createdAt,
        currency: 'USD',
        date: new Date('2026-06-15'),
        id: 'expense-1',
        merchant: 'Cafe',
        tags: [],
        updatedAt
      }
    ]
  };

  let dataService: jest.Mocked<
    Pick<DataService, 'deleteExpense' | 'fetchExpenseCategories' | 'fetchExpenses'>
  >;
  let dialog: jest.Mocked<Pick<MatDialog, 'open'>>;
  let fixture: ComponentFixture<GfExpensesPageComponent>;

  beforeEach(async () => {
    dataService = {
      deleteExpense: jest.fn().mockReturnValue(of(undefined)),
      fetchExpenseCategories: jest.fn().mockReturnValue(of(categories)),
      fetchExpenses: jest.fn().mockReturnValue(of(expensesResponse))
    };
    dialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of({ refresh: true })
      })
    };

    await TestBed.configureTestingModule({
      imports: [GfExpensesPageComponent, NoopAnimationsModule],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: MatDialog, useValue: dialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GfExpensesPageComponent);
    fixture.autoDetectChanges();
  });

  it('loads and renders expenses', async () => {
    await fixture.whenStable();

    expect(dataService.fetchExpenseCategories).toHaveBeenCalled();
    expect(dataService.fetchExpenses).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Cafe');
    expect(fixture.nativeElement.textContent).toContain('Food');
    expect(fixture.nativeElement.textContent).toContain('25.00 USD');
  });

  it('reloads expenses after deleting an expense', async () => {
    await fixture.whenStable();

    fixture.componentInstance.onDeleteExpense('expense-1');
    await fixture.whenStable();

    expect(dataService.deleteExpense).toHaveBeenCalledWith('expense-1');
    expect(dataService.fetchExpenses).toHaveBeenCalledTimes(2);
  });

  it('opens the expense dialog and refreshes after close', async () => {
    await fixture.whenStable();

    fixture.componentInstance.onCreateExpense();
    await fixture.whenStable();

    expect(dialog.open).toHaveBeenCalled();
    expect(dataService.fetchExpenses).toHaveBeenCalledTimes(2);
  });
});
