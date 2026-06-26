import { BudgetsService } from '@ghostfolio/api/app/budgets/budgets.service';
import { HasPermission } from '@ghostfolio/api/decorators/has-permission.decorator';
import { HasPermissionGuard } from '@ghostfolio/api/guards/has-permission.guard';
import { JwtOrApiKeyAuthGuard } from '@ghostfolio/api/guards/jwt-or-api-key-auth.guard';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto
} from '@ghostfolio/common/dtos';
import { ExpenseCategoryResponse } from '@ghostfolio/common/interfaces';
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
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Controller('expense-categories')
export class ExpenseCategoriesController {
  public constructor(
    private readonly budgetsService: BudgetsService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) {}

  @Post()
  @HasPermission(permissions.createExpenseCategory)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async createCategory(
    @Body() data: CreateExpenseCategoryDto
  ): Promise<ExpenseCategoryResponse> {
    return this.budgetsService.createCategory({
      data,
      userId: this.request.user.id
    });
  }

  @Delete(':id')
  @HasPermission(permissions.deleteExpenseCategory)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async deleteCategory(@Param('id') id: string) {
    return this.budgetsService.deleteCategory({
      id,
      userId: this.request.user.id
    });
  }

  @Get()
  @HasPermission(permissions.readExpenseCategories)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async getCategories(): Promise<ExpenseCategoryResponse[]> {
    return this.budgetsService.getCategories({
      userId: this.request.user.id
    });
  }

  @Put(':id')
  @HasPermission(permissions.updateExpenseCategory)
  @UseGuards(JwtOrApiKeyAuthGuard, HasPermissionGuard)
  public async updateCategory(
    @Param('id') id: string,
    @Body() data: UpdateExpenseCategoryDto
  ): Promise<ExpenseCategoryResponse> {
    return this.budgetsService.updateCategory({
      data,
      id,
      userId: this.request.user.id
    });
  }
}
