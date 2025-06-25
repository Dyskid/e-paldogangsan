import * as fs from 'fs';

interface ScrapedProduct {
  id: string;
  title: string;
  url: string;
  price: string;
  image: string;
  category?: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  subcategory?: string;
  tags: string[];
  region: string;
  mall: string;
  inStock: boolean;
  url: string;
}

function cleanPrice(price: string): string {
  // Remove any non-numeric characters except commas, then add 원 if not present
  const cleaned = price.replace(/[^\d,]/g, '');
  return cleaned ? cleaned + '원' : '';
}

function categorizeProduct(title: string, category?: string): { category: string; subcategory?: string; tags: string[] } {
  const titleLower = title.toLowerCase();
  const tags: string[] = [];
  
  // Determine primary category
  if (titleLower.includes('한우') || titleLower.includes('갈비') || titleLower.includes('등심') || titleLower.includes('안심') || titleLower.includes('불고기') || titleLower.includes('국거리')) {
    tags.push('한우');
    return { category: '축산물', subcategory: '한우', tags };
  }
  
  if (titleLower.includes('한돈') || titleLower.includes('삼겹살') || titleLower.includes('목살') || titleLower.includes('앞다리')) {
    tags.push('한돈');
    return { category: '축산물', subcategory: '돼지고기', tags };
  }
  
  if (titleLower.includes('계란') || titleLower.includes('유정란') || titleLower.includes('달걀')) {
    tags.push('계란');
    return { category: '축산물', subcategory: '계란', tags };
  }
  
  if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀') || titleLower.includes('흑미')) {
    if (titleLower.includes('유기농')) tags.push('유기농');
    tags.push('쌀');
    return { category: '농산물', subcategory: '곡물', tags };
  }
  
  if (titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('간장') || titleLower.includes('청국장') || titleLower.includes('장아찌')) {
    if (titleLower.includes('전통')) tags.push('전통');
    tags.push('장류');
    return { category: '가공식품', subcategory: '장류', tags };
  }
  
  if (titleLower.includes('참기름') || titleLower.includes('들기름') || titleLower.includes('참깨')) {
    tags.push('기름');
    return { category: '가공식품', subcategory: '오일/기름', tags };
  }
  
  if (titleLower.includes('김') || titleLower.includes('새우젓') || titleLower.includes('멸치')) {
    tags.push('수산물');
    return { category: '수산물', subcategory: '건어물', tags };
  }
  
  if (titleLower.includes('블루베리') || titleLower.includes('아로니아') || titleLower.includes('도라지') || titleLower.includes('마늘')) {
    if (titleLower.includes('유기농')) tags.push('유기농');
    tags.push('건강식품');
    return { category: '농산물', subcategory: '특산물', tags };
  }
  
  if (titleLower.includes('누룽지') || titleLower.includes('차') || titleLower.includes('효소') || titleLower.includes('액')) {
    tags.push('음료');
    return { category: '가공식품', subcategory: '음료/차', tags };
  }
  
  if (titleLower.includes('선물세트') || titleLower.includes('세트')) {
    tags.push('선물세트');
    return { category: '선물세트', tags };
  }
  
  if (titleLower.includes('한과') || titleLower.includes('잼') || titleLower.includes('미숫가루')) {
    tags.push('전통식품');
    return { category: '가공식품', subcategory: '전통식품', tags };
  }
  
  // Default based on provided category or fallback
  if (category) {
    if (category.includes('농산물')) {
      tags.push('농산물');
      return { category: '농산물', tags };
    }
    if (category.includes('축산') || category.includes('한우') || category.includes('한돈')) {
      tags.push('축산물');
      return { category: '축산물', tags };
    }
    if (category.includes('가공품')) {
      tags.push('가공식품');
      return { category: '가공식품', tags };
    }
  }
  
  // Default
  tags.push('특산물');
  return { category: '농산물', tags };
}

async function registerEHongseongProducts() {
  try {
    console.log('Loading scraped products...');
    const scrapedData = JSON.parse(fs.readFileSync('./scripts/output/ehongseong-products.json', 'utf-8'));
    
    console.log('Loading existing products...');
    const existingProducts: Product[] = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf-8'));
    
    console.log(`Found ${scrapedData.length} scraped products`);
    console.log(`Found ${existingProducts.length} existing products`);
    
    const newProducts: Product[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;
    
    // Create a Set of existing product IDs for quick lookup
    const existingIds = new Set(existingProducts.map(p => p.id));
    
    scrapedData.forEach((scraped: ScrapedProduct, index: number) => {
      // Generate unique ID for e홍성장터 products
      const productId = `ehongseong-${scraped.id}`;
      
      // Skip if already exists
      if (existingIds.has(productId)) {
        duplicateCount++;
        return;
      }
      
      // Validate required fields
      if (!scraped.title || !scraped.price) {
        console.log(`Skipping invalid product ${index + 1}: Missing title or price`);
        invalidCount++;
        return;
      }
      
      // Clean and validate price
      const cleanedPrice = cleanPrice(scraped.price);
      if (!cleanedPrice) {
        console.log(`Skipping product ${index + 1}: Invalid price format`);
        invalidCount++;
        return;
      }
      
      // Categorize the product
      const { category, subcategory, tags } = categorizeProduct(scraped.title, scraped.category);
      
      // Add regional and mall tags
      tags.push('홍성', 'e홍성장터', '충남');
      
      // Add quality indicators
      if (scraped.title.includes('유기농')) tags.push('유기농');
      if (scraped.title.includes('무항생제')) tags.push('무항생제');
      if (scraped.title.includes('HACCP')) tags.push('HACCP');
      if (scraped.title.includes('전통')) tags.push('전통');
      if (scraped.title.includes('명인')) tags.push('명인');
      if (scraped.title.includes('참발효어워즈')) tags.push('수상제품');
      
      const product: Product = {
        id: productId,
        title: scraped.title,
        price: cleanedPrice,
        image: scraped.image || '',
        category,
        subcategory,
        tags: [...new Set(tags)], // Remove duplicates
        region: '충청남도 홍성군',
        mall: 'e홍성장터',
        inStock: true,
        url: scraped.url
      };
      
      newProducts.push(product);
    });
    
    console.log(`\n=== REGISTRATION SUMMARY ===`);
    console.log(`Valid new products: ${newProducts.length}`);
    console.log(`Duplicates skipped: ${duplicateCount}`);
    console.log(`Invalid products skipped: ${invalidCount}`);
    
    if (newProducts.length > 0) {
      // Add new products to existing products
      const updatedProducts = [...existingProducts, ...newProducts];
      
      // Save updated products
      fs.writeFileSync('./src/data/products.json', JSON.stringify(updatedProducts, null, 2));
      
      console.log(`Successfully added ${newProducts.length} products to products.json`);
      console.log(`Total products in database: ${updatedProducts.length}`);
    } else {
      console.log('No new products to add.');
    }
    
    // Save registration summary
    const summary = {
      timestamp: Date.now(),
      mall: 'e홍성장터',
      totalScraped: scrapedData.length,
      validProducts: newProducts.length,
      duplicates: duplicateCount,
      invalid: invalidCount,
      sampleRegisteredProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };
    
    fs.writeFileSync('./scripts/output/ehongseong-registration-summary.json', JSON.stringify(summary, null, 2));
    
    return newProducts;
    
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

registerEHongseongProducts().catch(console.error);