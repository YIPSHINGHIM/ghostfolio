import { BudgetsModule } from '@ghostfolio/api/app/budgets/budgets.module';
import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { ExpenseCategoriesController } from './expense-categories.controller';

@Module({
  controllers: [ExpenseCategoriesController],
  imports: [BudgetsModule, PrismaModule]
})
export class ExpensesModule {}
