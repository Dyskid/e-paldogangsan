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
  if (titleLower.includes('한우') || titleLower.includes('갈비') || titleLower.includes('등심') || titleLower.includes('양지') || titleLower.includes('불고기') || titleLower.includes('사태')) {
    tags.push('한우', '서산한우');
    return { category: '축산물', subcategory: '한우', tags };
  }
  
  if (titleLower.includes('돈까스') || titleLower.includes('떡갈비') || titleLower.includes('함박')) {
    tags.push('육가공품');
    return { category: '가공식품', subcategory: '육가공품', tags };
  }
  
  if (titleLower.includes('쌀') || titleLower.includes('백미') || titleLower.includes('현미')) {
    tags.push('쌀');
    if (titleLower.includes('뜸부기')) tags.push('뜸부기쌀');
    if (titleLower.includes('간척지')) tags.push('간척지쌀');
    return { category: '농산물', subcategory: '곡물', tags };
  }
  
  if (titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('간장') || titleLower.includes('장아찌')) {
    tags.push('장류');
    if (titleLower.includes('표고')) tags.push('표고');
    if (titleLower.includes('함초')) tags.push('함초');
    return { category: '가공식품', subcategory: '장류', tags };
  }
  
  if (titleLower.includes('참기름') || titleLower.includes('들기름') || titleLower.includes('기름')) {
    tags.push('기름');
    return { category: '가공식품', subcategory: '오일/기름', tags };
  }
  
  if (titleLower.includes('김') || titleLower.includes('감태') || titleLower.includes('해초') || titleLower.includes('굴젓')) {
    tags.push('수산물');
    return { category: '수산물', subcategory: '해조류', tags };
  }
  
  if (titleLower.includes('마늘') || titleLower.includes('생강') || titleLower.includes('양파')) {
    tags.push('양념채소');
    if (titleLower.includes('육쪽마늘')) tags.push('육쪽마늘');
    return { category: '농산물', subcategory: '채소', tags };
  }
  
  if (titleLower.includes('표고') || titleLower.includes('버섯')) {
    tags.push('버섯');
    return { category: '농산물', subcategory: '버섯', tags };
  }
  
  if (titleLower.includes('딸기') || titleLower.includes('머스켓') || titleLower.includes('샤인')) {
    tags.push('과일');
    return { category: '농산물', subcategory: '과일', tags };
  }
  
  if (titleLower.includes('홍삼') || titleLower.includes('인삼') || titleLower.includes('홍화씨')) {
    tags.push('건강식품');
    return { category: '건강식품', subcategory: '인삼/홍삼', tags };
  }
  
  if (titleLower.includes('차') || titleLower.includes('생강차') || titleLower.includes('조청')) {
    tags.push('음료/차');
    return { category: '가공식품', subcategory: '음료/차', tags };
  }
  
  if (titleLower.includes('한과') || titleLower.includes('편강')) {
    tags.push('전통식품', '한과');
    return { category: '가공식품', subcategory: '전통식품', tags };
  }
  
  if (titleLower.includes('천일염') || titleLower.includes('소금')) {
    tags.push('소금');
    return { category: '가공식품', subcategory: '조미료', tags };
  }
  
  if (titleLower.includes('세트')) {
    tags.push('선물세트');
    // Don't override category if already set
    if (category && category === '축산물') {
      return { category: '축산물', subcategory: '선물세트', tags };
    }
    return { category: '선물세트', tags };
  }
  
  // Default based on provided category
  if (category) {
    if (category.includes('축산')) {
      tags.push('축산물');
      return { category: '축산물', tags };
    }
    if (category.includes('수산')) {
      tags.push('수산물');
      return { category: '수산물', tags };
    }
    if (category.includes('김치')) {
      tags.push('김치/반찬');
      return { category: '가공식품', subcategory: '김치/반찬', tags };
    }
  }
  
  // Default
  tags.push('특산물');
  return { category: '농산물', tags };
}

async function registerSeosanttreProducts() {
  try {
    console.log('Loading scraped products...');
    const scrapedData = JSON.parse(fs.readFileSync('./scripts/output/seosanttre-products.json', 'utf-8'));
    
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
      // Generate unique ID for 서산뜨레 products
      const productId = `seosanttre-${scraped.id}`;
      
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
      tags.push('서산', '서산뜨레', '충남');
      
      // Add quality indicators
      if (scraped.title.includes('무농약')) tags.push('무농약');
      if (scraped.title.includes('GAP')) tags.push('GAP인증');
      if (scraped.title.includes('유기농')) tags.push('유기농');
      if (scraped.title.includes('전통')) tags.push('전통');
      if (scraped.title.includes('명인')) tags.push('명인');
      if (scraped.title.includes('무료배송')) tags.push('무료배송');
      
      const product: Product = {
        id: productId,
        title: scraped.title,
        price: cleanedPrice,
        image: scraped.image || '',
        category,
        subcategory,
        tags: [...new Set(tags)], // Remove duplicates
        region: '충청남도 서산시',
        mall: '서산뜨레',
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
      mall: '서산뜨레',
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
    
    fs.writeFileSync('./scripts/output/seosanttre-registration-summary.json', JSON.stringify(summary, null, 2));
    
    return newProducts;
    
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

registerSeosanttreProducts().catch(console.error);