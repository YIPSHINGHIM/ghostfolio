import { HasPermission } from '@ghostfolio/api/decorators/has-permission.decorator';
import { HasPermissionGuard } from '@ghostfolio/api/guards/has-permission.guard';
import { JwtOrApiKeyAuthGuard } from '@ghostfolio/api/guards/jwt-or-api-key-auth.guard';
import { CreateExpenseDto, UpdateExpenseDto } from '@ghostfolio/common/dtos';
import {
  ExpenseResponse,
  ExpensesResponse
} from '@ghostfolio/common/interfaces';
import { permissions } from '@ghostfolio/common/permissions';
import { RequestWithUser } from '@ghostfolio/common/types';

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  public constructor(
    private readonly expensesService: ExpensesService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) {}

  @Post()
  @HasPermission(permissions.createExpense)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async createExpense(
    @Body() data: CreateExpenseDto
  ): Promise<ExpenseResponse> {
    return this.expensesService.createExpense({
      data,
      userId: this.request.user.id
    });
  }

  @Delete(':id')
  @HasPermission(permissions.deleteExpense)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async deleteExpense(@Param('id') id: string) {
    return this.expensesService.deleteExpense({
      id,
      userId: this.request.user.id
    });
  }

  @Get()
  @HasPermission(permissions.readExpenses)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async getExpenses(
    @Query('categoryId') categoryId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('skip') skip = '0',
    @Query('sortColumn') sortColumn = 'date',
    @Query('sortDirection') sortDirection: 'asc' | 'desc' = 'desc',
    @Query('take') take = '50',
    @Query('to') to: string | undefined
  ): Promise<ExpensesResponse> {
    return this.expensesService.getExpenses({
      categoryId,
      from,
      skip: Number(skip),
      sortColumn,
      sortDirection,
      take: Number(take),
      to,
      userId: this.request.user.id
    });
  }

  @Get(':id')
  @HasPermission(permissions.readExpenses)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async getExpense(@Param('id') id: string): Promise<ExpenseResponse> {
    return this.expensesService.getExpense({
      id,
      userId: this.request.user.id
    });
  }

  @Put(':id')
  @HasPermission(permissions.updateExpense)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async updateExpense(
    @Param('id') id: string,
    @Body() data: UpdateExpenseDto
  ): Promise<ExpenseResponse> {
    return this.expensesService.updateExpense({
      data,
      id,
      userId: this.request.user.id
    });
  }
}
