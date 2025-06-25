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
  if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀') || titleLower.includes('햅쌀')) {
    tags.push('쌀');
    if (titleLower.includes('신동진')) tags.push('신동진');
    if (titleLower.includes('햅쌀')) tags.push('햅쌀');
    return { category: '농산물', subcategory: '곡물', tags };
  }
  
  if (titleLower.includes('잡곡') || titleLower.includes('흑미') || titleLower.includes('수수') || 
      titleLower.includes('기장') || titleLower.includes('율무') || titleLower.includes('귀리') ||
      titleLower.includes('메밀') || titleLower.includes('보리') || titleLower.includes('녹두')) {
    tags.push('잡곡');
    return { category: '농산물', subcategory: '곡물', tags };
  }
  
  if (titleLower.includes('가루') || titleLower.includes('미숫가루') || titleLower.includes('뻥튀기')) {
    tags.push('가루제품');
    return { category: '가공식품', subcategory: '곡물가공품', tags };
  }
  
  if (titleLower.includes('상추') || titleLower.includes('샐러드') || titleLower.includes('토마토') || 
      titleLower.includes('쌈채소') || titleLower.includes('채소')) {
    tags.push('채소');
    return { category: '농산물', subcategory: '채소', tags };
  }
  
  if (titleLower.includes('배') || titleLower.includes('복숭아') || titleLower.includes('블루베리') ||
      titleLower.includes('곶감') || titleLower.includes('감')) {
    tags.push('과일');
    if (titleLower.includes('유기농')) tags.push('유기농');
    return { category: '농산물', subcategory: '과일', tags };
  }
  
  if (titleLower.includes('상황버섯') || titleLower.includes('노루궁뎅이') || titleLower.includes('표고') || titleLower.includes('버섯')) {
    tags.push('버섯');
    if (titleLower.includes('상황버섯')) tags.push('상황버섯');
    return { category: '농산물', subcategory: '버섯', tags };
  }
  
  if (titleLower.includes('차') || titleLower.includes('즙') || titleLower.includes('청') || 
      titleLower.includes('엑기스') || titleLower.includes('음료')) {
    tags.push('음료/차');
    if (titleLower.includes('작두콩')) tags.push('작두콩차');
    if (titleLower.includes('오디')) tags.push('오디');
    return { category: '가공식품', subcategory: '음료/차', tags };
  }
  
  if (titleLower.includes('고춧가루') || titleLower.includes('참깨') || titleLower.includes('메주가루')) {
    tags.push('양념/조미료');
    return { category: '가공식품', subcategory: '양념/조미료', tags };
  }
  
  if (titleLower.includes('장류') || titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('죽염')) {
    tags.push('장류');
    if (titleLower.includes('죽염')) tags.push('죽염');
    return { category: '가공식품', subcategory: '장류', tags };
  }
  
  if (titleLower.includes('선물세트') || titleLower.includes('세트')) {
    tags.push('선물세트');
    return { category: '선물세트', tags };
  }
  
  if (titleLower.includes('홍잠') || titleLower.includes('누에')) {
    tags.push('건강식품', '홍잠');
    return { category: '건강식품', subcategory: '특수식품', tags };
  }
  
  // Default based on provided category
  if (category) {
    if (category.includes('쌀') || category.includes('잡곡')) {
      tags.push('곡물');
      return { category: '농산물', subcategory: '곡물', tags };
    }
    if (category.includes('과일') || category.includes('채소')) {
      tags.push('농산물');
      return { category: '농산물', tags };
    }
    if (category.includes('가공')) {
      tags.push('가공식품');
      return { category: '가공식품', tags };
    }
    if (category.includes('선물')) {
      tags.push('선물세트');
      return { category: '선물세트', tags };
    }
  }
  
  // Default
  tags.push('특산물');
  return { category: '농산물', tags };
}

async function registerBuanProducts() {
  try {
    console.log('Loading scraped products...');
    const scrapedData = JSON.parse(fs.readFileSync('./scripts/output/buan-products.json', 'utf-8'));
    
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
      // Generate unique ID for 부안 텃밭할매 products
      const productId = `buan-${scraped.id}`;
      
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
      tags.push('부안', '텃밭할매', '전북');
      
      // Add quality indicators
      if (scraped.title.includes('유기농')) tags.push('유기농');
      if (scraped.title.includes('친환경')) tags.push('친환경');
      if (scraped.title.includes('국내산')) tags.push('국내산');
      if (scraped.title.includes('로컬푸드')) tags.push('로컬푸드');
      if (scraped.title.includes('농장직송')) tags.push('농장직송');
      if (scraped.title.includes('자연산')) tags.push('자연산');
      
      const product: Product = {
        id: productId,
        title: scraped.title,
        price: cleanedPrice,
        image: scraped.image || '',
        category,
        subcategory,
        tags: [...new Set(tags)], // Remove duplicates
        region: '전북특별자치도 부안군',
        mall: '부안 텃밭할매',
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
      mall: '부안 텃밭할매',
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
    
    fs.writeFileSync('./scripts/output/buan-registration-summary.json', JSON.stringify(summary, null, 2));
    
    return newProducts;
    
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

registerBuanProducts().catch(console.error);