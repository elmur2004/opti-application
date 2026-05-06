import { Body, ConflictException, Controller, Post, UseGuards } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

class CreateStoreDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @Transform(trim) @IsString() @MinLength(2) @MaxLength(60)
  @Matches(/^[a-z0-9][a-z0-9-]*$/i, {
    message: 'domain must be alphanumeric with optional dashes (used as a slug)',
  })
  domain!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  logoUrl?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin/stores')
export class AdminStoreWriteController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateStoreDto) {
    try {
      return await this.prisma.store.create({
        data: { name: dto.name, domain: dto.domain.toLowerCase(), logoUrl: dto.logoUrl ?? null },
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('A store with that domain already exists');
      }
      throw e;
    }
  }
}
