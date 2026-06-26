import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';

import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  const createdAt = new Date('2026-06-01T00:00:00.000Z');
  const updatedAt = new Date('2026-06-02T00:00:00.000Z');
  const userId = 'user-1';

  let prismaService: {
    account: { findFirst: jest.Mock };
    expense: {
      count: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    expenseCategory: { findFirst: jest.Mock };
    tag: { count: jest.Mock };
  };
  let service: ExpensesService;

  beforeEach(async () => {
    prismaService = {
      account: { findFirst: jest.fn() },
      expense: {
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn()
      },
      expenseCategory: { findFirst: jest.fn() },
      tag: { count: jest.fn() }
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prismaService }
      ]
    }).compile();

    service = moduleRef.get(ExpensesService);
  });

  it('lists paginated expenses for the current user', async () => {
    prismaService.expense.findMany.mockResolvedValue([
      {
        account: { id: 'account-1', name: 'Checking' },
        accountId: 'account-1',
        amount: 25,
        category: {
          color: '#0055aa',
          createdAt,
          id: 'category-1',
          name: 'Food',
          updatedAt
        },
        categoryId: 'category-1',
        comment: 'Lunch',
        createdAt,
        currency: 'USD',
        date: new Date('2026-06-15T00:00:00.000Z'),
        id: 'expense-1',
        merchant: 'Cafe',
        tags: [],
        updatedAt,
        userId
      }
    ]);
    prismaService.expense.count.mockResolvedValue(1);

    await expect(
      service.getExpenses({ skip: 0, take: 25, userId })
    ).resolves.toEqual({
      count: 1,
      expenses: [
        expect.objectContaining({
          accountId: 'account-1',
          amount: 25,
          categoryId: 'category-1',
          id: 'expense-1',
          merchant: 'Cafe'
        })
      ]
    });

    expect(prismaService.expense.findMany).toHaveBeenCalledWith({
      include: { account: true, category: true, tags: true },
      orderBy: { date: 'desc' },
      skip: 0,
      take: 25,
      where: { userId }
    });
    expect(prismaService.expense.count).toHaveBeenCalledWith({
      where: { userId }
    });
  });

  it('filters expenses by date range and category', async () => {
    prismaService.expense.findMany.mockResolvedValue([]);
    prismaService.expense.count.mockResolvedValue(0);

    await service.getExpenses({
      categoryId: 'category-1',
      from: '2026-06-01',
      skip: 0,
      take: 25,
      to: '2026-06-30',
      userId
    });

    expect(prismaService.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'category-1',
          date: {
            gte: new Date('2026-06-01T00:00:00.000Z'),
            lte: new Date('2026-06-30T23:59:59.999Z')
          },
          userId
        }
      })
    );
  });

  it('creates an expense with optional account category and tags', async () => {
    prismaService.account.findFirst.mockResolvedValue({
      id: 'account-1',
      userId
    });
    prismaService.expenseCategory.findFirst.mockResolvedValue({
      id: 'category-1',
      userId
    });
    prismaService.tag.count.mockResolvedValue(2);
    prismaService.expense.create.mockResolvedValue({
      account: { id: 'account-1', name: 'Checking' },
      accountId: 'account-1',
      amount: 42,
      category: {
        color: '#0055aa',
        createdAt,
        id: 'category-1',
        name: 'Food',
        updatedAt
      },
      categoryId: 'category-1',
      comment: 'Dinner',
      createdAt,
      currency: 'USD',
      date: new Date('2026-06-20T00:00:00.000Z'),
      id: 'expense-1',
      merchant: 'Restaurant',
      tags: [
        { id: 'tag-1', name: 'Travel' },
        { id: 'tag-2', name: 'Card' }
      ],
      updatedAt,
      userId
    });

    await service.createExpense({
      data: {
        accountId: 'account-1',
        amount: 42,
        categoryId: 'category-1',
        comment: 'Dinner',
        currency: 'USD',
        date: '2026-06-20',
        merchant: 'Restaurant',
        tagIds: ['tag-1', 'tag-2']
      },
      userId
    });

    expect(prismaService.expense.create).toHaveBeenCalledWith({
      data: {
        account: { connect: { id_userId: { id: 'account-1', userId } } },
        amount: 42,
        category: { connect: { id: 'category-1' } },
        comment: 'Dinner',
        currency: 'USD',
        date: new Date('2026-06-20T00:00:00.000Z'),
        merchant: 'Restaurant',
        tags: { connect: [{ id: 'tag-1' }, { id: 'tag-2' }] },
        user: { connect: { id: userId } }
      },
      include: { account: true, category: true, tags: true }
    });
  });

  it('rejects an account not owned by the current user', async () => {
    prismaService.account.findFirst.mockResolvedValue(null);

    await expect(
      service.createExpense({
        data: {
          accountId: 'account-2',
          amount: 42,
          currency: 'USD',
          date: '2026-06-20'
        },
        userId
      })
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates only an expense owned by the current user', async () => {
    prismaService.expense.findFirst.mockResolvedValue({
      id: 'expense-1',
      userId
    });
    prismaService.expense.update.mockResolvedValue({
      account: null,
      accountId: null,
      amount: 50,
      category: null,
      categoryId: null,
      comment: null,
      createdAt,
      currency: 'USD',
      date: new Date('2026-06-21T00:00:00.000Z'),
      id: 'expense-1',
      merchant: 'Market',
      tags: [],
      updatedAt,
      userId
    });

    await service.updateExpense({
      data: {
        amount: 50,
        currency: 'USD',
        date: '2026-06-21',
        id: 'expense-1',
        merchant: 'Market'
      },
      id: 'expense-1',
      userId
    });

    expect(prismaService.expense.update).toHaveBeenCalledWith({
      data: {
        account: { disconnect: true },
        amount: 50,
        category: { disconnect: true },
        comment: undefined,
        currency: 'USD',
        date: new Date('2026-06-21T00:00:00.000Z'),
        merchant: 'Market',
        tags: { set: [] }
      },
      include: { account: true, category: true, tags: true },
      where: { id: 'expense-1' }
    });
  });

  it('deletes only an expense owned by the current user', async () => {
    prismaService.expense.findFirst.mockResolvedValue({
      id: 'expense-1',
      userId
    });
    prismaService.expense.delete.mockResolvedValue({ id: 'expense-1' });

    await service.deleteExpense({ id: 'expense-1', userId });

    expect(prismaService.expense.delete).toHaveBeenCalledWith({
      where: { id: 'expense-1' }
    });
  });
});
