import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  controllers: [BudgetsController],
  exports: [BudgetsService],
  imports: [PrismaModule],
  providers: [BudgetsService]
})
export class BudgetsModule {}
