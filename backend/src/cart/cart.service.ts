import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async ensure(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async get(userId: string) {
    const cart = await this.ensure(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
      orderBy: { id: 'asc' },
    });
    const total = items.reduce((s, i) => s + i.quantity * i.product.price, 0);
    return { id: cart.id, items, total };
  }

  async add(userId: string, dto: AddToCartDto) {
    const cart = await this.ensure(userId);
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Prevent multi-store carts up front so the user gets immediate feedback
    // rather than discovering the conflict only at checkout.
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id },
      include: { product: { select: { storeId: true } } },
    });
    if (existing && existing.product.storeId !== product.storeId) {
      throw new BadRequestException(
        'Your cart already contains items from another store. Clear it first to switch stores.',
      );
    }

    const qty = dto.quantity ?? 1;

    // Enforce stock against the cumulative qty already in cart for this product.
    const currentInCart = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });
    const totalRequested = (currentInCart?.quantity ?? 0) + qty;
    if (totalRequested > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} of "${product.name}" in stock; you have ${currentInCart?.quantity ?? 0} in cart and tried to add ${qty}.`,
      );
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      update: { quantity: { increment: qty } },
      create: { cartId: cart.id, productId: dto.productId, quantity: qty },
    });

    return this.get(userId);
  }

  async setQuantity(userId: string, productId: string, quantity: number) {
    const cart = await this.ensure(userId);
    if (quantity === 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
      return this.get(userId);
    }
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} of "${product.name}" in stock.`,
      );
    }
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!existing) {
      throw new NotFoundException('Item not in cart');
    }
    await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });
    return this.get(userId);
  }

  async remove(userId: string, productId: string) {
    const cart = await this.ensure(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
    return this.get(userId);
  }

  async clear(userId: string) {
    const cart = await this.ensure(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.get(userId);
  }
}
