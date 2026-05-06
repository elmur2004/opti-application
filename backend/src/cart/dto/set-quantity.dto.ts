import { IsInt, Min } from 'class-validator';

export class SetQuantityDto {
  @IsInt()
  @Min(0, { message: 'quantity must be 0 or greater (0 removes the item)' })
  quantity!: number;
}
