const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main(){
  const pcount = await prisma.product.count();
  if(pcount===0){
    await prisma.product.createMany({ data: [
      { name: 'Aurelia Silk Gown', description: 'Floor-length silk evening gown with a timeless silhouette.', priceCents: 12999, imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop' },
      { name: 'Nocturne Velvet Dress', description: 'Midnight velvet with subtle shimmer, long sleeves.', priceCents: 9999, imageUrl: 'https://images.unsplash.com/photo-1520975682031-ae1e76607f66?q=80&w=1200&auto=format&fit=crop' },
      { name: 'Éclat Cocktail Dress', description: 'Knee-length satin dress with minimalist lines.', priceCents: 7999, imageUrl: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1200&auto=format&fit=crop' },
      { name: 'Seraphina Lace Midi', description: 'Delicate lace midi dress in pearl white.', priceCents: 10999, imageUrl: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?q=80&w=1200&auto=format&fit=crop' },
      { name: 'Valencia Slip Dress', description: 'Silky slip dress with adjustable straps.', priceCents: 6999, imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop' }
    ]});
  }
  const dcount = await prisma.discountCode.count();
  if(dcount===0){
    await prisma.discountCode.createMany({ data: [
      { code: 'WELCOME10', type: 'PERCENT', value: 10, active: true },
      { code: 'FESTIVE500', type: 'FIXED', value: 500, active: true },
      { code: 'EXPIRED20', type: 'PERCENT', value: 20, active: true, expiresAt: new Date(Date.now()-86400000) }
    ]});
  }
  const adminEmail = 'admin@larivera.test';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if(!existing){
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({ data: { name:'Admin', email: adminEmail, passwordHash, isAdmin: true, cart: { create: {} } } });
  }
}

main().catch(console.error).finally(async()=>{ await prisma.$disconnect(); });
