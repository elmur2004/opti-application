import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminShippingController } from './admin-shipping.controller';
import { AdminStoresController } from './admin-stores.controller';
import { AdminStoreWriteController } from './admin-store-write.controller';

@Module({
  controllers: [
    AdminProductsController,
    AdminShippingController,
    AdminStoresController,
    AdminStoreWriteController,
  ],
  providers: [AdminProductsService],
})
export class AdminModule {}
