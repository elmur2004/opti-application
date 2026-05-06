import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_STATUSES, UpdateOrderDto, type OrderStatus } from './dto/update-order.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post('orders')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Get('orders/my')
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.mine(user.id);
  }

  @Get('orders/:id')
  async one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const order = await this.orders.one(id);
    if (!order) throw new NotFoundException();
    if (user.role === 'CUSTOMER' && order.userId !== user.id) {
      throw new NotFoundException();
    }
    if (user.role === 'STORE_ADMIN' && order.storeId !== user.storeId) {
      throw new NotFoundException();
    }
    return order;
  }

  @UseGuards(RolesGuard)
  @Roles('STORE_ADMIN', 'SUPER_ADMIN')
  @Get('admin/orders')
  admin(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    if (status !== undefined && !(ORDER_STATUSES as readonly string[]).includes(status)) {
      throw new BadRequestException(
        `status must be one of: ${ORDER_STATUSES.join(', ')}`,
      );
    }
    return this.orders.forAdmin(user, status as OrderStatus | undefined);
  }

  @UseGuards(RolesGuard)
  @Roles('STORE_ADMIN', 'SUPER_ADMIN')
  @Patch('admin/orders/:id')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.orders.updateStatus(user, id, dto.status);
  }

  @UseGuards(RolesGuard)
  @Roles('STORE_ADMIN', 'SUPER_ADMIN')
  @Post('admin/orders/:id/mark-paid')
  markPaid(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.updateStatus(user, id, 'PAID');
  }
}
