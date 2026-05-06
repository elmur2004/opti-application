import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stores/:storeId/shipping')
export class ShippingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Param('storeId') storeId: string) {
    return this.prisma.shippingRule.findMany({
      where: { storeId },
      orderBy: { city: 'asc' },
    });
  }

  @Get('quote')
  async quote(@Param('storeId') storeId: string, @Query('city') city: string) {
    const rule = await this.prisma.shippingRule.findUnique({
      where: { storeId_city: { storeId, city } },
    });
    return { city, price: rule?.price ?? 50, isDefault: !rule };
  }
}
