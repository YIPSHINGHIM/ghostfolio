import { BudgetsModule } from '@ghostfolio/api/app/budgets/budgets.module';
import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  controllers: [ExpenseCategoriesController, ExpensesController],
  imports: [BudgetsModule, PrismaModule],
  providers: [ExpensesService]
})
export class ExpensesModule {}
