import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SetAssetDto } from './dto/set-asset.dto';

const VALID_ANGLES = ['front', 'left_45', 'right_45', 'left_side', 'right_side'];

@Injectable()
export class AdminProductsService {
  constructor(private prisma: PrismaService) {}

  private resolveStoreId(user: AuthUser, requested?: string | null): string {
    if (user.role === 'SUPER_ADMIN') {
      if (!requested) {
        throw new BadRequestException('SUPER_ADMIN must provide storeId');
      }
      return requested;
    }
    if (!user.storeId) {
      throw new ForbiddenException('Admin has no store assigned');
    }
    if (requested && requested !== user.storeId) {
      throw new ForbiddenException('Cannot operate on another store');
    }
    return user.storeId;
  }

  async list(user: AuthUser) {
    const where = user.role === 'SUPER_ADMIN' ? {} : { storeId: user.storeId ?? '__none__' };
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { assets: true, store: { select: { id: true, name: true } } },
    });
    return products.map((p) => this.shape(p));
  }

  async one(user: AuthUser, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { assets: true, store: { select: { id: true, name: true } } },
    });
    if (!product) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && product.storeId !== user.storeId) {
      throw new ForbiddenException();
    }
    return this.shape(product);
  }

  async create(user: AuthUser, dto: CreateProductDto) {
    const storeId = this.resolveStoreId(user, dto.storeId);
    const tryOnConfig = dto.tryOnConfig
      ? JSON.stringify(dto.tryOnConfig)
      : JSON.stringify({ scale: 1.1, offsetX: 0, offsetY: -0.02, rotationSensitivity: 1.2 });

    const product = await this.prisma.product.create({
      data: {
        storeId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        thumbnailUrl: dto.thumbnailUrl,
        stock: dto.stock ?? 100,
        tryOnConfig,
      },
    });

    if (dto.assets) {
      for (const angle of VALID_ANGLES) {
        const url = (dto.assets as Record<string, string | undefined>)[angle];
        if (url) {
          await this.prisma.productAsset.create({
            data: { productId: product.id, angle, imageUrl: url },
          });
        }
      }
    }

    return this.one(user, product.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && existing.storeId !== user.storeId) {
      throw new ForbiddenException();
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.thumbnailUrl !== undefined) data.thumbnailUrl = dto.thumbnailUrl;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.tryOnConfig !== undefined) data.tryOnConfig = JSON.stringify(dto.tryOnConfig);

    await this.prisma.product.update({ where: { id }, data });
    return this.one(user, id);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && existing.storeId !== user.storeId) {
      throw new ForbiddenException();
    }
    // Refuse deletion if the product is referenced by any historical order —
    // we can't lose order history, and we don't want to soft-delete here.
    // Cart and wishlist references cascade on delete (see schema).
    const orderItemCount = await this.prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      throw new ConflictException(
        `Cannot delete: this product appears in ${orderItemCount} order item(s). Set stock to 0 to hide it from new sales instead.`,
      );
    }
    await this.prisma.productAsset.deleteMany({ where: { productId: id } });
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  async setAsset(user: AuthUser, productId: string, dto: SetAssetDto) {
    if (!VALID_ANGLES.includes(dto.angle)) {
      throw new BadRequestException(`Angle must be one of ${VALID_ANGLES.join(', ')}`);
    }
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && product.storeId !== user.storeId) {
      throw new ForbiddenException();
    }
    await this.prisma.productAsset.upsert({
      where: { productId_angle: { productId, angle: dto.angle } },
      update: { imageUrl: dto.imageUrl },
      create: { productId, angle: dto.angle, imageUrl: dto.imageUrl },
    });
    return this.one(user, productId);
  }

  async deleteAsset(user: AuthUser, productId: string, angle: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException();
    if (user.role !== 'SUPER_ADMIN' && product.storeId !== user.storeId) {
      throw new ForbiddenException();
    }
    await this.prisma.productAsset.deleteMany({ where: { productId, angle } });
    return this.one(user, productId);
  }

  private shape(p: any) {
    let cfg: any = {};
    try {
      cfg = JSON.parse(p.tryOnConfig || '{}');
    } catch {
      cfg = {};
    }
    return { ...p, tryOnConfig: cfg };
  }
}
