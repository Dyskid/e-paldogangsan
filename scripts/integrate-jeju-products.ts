import fs from 'fs/promises';
import path from 'path';
import { Product } from '../src/types';

interface JejuProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  seller: string;
  description: string;
  tags: string[];
  originalPrice?: string;
  discountRate?: string;
}

// Map Jeju categories to our standard categories
const categoryMapping: Record<string, string> = {
  '농산품': 'agricultural',
  '수산품': 'seafood',
  '축산품': 'livestock',
  '가공식품': 'processed',
  '건강식품': 'health',
  '전통식품': 'traditional',
  '화장품': 'other',
  '공예품': 'crafts',
  '생활용품': 'other',
  '반려동물용품': 'other'
};

async function integrateJejuProducts() {
  try {
    // Read the scraped Jeju products
    const jejuProductsPath = path.join(__dirname, 'output/jeju-mall-products-complete.json');
    const jejuProductsData = await fs.readFile(jejuProductsPath, 'utf-8');
    const jejuProducts: JejuProduct[] = JSON.parse(jejuProductsData);

    // Read current products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    const currentProductsData = await fs.readFile(productsPath, 'utf-8');
    const currentProducts: Product[] = JSON.parse(currentProductsData);

    // Filter out any existing Jeju mall products (with incorrect URLs)
    const nonJejuProducts = currentProducts.filter(
      p => p.mallId !== 'mall_100_이제주몰'
    );

    // Transform Jeju products to match our Product interface
    const transformedJejuProducts: Product[] = jejuProducts.map((jejuProduct, index) => {
      // Parse price to remove '원' and format properly
      const priceNum = parseInt(jejuProduct.price.replace(/[^0-9]/g, ''));
      const formattedPrice = priceNum.toLocaleString('ko-KR');

      // Parse original price if exists
      let originalPrice: string | undefined;
      if (jejuProduct.originalPrice) {
        const originalPriceNum = parseInt(jejuProduct.originalPrice.replace(/[^0-9]/g, ''));
        originalPrice = originalPriceNum.toLocaleString('ko-KR');
      }

      return {
        id: `prod_mall_100_이제주몰_${jejuProduct.id.replace('jeju_', '')}`,
        name: jejuProduct.name,
        description: jejuProduct.description || `이제주몰에서 판매하는 ${jejuProduct.name}`,
        price: formattedPrice,
        originalPrice: originalPrice,
        imageUrl: jejuProduct.imageUrl,
        productUrl: jejuProduct.productUrl,
        mallId: 'mall_100_이제주몰',
        mallName: '이제주몰',
        category: categoryMapping[jejuProduct.category] || 'other',
        tags: [
          ...jejuProduct.tags,
          categoryMapping[jejuProduct.category] || 'other'
        ],
        inStock: true,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    });

    // Combine products
    const allProducts = [...nonJejuProducts, ...transformedJejuProducts];

    // Sort by mallId for consistency
    allProducts.sort((a, b) => a.mallId.localeCompare(b.mallId));

    // Write back to products.json
    await fs.writeFile(
      productsPath,
      JSON.stringify(allProducts, null, 2),
      'utf-8'
    );

    console.log(`✅ Successfully integrated ${transformedJejuProducts.length} Jeju products`);
    console.log(`📊 Total products now: ${allProducts.length}`);
    
    // Also create a summary file
    const summary = {
      totalProducts: allProducts.length,
      jejuProducts: transformedJejuProducts.length,
      otherProducts: nonJejuProducts.length,
      updatedAt: new Date().toISOString(),
      jejuProductsSample: transformedJejuProducts.slice(0, 5)
    };
    
    await fs.writeFile(
      path.join(__dirname, 'output/integration-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    );
    
  } catch (error) {
    console.error('❌ Error integrating products:', error);
  }
}

// Run the integration
integrateJejuProducts();