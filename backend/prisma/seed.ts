import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productAsset.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shippingRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const opticStore = await prisma.store.create({
    data: {
      name: 'Optic Vision',
      domain: 'opticvision',
      logoUrl: 'https://placehold.co/200x80/2563eb/white?text=Optic+Vision',
    },
  });

  const lensStore = await prisma.store.create({
    data: {
      name: 'LensCraft',
      domain: 'lenscraft',
      logoUrl: 'https://placehold.co/200x80/ea580c/white?text=LensCraft',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@opticvision.com',
      password: passwordHash,
      role: 'STORE_ADMIN',
      storeId: opticStore.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'admin@lenscraft.com',
      password: passwordHash,
      role: 'STORE_ADMIN',
      storeId: lensStore.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: passwordHash,
      role: 'CUSTOMER',
    },
  });

  const products = [
    { storeId: opticStore.id, name: 'Aviator Classic',  description: 'Timeless aviator silhouette in gold metal frame.',     price: 149.0, color: 'd4a017' },
    { storeId: opticStore.id, name: 'Wayfarer Black',   description: 'Iconic wayfarer in matte black acetate.',              price: 129.0, color: '111111' },
    { storeId: opticStore.id, name: 'Round Vintage',    description: 'Vintage round metal frame, tortoise temples.',         price:  99.0, color: 'c2a07b' },
    { storeId: lensStore.id,  name: 'Cat Eye Pearl',    description: 'Elegant cat-eye, ivory acetate with gold accents.',    price: 179.0, color: 'f0e6d2' },
    { storeId: lensStore.id,  name: 'Sport Wrap',       description: 'Wraparound sport frame, polarized lenses.',            price: 119.0, color: '1f2937' },
    { storeId: lensStore.id,  name: 'Geek Chic',        description: 'Bold rectangular frame, transparent acetate.',         price:  89.0, color: 'd1d5db' },
  ];

  for (const p of products) {
    const txtFg = ['111111', '1f2937'].includes(p.color) ? 'fff' : '333';
    const product = await prisma.product.create({
      data: {
        storeId: p.storeId,
        name: p.name,
        description: p.description,
        price: p.price,
        thumbnailUrl: `https://placehold.co/400x300/${p.color}/${txtFg}?text=${encodeURIComponent(p.name)}`,
        tryOnConfig: JSON.stringify({
          scale: 1.1,
          offsetX: 0,
          offsetY: -0.02,
          rotationSensitivity: 1.2,
        }),
      },
    });

    const labels: Array<[string, string]> = [
      ['front',      'front'],
      ['left_45',    'L45'],
      ['right_45',   'R45'],
      ['left_side',  'left'],
      ['right_side', 'right'],
    ];
    for (const [angle, label] of labels) {
      await prisma.productAsset.create({
        data: {
          productId: product.id,
          angle,
          imageUrl: `https://placehold.co/600x300/${p.color}/${txtFg}?text=${encodeURIComponent(`${p.name} ${label}`)}`,
        },
      });
    }
  }

  const cities = ['Cairo', 'Alexandria', 'Giza', 'Mansoura', 'Aswan'];
  for (const store of [opticStore, lensStore]) {
    for (let i = 0; i < cities.length; i++) {
      await prisma.shippingRule.create({
        data: { storeId: store.id, city: cities[i], price: 30 + i * 10 },
      });
    }
  }

  console.log('--- Seed complete ---');
  console.log('Customer login : customer@example.com / password123');
  console.log('Optic admin    : admin@opticvision.com / password123');
  console.log('LensCraft admin: admin@lenscraft.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
