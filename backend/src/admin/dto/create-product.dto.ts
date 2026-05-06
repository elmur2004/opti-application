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

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class TryOnConfigDto {
  @IsOptional() @IsNumber() scale?: number;
  @IsOptional() @IsNumber() offsetX?: number;
  @IsOptional() @IsNumber() offsetY?: number;
  @IsOptional() @IsNumber() rotationSensitivity?: number;
}

export class ProductAssetsDto {
  @IsOptional() @IsString() @MaxLength(2000) front?: string;
  @IsOptional() @IsString() @MaxLength(2000) left_45?: string;
  @IsOptional() @IsString() @MaxLength(2000) right_45?: string;
  @IsOptional() @IsString() @MaxLength(2000) left_side?: string;
  @IsOptional() @IsString() @MaxLength(2000) right_side?: string;
}

export class CreateProductDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price must be a number with at most 2 decimals' })
  @Min(0)
  @Max(1_000_000)
  price!: number;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Matches(/^https?:\/\//i, { message: 'thumbnailUrl must start with http:// or https://' })
  thumbnailUrl!: string;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  @IsOptional() @IsString()
  storeId?: string; // SUPER_ADMIN only

  @ValidateIf((o) => o.tryOnConfig !== undefined)
  @IsObject({ message: 'tryOnConfig must be an object (null is not allowed)' })
  @ValidateNested()
  @Type(() => TryOnConfigDto)
  tryOnConfig?: TryOnConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductAssetsDto)
  assets?: ProductAssetsDto;
}
