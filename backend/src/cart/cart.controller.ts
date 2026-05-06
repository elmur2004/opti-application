import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { SetQuantityDto } from './dto/set-quantity.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cart.get(user.id);
  }

  @Post('add')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddToCartDto) {
    return this.cart.add(user.id, dto);
  }

  /// Set the absolute quantity of a cart line. quantity=0 removes the item.
  @Patch('items/:productId')
  setQuantity(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: SetQuantityDto,
  ) {
    return this.cart.setQuantity(user.id, productId, dto.quantity);
  }

  @Post('remove')
  remove(@CurrentUser() user: AuthUser, @Body() dto: RemoveFromCartDto) {
    return this.cart.remove(user.id, dto.productId);
  }

  @Delete('clear')
  clear(@CurrentUser() user: AuthUser) {
    return this.cart.clear(user.id);
  }
}
