import { BudgetsService } from '@ghostfolio/api/app/budgets/budgets.service';
import { RequestWithUser } from '@ghostfolio/common/types';

import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { ExpenseCategoriesController } from './expense-categories.controller';

describe('ExpenseCategoriesController', () => {
  const userId = 'user-1';

  let budgetsService: jest.Mocked<
    Pick<
      BudgetsService,
      'createCategory' | 'deleteCategory' | 'getCategories' | 'updateCategory'
    >
  >;
  let controller: ExpenseCategoriesController;

  beforeEach(async () => {
    budgetsService = {
      createCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getCategories: jest.fn(),
      updateCategory: jest.fn()
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ExpenseCategoriesController],
      providers: [
        { provide: BudgetsService, useValue: budgetsService },
        {
          provide: REQUEST,
          useValue: { user: { id: userId } } as Partial<RequestWithUser>
        }
      ]
    }).compile();

    controller = moduleRef.get(ExpenseCategoriesController);
  });

  it('delegates category listing to BudgetsService', async () => {
    budgetsService.getCategories.mockResolvedValue([]);

    await expect(controller.getCategories()).resolves.toEqual([]);

    expect(budgetsService.getCategories).toHaveBeenCalledWith({ userId });
  });

  it('delegates category creation to BudgetsService', async () => {
    const category = {
      color: '#0055aa',
      createdAt: new Date('2026-06-01'),
      id: 'category-1',
      name: 'Food',
      updatedAt: new Date('2026-06-01')
    };
    budgetsService.createCategory.mockResolvedValue(category);

    await expect(
      controller.createCategory({ color: '#0055aa', name: 'Food' })
    ).resolves.toEqual(category);

    expect(budgetsService.createCategory).toHaveBeenCalledWith({
      data: { color: '#0055aa', name: 'Food' },
      userId
    });
  });

  it('delegates category updates to BudgetsService', async () => {
    const category = {
      color: '#aa5500',
      createdAt: new Date('2026-06-01'),
      id: 'category-1',
      name: 'Groceries',
      updatedAt: new Date('2026-06-02')
    };
    budgetsService.updateCategory.mockResolvedValue(category);

    await expect(
      controller.updateCategory('category-1', {
        color: '#aa5500',
        id: 'category-1',
        name: 'Groceries'
      })
    ).resolves.toEqual(category);

    expect(budgetsService.updateCategory).toHaveBeenCalledWith({
      data: { color: '#aa5500', id: 'category-1', name: 'Groceries' },
      id: 'category-1',
      userId
    });
  });

  it('delegates category deletion to BudgetsService', async () => {
    budgetsService.deleteCategory.mockResolvedValue(undefined);

    await controller.deleteCategory('category-1');

    expect(budgetsService.deleteCategory).toHaveBeenCalledWith({
      id: 'category-1',
      userId
    });
  });
});
