import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from '@ghostfolio/common/dtos';
import {
  ExpenseResponse,
  ExpensesResponse
} from '@ghostfolio/common/interfaces';

import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Account, ExpenseCategory, Tag } from '@prisma/client';

type SortDirection = 'asc' | 'desc';

@Injectable()
export class ExpensesService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async createExpense({
    data,
    userId
  }: {
    data: CreateExpenseDto;
    userId: string;
  }): Promise<ExpenseResponse> {
    await this.validateExpenseRelations({ data, userId });

    const expense = await this.prismaService.expense.create({
      data: this.toExpenseCreateData({ data, userId }),
      include: { account: true, category: true, tags: true }
    });

    return this.toExpenseResponse(expense);
  }

  public async deleteExpense({ id, userId }: { id: string; userId: string }) {
    await this.validateExpenseOwnership({ id, userId });

    return this.prismaService.expense.delete({ where: { id } });
  }

  public async getExpense({
    id,
    userId
  }: {
    id: string;
    userId: string;
  }): Promise<ExpenseResponse> {
    const expense = await this.prismaService.expense.findFirst({
      include: { account: true, category: true, tags: true },
      where: { id, userId }
    });

    if (!expense) {
      throw new ForbiddenException();
    }

    return this.toExpenseResponse(expense);
  }

  public async getExpenses({
    categoryId,
    from,
    skip = 0,
    sortColumn = 'date',
    sortDirection = 'desc',
    take = 50,
    to,
    userId
  }: {
    categoryId?: string;
    from?: string;
    skip?: number;
    sortColumn?: string;
    sortDirection?: SortDirection;
    take?: number;
    to?: string;
    userId: string;
  }): Promise<ExpensesResponse> {
    const where = this.buildExpenseWhere({ categoryId, from, to, userId });
    const orderBy = { [sortColumn]: sortDirection };

    const [expenses, count] = await Promise.all([
      this.prismaService.expense.findMany({
        include: { account: true, category: true, tags: true },
        orderBy,
        skip,
        take,
        where
      }),
      this.prismaService.expense.count({ where })
    ]);

    return {
      count,
      expenses: expenses.map((expense) => this.toExpenseResponse(expense))
    };
  }

  public async updateExpense({
    data,
    id,
    userId
  }: {
    data: UpdateExpenseDto;
    id: string;
    userId: string;
  }): Promise<ExpenseResponse> {
    await this.validateExpenseOwnership({ id, userId });
    await this.validateExpenseRelations({ data, userId });

    const expense = await this.prismaService.expense.update({
      data: this.toExpenseUpdateData({ data, userId }),
      include: { account: true, category: true, tags: true },
      where: { id }
    });

    return this.toExpenseResponse(expense);
  }

  private buildExpenseWhere({
    categoryId,
    from,
    to,
    userId
  }: {
    categoryId?: string;
    from?: string;
    to?: string;
    userId: string;
  }) {
    return {
      ...(categoryId ? { categoryId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {})
            }
          }
        : {}),
      userId
    };
  }

  private toExpenseCreateData({
    data,
    userId
  }: {
    data: CreateExpenseDto;
    userId: string;
  }) {
    return {
      ...(data.accountId
        ? {
            account: {
              connect: { id_userId: { id: data.accountId, userId } }
            }
          }
        : {}),
      amount: data.amount,
      ...(data.categoryId
        ? { category: { connect: { id: data.categoryId } } }
        : {}),
      comment: data.comment,
      currency: data.currency,
      date: new Date(`${data.date}T00:00:00.000Z`),
      merchant: data.merchant,
      ...(data.tagIds?.length
        ? { tags: { connect: data.tagIds.map((id) => ({ id })) } }
        : {}),
      user: { connect: { id: userId } }
    };
  }

  private toExpenseResponse({
    account,
    accountId,
    amount,
    category,
    categoryId,
    comment,
    createdAt,
    currency,
    date,
    id,
    merchant,
    tags,
    updatedAt
  }: {
    account?: Account | null;
    accountId?: string | null;
    amount: number;
    category?: ExpenseCategory | null;
    categoryId?: string | null;
    comment?: string | null;
    createdAt: Date;
    currency: string;
    date: Date;
    id: string;
    merchant?: string | null;
    tags: Tag[];
    updatedAt: Date;
  }): ExpenseResponse {
    return {
      account: account ?? undefined,
      accountId: accountId ?? undefined,
      amount,
      category: category ?? undefined,
      categoryId: categoryId ?? undefined,
      comment: comment ?? undefined,
      createdAt,
      currency,
      date,
      id,
      merchant: merchant ?? undefined,
      tags,
      updatedAt
    };
  }

  private toExpenseUpdateData({
    data,
    userId
  }: {
    data: UpdateExpenseDto;
    userId: string;
  }) {
    return {
      account: data.accountId
        ? { connect: { id_userId: { id: data.accountId, userId } } }
        : { disconnect: true },
      amount: data.amount,
      category: data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true },
      comment: data.comment,
      currency: data.currency,
      date: new Date(`${data.date}T00:00:00.000Z`),
      merchant: data.merchant,
      tags: { set: data.tagIds?.map((id) => ({ id })) ?? [] }
    };
  }

  private async validateExpenseOwnership({
    id,
    userId
  }: {
    id: string;
    userId: string;
  }) {
    const expense = await this.prismaService.expense.findFirst({
      where: { id, userId }
    });

    if (!expense) {
      throw new ForbiddenException();
    }
  }

  private async validateExpenseRelations({
    data,
    userId
  }: {
    data: CreateExpenseDto;
    userId: string;
  }) {
    if (data.accountId) {
      const account = await this.prismaService.account.findFirst({
        where: { id: data.accountId, userId }
      });

      if (!account) {
        throw new ForbiddenException();
      }
    }

    if (data.categoryId) {
      const category = await this.prismaService.expenseCategory.findFirst({
        where: { id: data.categoryId, userId }
      });

      if (!category) {
        throw new ForbiddenException();
      }
    }

    if (data.tagIds?.length) {
      const tagCount = await this.prismaService.tag.count({
        where: { id: { in: data.tagIds }, userId }
      });

      if (tagCount !== data.tagIds.length) {
        throw new ForbiddenException();
      }
    }
  }
}
