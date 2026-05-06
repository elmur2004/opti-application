import { IsIn } from 'class-validator';

export const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class UpdateOrderDto {
  @IsIn(ORDER_STATUSES as unknown as string[], {
    message: `status must be one of: ${ORDER_STATUSES.join(', ')}`,
  })
  status!: OrderStatus;
}
