import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Wrap cart-read + items-delete + order-create in a transaction so two
    // concurrent /orders calls cannot both consume the same cart items.
    // We use deleteMany's count as the optimistic-lock check: whichever
    // request deletes the rows first wins; the other sees count=0 and 400s.
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const storeIds = new Set(cart.items.map((i) => i.product.storeId));
      if (storeIds.size > 1) {
        throw new BadRequestException(
          'Cart contains items from multiple stores. Place separate orders per store.',
        );
      }
      const storeId = cart.items[0].product.storeId;
      const cartItemIds = cart.items.map((i) => i.id);

      // Stock check, all inside the transaction so concurrent orders can't oversell.
      for (const item of cart.items) {
        if (item.quantity > item.product.stock) {
          throw new BadRequestException(
            `"${item.product.name}" only has ${item.product.stock} in stock (you ordered ${item.quantity}).`,
          );
        }
      }

      const deleted = await tx.cartItem.deleteMany({
        where: { id: { in: cartItemIds } },
      });
      if (deleted.count !== cart.items.length) {
        // A concurrent /orders call already consumed (some of) these items.
        throw new BadRequestException('Cart was modified concurrently. Please retry.');
      }

      // Decrement stock for each line, atomically with the order create below.
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const subtotal = cart.items.reduce(
        (s, i) => s + i.quantity * i.product.price,
        0,
      );

      const rule = await tx.shippingRule.findUnique({
        where: { storeId_city: { storeId, city: dto.shippingAddress.city } },
      });
      const shippingPrice = rule?.price ?? 50;
      const totalPrice = subtotal + shippingPrice;

      const order = await tx.order.create({
        data: {
          userId,
          storeId,
          totalPrice,
          shippingPrice,
          status: 'PENDING',
          shippingAddress: JSON.stringify(dto.shippingAddress),
          paymentUrl: `https://paymob.example/pay/${Date.now()}`,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      return this.shape(order);
    });
  }

  async mine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
    return orders.map((o) => this.shape(o));
  }

  async one(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    return order ? this.shape(order) : null;
  }

  async forAdmin(user: AuthUser, status?: string) {
    const where: { storeId?: string; status?: string } =
      user.role === 'SUPER_ADMIN' ? {} : { storeId: user.storeId ?? '__none__' };
    if (status) where.status = status;
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        user: { select: { email: true } },
      },
    });
    return orders.map((o) => this.shape(o));
  }

  async updateStatus(user: AuthUser, id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && order.storeId !== user.storeId) {
      // Don't leak existence — return 404, not 403.
      throw new NotFoundException();
    }
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  private shape(o: any) {
    return {
      ...o,
      shippingAddress:
        typeof o.shippingAddress === 'string' ? this.safeJson(o.shippingAddress) : o.shippingAddress,
    };
  }

  private safeJson(s: string) {
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }
}
