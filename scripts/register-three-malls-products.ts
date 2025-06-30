import * as fs from 'fs';
import * as path from 'path';

interface ScrapedProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  mallName: string;
  tags: string[];
  region: string;
  inStock: boolean;
  categoryMajor?: string;
  categoryMid?: string;
  categoryMinor?: string;
  categoryOriginal?: string;
}

interface DatabaseProduct {
  id: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
  name: string;
  categoryMajor: string;
  categoryMid: string;
  categoryMinor: string;
  categoryOriginal: string;
}

// Mall URL mappings
const mallUrls = {
  'freshjb': 'https://freshjb.com',
  'jangsu': 'https://www.장수몰.com',
  'gochang': 'https://noblegochang.com'
};

function parsePrice(priceString: string): number {
  // Remove Korean won symbol and commas, extract numbers
  const cleaned = priceString.replace(/[^0-9]/g, '');
  const price = parseInt(cleaned);
  return isNaN(price) ? 0 : price;
}

function transformProduct(scraped: ScrapedProduct): DatabaseProduct {
  return {
    id: scraped.id,
    price: parsePrice(scraped.price),
    imageUrl: scraped.image,
    productUrl: scraped.url,
    category: scraped.categoryOriginal || scraped.category,
    description: scraped.name,
    mallId: scraped.mall,
    mallName: scraped.mallName,
    mallUrl: mallUrls[scraped.mall as keyof typeof mallUrls] || '',
    region: scraped.region,
    tags: scraped.tags,
    featured: false,
    isNew: true,
    clickCount: 0,
    lastVerified: new Date().toISOString(),
    name: scraped.name,
    categoryMajor: scraped.categoryMajor || '식품',
    categoryMid: scraped.categoryMid || '기타상품',
    categoryMinor: scraped.categoryMinor || '기타',
    categoryOriginal: scraped.categoryOriginal || scraped.category
  };
}

async function registerProducts() {
  try {
    console.log('=== Registering Three Malls Products ===');
    
    // Read scraped products
    const scrapedDataPath = path.join(__dirname, 'output/three-malls-products.json');
    const scrapedProducts: ScrapedProduct[] = JSON.parse(
      fs.readFileSync(scrapedDataPath, 'utf8')
    );
    
    console.log(`Found ${scrapedProducts.length} scraped products`);
    
    // Read existing products database
    const databasePath = path.join(__dirname, '../src/data/products.json');
    const existingProducts: DatabaseProduct[] = JSON.parse(
      fs.readFileSync(databasePath, 'utf8')
    );
    
    console.log(`Current database has ${existingProducts.length} products`);
    
    // Transform scraped products to database format
    const transformedProducts = scrapedProducts.map(transformProduct);
    
    // Get existing IDs to avoid duplicates
    const existingIds = new Set(existingProducts.map(p => p.id));
    
    // Filter out any existing products (shouldn't happen since we removed them)
    const newProducts = transformedProducts.filter(p => !existingIds.has(p.id));
    
    console.log(`Adding ${newProducts.length} new products to database`);
    
    // Group by mall for reporting
    const productsByMall = {
      freshjb: newProducts.filter(p => p.mallId === 'freshjb'),
      jangsu: newProducts.filter(p => p.mallId === 'jangsu'),
      gochang: newProducts.filter(p => p.mallId === 'gochang')
    };
    
    console.log('\\n=== Products by Mall ===');
    console.log(`FreshJB (전북생생장터): ${productsByMall.freshjb.length} products`);
    console.log(`Jangsu Mall (장수몰): ${productsByMall.jangsu.length} products`);
    console.log(`Noble Gochang (고창마켓): ${productsByMall.gochang.length} products`);
    
    // Show sample products
    console.log('\\n=== Sample Products ===');
    Object.entries(productsByMall).forEach(([mall, products]) => {
      if (products.length > 0) {
        console.log(`\\n${mall.toUpperCase()} samples:`);
        products.slice(0, 2).forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} - ${product.price > 0 ? product.price.toLocaleString() + '원' : '가격문의'}`);
        });
      }
    });
    
    // Add new products to existing database
    const updatedProducts = [...existingProducts, ...newProducts];
    
    // Create backup of original database
    const backupPath = path.join(__dirname, '../src/data/products-backup-before-three-malls.json');
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`\\n✓ Created backup at: ${backupPath}`);
    
    // Write updated database
    fs.writeFileSync(databasePath, JSON.stringify(updatedProducts, null, 2));
    console.log(`✓ Updated database with ${updatedProducts.length} total products`);
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      originalProductCount: existingProducts.length,
      newProductsAdded: newProducts.length,
      finalProductCount: updatedProducts.length,
      mallBreakdown: {
        freshjb: productsByMall.freshjb.length,
        jangsu: productsByMall.jangsu.length,
        gochang: productsByMall.gochang.length
      },
      backupCreated: backupPath,
      notes: 'Successfully registered products from three malls: 전북생생장터, 장수몰, 고창마켓'
    };
    
    const summaryPath = path.join(__dirname, 'output/registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`✓ Registration summary saved to: ${summaryPath}`);
    
    console.log('\\n=== Registration Complete ===');
    console.log(`Products added: ${newProducts.length}`);
    console.log(`Total products in database: ${updatedProducts.length}`);
    
    return summary;
    
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  registerProducts();
}

export { registerProducts };