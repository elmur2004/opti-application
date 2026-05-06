import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SetAssetDto {
  @IsIn(['front', 'left_45', 'right_45', 'left_side', 'right_side'])
  angle!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'imageUrl must not be empty' })
  @MaxLength(2000)
  @Matches(/^https?:\/\//i, { message: 'imageUrl must start with http:// or https://' })
  imageUrl!: string;
}
