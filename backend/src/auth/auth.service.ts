import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const password = await bcrypt.hash(dto.password, 10);
    let user;
    try {
      user = await this.prisma.user.create({
        data: { email: dto.email, password, role: 'CUSTOMER' },
      });
    } catch (e: unknown) {
      // Concurrent registers can race past the findUnique above and trip the
      // unique constraint at insert time. Translate Prisma's P2002 to 409 so
      // the client gets a sensible response instead of a 500.
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  private signToken(user: { id: string; email: string; role: string; storeId: string | null }) {
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
      },
    };
  }
}
