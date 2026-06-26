import {
  CreateBudgetDto,
  CreateExpenseCategoryDto,
  UpdateBudgetDto,
  UpdateExpenseCategoryDto
} from '@ghostfolio/common/dtos';

import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';

describe('DataService budget methods', () => {
  let dataService: DataService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });

    dataService = TestBed.inject(DataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('fetches budgets for a month', () => {
    dataService.fetchBudgets({ month: '2026-06' }).subscribe();

    const request = httpTestingController.expectOne(
      '/api/v1/budgets?month=2026-06'
    );

    expect(request.request.method).toBe('GET');
  });

  it('creates a budget', () => {
    const budget: CreateBudgetDto = {
      accountId: 'account-1',
      amount: 500,
      categoryId: 'category-1',
      currency: 'USD',
      month: '2026-06',
      name: 'Groceries',
      type: 'EXPENSE'
    };

    dataService.createBudget(budget).subscribe();

    const request = httpTestingController.expectOne('/api/v1/budgets');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(budget);
  });

  it('updates a budget', () => {
    const budget: UpdateBudgetDto = {
      amount: 650,
      categoryId: 'category-1',
      currency: 'USD',
      id: 'budget-1',
      month: '2026-06',
      name: 'Groceries',
      type: 'EXPENSE'
    };

    dataService.updateBudget({ budget, id: 'budget-1' }).subscribe();

    const request = httpTestingController.expectOne('/api/v1/budgets/budget-1');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(budget);
  });

  it('fetches expense categories', () => {
    dataService.fetchExpenseCategories().subscribe();

    const request = httpTestingController.expectOne(
      '/api/v1/expense-categories'
    );

    expect(request.request.method).toBe('GET');
  });

  it('fetches expenses with filters', () => {
    dataService
      .fetchExpenses({
        categoryId: 'category-1',
        from: '2026-06-01',
        skip: 25,
        sortColumn: 'amount',
        sortDirection: 'asc',
        take: 25,
        to: '2026-06-30'
      })
      .subscribe();

    const request = httpTestingController.expectOne((req) => {
      return req.url === '/api/v1/expenses';
    });

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('categoryId')).toEqual('category-1');
    expect(request.request.params.get('from')).toEqual('2026-06-01');
    expect(request.request.params.get('skip')).toEqual('25');
    expect(request.request.params.get('sortColumn')).toEqual('amount');
    expect(request.request.params.get('sortDirection')).toEqual('asc');
    expect(request.request.params.get('take')).toEqual('25');
    expect(request.request.params.get('to')).toEqual('2026-06-30');
  });

  it('creates an expense category', () => {
    const category: CreateExpenseCategoryDto = {
      color: '#0055aa',
      name: 'Groceries'
    };

    dataService.createExpenseCategory(category).subscribe();

    const request = httpTestingController.expectOne(
      '/api/v1/expense-categories'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(category);
  });

  it('updates an expense category', () => {
    const category: UpdateExpenseCategoryDto = {
      color: '#aa5500',
      id: 'category-1',
      name: 'Food'
    };

    dataService
      .updateExpenseCategory({ category, id: 'category-1' })
      .subscribe();

    const request = httpTestingController.expectOne(
      '/api/v1/expense-categories/category-1'
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(category);
  });

  it('deletes an expense category', () => {
    dataService.deleteExpenseCategory('category-1').subscribe();

    const request = httpTestingController.expectOne(
      '/api/v1/expense-categories/category-1'
    );

    expect(request.request.method).toBe('DELETE');
  });

  it('deletes a budget', () => {
    dataService.deleteBudget('budget-1').subscribe();

    const request = httpTestingController.expectOne('/api/v1/budgets/budget-1');

    expect(request.request.method).toBe('DELETE');
  });
});
