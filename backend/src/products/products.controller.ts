import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class ProductsController {
  constructor(private prisma: PrismaService) {}

  @Get('stores/:storeId/products')
  async byStore(@Param('storeId') storeId: string, @Query('search') search?: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        ...(search ? { name: { contains: search } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => this.shape(p));
  }

  @Get('products/:id')
  async one(@Param('id') id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { assets: true, store: true },
    });
    if (!product) throw new NotFoundException();
    return this.shape(product);
  }

  @Get('products/:id/assets')
  async assets(@Param('id') id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { assets: true },
    });
    if (!product) throw new NotFoundException();

    const angles: Record<string, string> = {};
    for (const a of product.assets) angles[a.angle] = a.imageUrl;
    return {
      productId: product.id,
      angles,
      tryOnConfig: this.parseTryOnConfig(product.tryOnConfig),
    };
  }

  private shape(p: any) {
    return { ...p, tryOnConfig: this.parseTryOnConfig(p.tryOnConfig) };
  }

  private parseTryOnConfig(s: string | null | undefined) {
    if (!s) return {};
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }
}
