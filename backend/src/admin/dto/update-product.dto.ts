import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TryOnConfigDto } from './create-product.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProductDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  name?: string;

  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  price?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Matches(/^https?:\/\//i, { message: 'thumbnailUrl must start with http:// or https://' })
  thumbnailUrl?: string;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  // ValidateIf (instead of IsOptional) so we keep validating when the field is
  // explicitly set to null — IsOptional would silently accept null and we'd
  // store the literal string "null" in the column.
  @ValidateIf((o) => o.tryOnConfig !== undefined)
  @IsObject({ message: 'tryOnConfig must be an object (null is not allowed)' })
  @ValidateNested()
  @Type(() => TryOnConfigDto)
  tryOnConfig?: TryOnConfigDto;
}
