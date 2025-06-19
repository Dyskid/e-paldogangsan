import fs from 'fs/promises';
import path from 'path';
import { Product } from '../src/types';

async function integrateJejuProducts() {
  // Read the final Jeju products
  const jejuProducts = JSON.parse(
    await fs.readFile(path.join(__dirname, 'output/jeju-mall-final-products.json'), 'utf-8')
  );
  
  // Read current products
  const currentProducts = JSON.parse(
    await fs.readFile(path.join(__dirname, '../src/data/products.json'), 'utf-8')
  );
  
  // Remove old Jeju products
  const nonJejuProducts = currentProducts.filter((p: Product) => p.mallId !== 'mall_100_이제주몰');
  
  // Transform and add new Jeju products
  const transformedProducts = jejuProducts.map((jp: any) => ({
    id: `prod_mall_100_이제주몰_${jp.gno}`,
    name: jp.name,
    description: jp.description,
    price: jp.price === '가격문의' ? '0' : jp.price.replace('원', ''),
    originalPrice: jp.originalPrice?.replace('원', ''),
    imageUrl: jp.imageUrl,
    productUrl: jp.productUrl,
    mallId: 'mall_100_이제주몰',
    mallName: '이제주몰',
    category: mapCategory(jp.category),
    tags: jp.tags,
    inStock: true,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }));
  
  // Combine and save
  const allProducts = [...nonJejuProducts, ...transformedProducts];
  await fs.writeFile(
    path.join(__dirname, '../src/data/products.json'),
    JSON.stringify(allProducts, null, 2)
  );
  
  console.log(`✅ Integrated ${transformedProducts.length} Jeju products`);
}

function mapCategory(category: string): string {
  const map: Record<string, string> = {
    '농산물': 'agricultural',
    '수산물': 'seafood',
    '축산물': 'livestock',
    '가공식품': 'processed',
    '건강식품': 'health',
    '전통식품': 'traditional',
    '공예품': 'crafts',
    '생활용품': 'other',
    '기타': 'other'
  };
  return map[category] || 'other';
}

integrateJejuProducts();