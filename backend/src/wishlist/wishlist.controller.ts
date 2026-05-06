import { Body, Controller, Delete, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class WishlistDto {
  @IsString()
  productId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { id: 'desc' },
    });
  }

  @Post('add')
  async add(@CurrentUser() user: AuthUser, @Body() dto: WishlistDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId: dto.productId } },
      update: {},
      create: { userId: user.id, productId: dto.productId },
    });
    return this.list(user);
  }

  @Delete(':productId')
  async remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    await this.prisma.wishlistItem.deleteMany({
      where: { userId: user.id, productId },
    });
    return this.list(user);
  }
}
