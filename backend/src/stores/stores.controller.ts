import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stores')
export class StoresController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.store.findMany({ orderBy: { name: 'asc' } });
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException();
    return store;
  }
}
