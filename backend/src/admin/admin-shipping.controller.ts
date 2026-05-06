import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const trimCity = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

class CreateShippingRuleDto {
  @Transform(trimCity)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[^\r\n\t]+$/, { message: 'city must not contain line breaks or tabs' })
  city!: string;

  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsString() storeId?: string; // SUPER_ADMIN only
}

class UpdateShippingRuleDto {
  @IsOptional()
  @Transform(trimCity)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[^\r\n\t]+$/, { message: 'city must not contain line breaks or tabs' })
  city?: string;

  @IsOptional() @IsNumber() @Min(0) price?: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STORE_ADMIN', 'SUPER_ADMIN')
@Controller('admin/shipping-rules')
export class AdminShippingController {
  constructor(private prisma: PrismaService) {}

  private resolveStoreId(user: AuthUser, requested?: string): string {
    if (user.role === 'SUPER_ADMIN') {
      if (!requested) throw new ForbiddenException('storeId required');
      return requested;
    }
    if (!user.storeId) throw new ForbiddenException();
    if (requested && requested !== user.storeId) throw new ForbiddenException();
    return user.storeId;
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const where = user.role === 'SUPER_ADMIN' ? {} : { storeId: user.storeId ?? '__none__' };
    return this.prisma.shippingRule.findMany({ where, orderBy: { city: 'asc' } });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateShippingRuleDto) {
    const storeId = this.resolveStoreId(user, dto.storeId);
    return this.prisma.shippingRule.upsert({
      where: { storeId_city: { storeId, city: dto.city } },
      update: { price: dto.price },
      create: { storeId, city: dto.city, price: dto.price },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateShippingRuleDto,
  ) {
    const rule = await this.prisma.shippingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && rule.storeId !== user.storeId) {
      throw new ForbiddenException();
    }
    return this.prisma.shippingRule.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const rule = await this.prisma.shippingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && rule.storeId !== user.storeId) {
      throw new ForbiddenException();
    }
    await this.prisma.shippingRule.delete({ where: { id } });
    return { ok: true };
  }
}
