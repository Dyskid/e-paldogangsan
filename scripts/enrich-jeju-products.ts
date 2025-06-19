import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  gno: string;
  cate?: string;
  description: string;
  tags: string[];
}

async function fetchProductDetails(url: string): Promise<{price?: string, originalPrice?: string, inStock?: boolean} | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for price information
    const priceText = $('.price, .sell-price, .product-price, #sellPrice, .goods_price').first().text().trim();
    const originalPriceText = $('.consumer-price, .original-price, #consumerPrice, .line-through').first().text().trim();
    
    // Check stock status
    const stockStatus = $('.stock-status, .sold-out, .out-of-stock').text().trim();
    const inStock = !stockStatus.includes('품절') && !stockStatus.includes('sold');
    
    return {
      price: priceText || undefined,
      originalPrice: originalPriceText || undefined,
      inStock
    };
  } catch (error) {
    console.error(`Failed to fetch details for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function enrichJejuProducts() {
  console.log('🚀 Enriching Jeju Mall products with prices...');
  
  // Read the scraped products
  const productsPath = path.join(__dirname, 'output/jeju-mall-real-products.json');
  const productsData = await fs.readFile(productsPath, 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  console.log(`📦 Found ${products.length} products to enrich`);
  
  // Enrich first 10 products with actual prices
  const enrichedProducts: Product[] = [];
  
  for (let i = 0; i < Math.min(products.length, 10); i++) {
    const product = products[i];
    console.log(`\n${i + 1}. Fetching details for: ${product.name}`);
    
    const details = await fetchProductDetails(product.productUrl);
    
    if (details && details.price) {
      // Clean and format price
      const cleanPrice = details.price.replace(/[^0-9]/g, '');
      const formattedPrice = cleanPrice ? `${parseInt(cleanPrice).toLocaleString('ko-KR')}원` : product.price;
      
      let formattedOriginalPrice: string | undefined;
      if (details.originalPrice) {
        const cleanOriginal = details.originalPrice.replace(/[^0-9]/g, '');
        formattedOriginalPrice = cleanOriginal ? `${parseInt(cleanOriginal).toLocaleString('ko-KR')}원` : undefined;
      }
      
      enrichedProducts.push({
        ...product,
        price: formattedPrice,
        originalPrice: formattedOriginalPrice
      });
      
      console.log(`  ✅ Price: ${formattedPrice}${formattedOriginalPrice ? ` (was ${formattedOriginalPrice})` : ''}`);
    } else {
      // Use default price for now
      enrichedProducts.push({
        ...product,
        price: '가격문의'
      });
      console.log(`  ℹ️  Using default price`);
    }
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Add remaining products without fetching (to save time)
  for (let i = 10; i < products.length; i++) {
    enrichedProducts.push({
      ...products[i],
      price: '가격문의'
    });
  }
  
  // Save enriched products
  const outputPath = path.join(__dirname, 'output/jeju-mall-final-products.json');
  await fs.writeFile(outputPath, JSON.stringify(enrichedProducts, null, 2));
  
  console.log(`\n✅ Saved ${enrichedProducts.length} enriched products to: ${outputPath}`);
  
  // Create integration script
  const integrationScript = `
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
    id: \`prod_mall_100_이제주몰_\${jp.gno}\`,
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
  
  console.log(\`✅ Integrated \${transformedProducts.length} Jeju products\`);
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
`;
  
  await fs.writeFile(
    path.join(__dirname, 'integrate-final-jeju-products.ts'),
    integrationScript.trim()
  );
  
  console.log('📝 Created integration script: integrate-final-jeju-products.ts');
}

// Run the enrichment
enrichJejuProducts();