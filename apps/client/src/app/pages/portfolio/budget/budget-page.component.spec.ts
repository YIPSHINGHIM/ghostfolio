import { DataService } from '@ghostfolio/ui/services';

import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { format, startOfMonth } from 'date-fns';
import { of, Subject } from 'rxjs';

(global as any).$localize = (
  messageParts: TemplateStringsArray,
  ...expressions: any[]
) => {
  return String.raw({ raw: messageParts }, ...expressions);
};

jest.mock('@angular/localize', () => {
  return {};
});

jest.mock('@ghostfolio/client/services/user/user.service', () => {
  return {
    UserService: class UserService {}
  };
});

jest.mock('@ghostfolio/ui/value', () => {
  const { Component, Input } = require('@angular/core');

  @Component({
    selector: 'gf-value',
    template: '{{ value }}'
  })
  class GfValueComponent {
    @Input() public isCurrency = false;
    @Input() public locale: string;
    @Input() public unit: string;
    @Input() public value: number;
  }

  return { GfValueComponent };
});

jest.mock('@ghostfolio/ui/fab', () => {
  const { Component, Input } = require('@angular/core');

  @Component({
    selector: 'gf-fab',
    template: '<button class="mock-fab"></button>'
  })
  class GfFabComponent {
    @Input() public queryParams: Record<string, unknown>;
  }

  return { GfFabComponent };
});

jest.mock('@ionic/angular/standalone', () => {
  const { Component, Input } = require('@angular/core');

  @Component({
    // eslint-disable-next-line @angular-eslint/component-selector
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
    calendarClearOutline: {},
    createOutline: {},
    trashOutline: {}
  };
});

const {
  UserService
} = require('@ghostfolio/client/services/user/user.service');
const { GfBudgetPageComponent } = require('./budget-page.component');

describe('GfBudgetPageComponent', () => {
  let dataService: jest.Mocked<
    Pick<DataService, 'deleteBudget' | 'fetchBudgets'>
  >;
  let dialog: jest.Mocked<Pick<MatDialog, 'open'>>;
  let fixture: ComponentFixture<GfBudgetPageComponent>;
  let queryParams: Subject<Params>;

  beforeEach(async () => {
    queryParams = new Subject<Params>();
    dataService = {
      deleteBudget: jest.fn().mockReturnValue(of(undefined)),
      fetchBudgets: jest.fn().mockReturnValue(
        of({
          budgets: [
            {
              account: {
                balance: 0,
                createdAt: new Date('2026-06-01'),
                id: 'checking',
                isExcluded: false,
                name: 'Checking',
                updatedAt: new Date('2026-06-01'),
                userId: 'user-1'
              },
              accountId: 'checking',
              amount: 500,
              category: {
                id: 'food',
                name: 'Food'
              },
              categoryId: 'food',
              createdAt: new Date('2026-06-01'),
              currency: 'USD',
              id: 'budget-1',
              month: '2026-06',
              name: 'Food shop',
              remaining: 125,
              spent: 375,
              type: 'EXPENSE',
              updatedAt: new Date('2026-06-01')
            }
          ],
          totalBudgeted: 500,
          totalMonthlySavings: 0,
          totalPlannedSpend: 500,
          totalRemaining: 125,
          totalSpent: 375
        })
      )
    };
    dialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of({ refresh: true })
      })
    };

    await TestBed.configureTestingModule({
      imports: [GfBudgetPageComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideNativeDateAdapter(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams.asObservable()
          }
        },
        {
          provide: DataService,
          useValue: dataService
        },
        {
          provide: MatDialog,
          useValue: dialog
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        },
        {
          provide: UserService,
          useValue: {
            stateChanged: of({
              user: {
                permissions: [],
                settings: {
                  baseCurrency: 'USD',
                  locale: 'en-US'
                }
              }
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GfBudgetPageComponent);
    fixture.autoDetectChanges();
  });

  it('loads and renders budgets for the selected month', async () => {
    await fixture.whenStable();

    expect(dataService.fetchBudgets).toHaveBeenCalledWith({
      month: expect.stringMatching(/^\d{4}-\d{2}$/)
    });
    expect(fixture.nativeElement.textContent).toContain('Budget');
    expect(fixture.nativeElement.textContent).toContain('Food shop');
    expect(fixture.nativeElement.textContent).toContain('Food');
    expect(fixture.nativeElement.textContent).toContain('Checking');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Edit budget"] ion-icon')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Delete budget"] ion-icon'
      )
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('editdelete');
  });

  it('reloads budgets after creating a budget', async () => {
    await fixture.whenStable();

    fixture.componentInstance.onCreateBudget();
    await fixture.whenStable();

    expect(dialog.open).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(expect.any(Function), {
      data: {
        currency: 'USD',
        month: format(fixture.componentInstance.monthControl.value, 'yyyy-MM')
      },
      width: '32rem'
    });
    expect(dataService.fetchBudgets).toHaveBeenCalledTimes(2);
  });

  it('uses the material month picker controls and current month action', async () => {
    await fixture.whenStable();

    dataService.fetchBudgets.mockClear();
    fixture.componentInstance.monthControl.setValue(new Date('2026-05-18'));
    await fixture.whenStable();

    expect(dataService.fetchBudgets).toHaveBeenCalledWith({
      month: '2026-05'
    });
    expect(
      fixture.nativeElement.querySelector('mat-form-field')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[matDatepickerToggleIcon]')
    ).not.toBeNull();

    fixture.componentInstance.onSelectCurrentMonth();

    expect(
      format(fixture.componentInstance.monthControl.value, 'yyyy-MM-dd')
    ).toEqual(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  });

  it('opens the create dialog from the createDialog query param', async () => {
    dialog.open.mockClear();
    queryParams.next({ createDialog: 'true' });
    await fixture.whenStable();

    expect(dialog.open).toHaveBeenCalledWith(expect.any(Function), {
      data: {
        currency: 'USD',
        month: format(fixture.componentInstance.monthControl.value, 'yyyy-MM')
      },
      width: '32rem'
    });
  });

  it('renders the create budget fab and mobile budget list', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('gf-fab')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.budget-mobile-list')
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('125');
  });

  it('keeps desktop icon buttons on the material icon-button layout', async () => {
    await fixture.whenStable();

    const desktopActionButtons = fixture.nativeElement.querySelectorAll(
      '.budget-table [mat-icon-button]'
    );

    expect(desktopActionButtons).toHaveLength(2);
    desktopActionButtons.forEach((button: HTMLButtonElement) => {
      expect(button.classList.contains('budget-action-button')).toBe(false);
    });
  });

  it('deletes a budget and reloads the month', async () => {
    await fixture.whenStable();

    fixture.componentInstance.onDeleteBudget('budget-1');
    await fixture.whenStable();

    expect(dataService.deleteBudget).toHaveBeenCalledWith('budget-1');
    expect(dataService.fetchBudgets).toHaveBeenCalledTimes(2);
  });

  it('opens the category management dialog', async () => {
    await fixture.whenStable();

    fixture.componentInstance.onManageCategories();
    await fixture.whenStable();

    expect(dialog.open).toHaveBeenCalledWith(expect.any(Function), {
      maxWidth: 'calc(100vw - 2rem)',
      width: '42rem'
    });
  });
});
