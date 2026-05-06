import { Controller, ForbiddenException, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STORE_ADMIN', 'SUPER_ADMIN')
@Controller('admin/me')
export class AdminStoresController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() user: AuthUser) {
    if (user.role === 'SUPER_ADMIN') {
      return { user, store: null };
    }
    if (!user.storeId) throw new ForbiddenException('No store assigned');
    const store = await this.prisma.store.findUnique({ where: { id: user.storeId } });
    if (!store) throw new NotFoundException('Store not found');
    return { user, store };
  }
}
