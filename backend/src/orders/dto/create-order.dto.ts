import { Type } from 'class-transformer';
import { IsNotEmptyObject, IsString, ValidateNested } from 'class-validator';

export class ShippingAddressDto {
  @IsString() name!: string;
  @IsString() phone!: string;
  @IsString() city!: string;
  @IsString() address!: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsNotEmptyObject()
  shippingAddress!: ShippingAddressDto;
}
