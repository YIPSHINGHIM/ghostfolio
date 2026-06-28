import { Account, Tag } from '@prisma/client';

import { ExpenseCategoryResponse } from './expense-category-response.interface';

export interface ExpenseResponse {
  account?: Account;
  accountId?: string;
  amount: number;
  category?: ExpenseCategoryResponse;
  categoryId?: string;
  comment?: string;
  createdAt: Date;
  currency: string;
  date: Date;
  id: string;
  merchant?: string;
  tags: Tag[];
  updatedAt: Date;
}

export interface ExpensesResponse {
  count: number;
  expenses: ExpenseResponse[];
}
