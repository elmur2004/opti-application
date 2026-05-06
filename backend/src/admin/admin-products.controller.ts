import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminProductsService } from './admin-products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SetAssetDto } from './dto/set-asset.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STORE_ADMIN', 'SUPER_ADMIN')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private svc: AdminProductsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.svc.list(user);
  }

  @Get(':id')
  one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.one(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.svc.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.svc.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(user, id);
  }

  @Put(':id/assets')
  setAsset(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetAssetDto,
  ) {
    return this.svc.setAsset(user, id, dto);
  }

  @Delete(':id/assets/:angle')
  deleteAsset(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('angle') angle: string,
  ) {
    return this.svc.deleteAsset(user, id, angle);
  }
}
