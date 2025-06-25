import { readFileSync, writeFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  tags: string[];
  mall: string;
}

type ProductsData = Product[];

function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/[^\d,]/g, '');
  return parseInt(cleaned.replace(/,/g, '')) || 0;
}

function isValidProduct(product: Product): boolean {
  if (!product.title || product.title.length < 3) return false;
  if (!product.price || product.price === '0원') return false;
  if (!product.url || !product.url.startsWith('http')) return false;
  
  const price = parsePrice(product.price);
  if (price <= 0 || price > 10000000) return false;
  
  // Skip navigation items, categories, or non-product items
  const title = product.title.toLowerCase();
  const skipTerms = [
    '공지사항', '문의하기', '고객센터', '이벤트', '자주하는질문',
    '농산물', '수산물', '축산물', '가공식품', '카테고리', '전통주',
    'icon', '더보기', '최근본상품', '##name##', '세트상품', '친환경농산물'
  ];
  
  return !skipTerms.some(term => title.includes(term));
}

async function registerJindoArirangProducts() {
  try {
    console.log('Registering 진도아리랑몰 products...');
    
    // Read scraped products
    const scrapedProducts: Product[] = JSON.parse(
      readFileSync('./scripts/output/jindoarirang-products.json', 'utf-8')
    );
    
    console.log(`Found ${scrapedProducts.length} scraped products`);
    
    // Filter valid products
    const validProducts = scrapedProducts.filter(isValidProduct);
    console.log(`${validProducts.length} valid products after filtering`);
    
    // Read existing products
    const existingData: ProductsData = JSON.parse(
      readFileSync('./src/data/products.json', 'utf-8')
    );
    
    console.log(`Current products in database: ${existingData.length}`);
    
    // Create backup
    const timestamp = Date.now();
    writeFileSync(
      `./src/data/products-backup-${timestamp}.json`,
      JSON.stringify(existingData, null, 2)
    );
    
    // Check for duplicates and add new products
    let newProducts = 0;
    let duplicates = 0;
    let errors = 0;
    
    for (const product of validProducts) {
      try {
        // Check if product already exists (by URL or similar title)
        const existingProduct = existingData.find(p => 
          p.url === product.url || 
          (p.title && p.title.includes(product.title.split(' - ')[0]) && p.mall === product.mall)
        );
        
        if (existingProduct) {
          duplicates++;
          continue;
        }
        
        // Add new product
        existingData.push(product);
        newProducts++;
        
      } catch (error) {
        console.error(`Error processing product: ${product.title}`, error);
        errors++;
      }
    }
    
    // Save updated products
    writeFileSync('./src/data/products.json', JSON.stringify(existingData, null, 2));
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '진도아리랑몰',
      scraped: scrapedProducts.length,
      valid: validProducts.length,
      new: newProducts,
      duplicates,
      errors,
      totalProducts: existingData.length,
      sampleProducts: validProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: parsePrice(p.price),
        category: p.category
      }))
    };
    
    writeFileSync('./scripts/output/jindoarirang-registration-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n=== Registration Summary ===');
    console.log(`Mall: ${summary.mall}`);
    console.log(`Scraped products: ${summary.scraped}`);
    console.log(`Valid products: ${summary.valid}`);
    console.log(`New products added: ${summary.new}`);
    console.log(`Duplicates skipped: ${summary.duplicates}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Total products in database: ${summary.totalProducts}`);
    
    return summary;
    
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

registerJindoArirangProducts().then(summary => {
  console.log('Registration completed successfully!');
}).catch(error => {
  console.error('Registration failed:', error);
  process.exit(1);
});