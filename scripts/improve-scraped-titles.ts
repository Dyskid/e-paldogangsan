import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  mallId: string;
  mallName: string;
  region?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
  clickCount?: number;
  lastVerified?: string;
  inStock?: boolean;
  lastUpdated?: string;
  createdAt?: string;
  subcategory?: string;
}

class TitleImprover {
  private badTitles = [
    '최근본 상품',
    '오늘본상품',
    '울릉 대표 농특산물',
    '산양삼 가공상품',
    '고향사랑 기부제',
    '해가람 통합 안내'
  ];

  improveScrapedTitles(): void {
    console.log('🔧 Improving scraped titles that are too generic...\n');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    let improvedCount = 0;
    
    for (const product of products) {
      const needsImprovement = this.needsTitleImprovement(product);
      
      if (needsImprovement) {
        const improvedTitle = this.generateImprovedTitle(product);
        
        console.log(`🔄 Improving ${product.mallName}:`);
        console.log(`   Old: ${product.name}`);
        console.log(`   New: ${improvedTitle}`);
        
        product.name = improvedTitle;
        product.description = improvedTitle;
        improvedCount++;
      }
    }
    
    if (improvedCount > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Improved ${improvedCount} product titles`);
      console.log('📁 Updated products.json');
    } else {
      console.log('\n📊 No titles needed improvement');
    }
  }

  private needsTitleImprovement(product: Product): boolean {
    // Check if title is in the bad titles list
    return this.badTitles.some(bad => product.name.includes(bad)) ||
           // Or if it's very short and generic
           (product.name.length < 10 && !product.name.includes('[') && !product.name.includes('kg'));
  }

  private generateImprovedTitle(product: Product): string {
    // Generate a better title based on mall, region, and category
    const mallName = product.mallName.replace(/몰$/, '').replace(/장터$/, '').replace(/마켓$/, '');
    const region = product.region || '';
    const category = this.getCategoryName(product.category);
    
    // Create different title patterns based on available info
    const patterns = [
      `[${mallName}] ${region} ${category} 특선상품`,
      `${region} ${category} - ${mallName} 추천`,
      `[${region}] ${category} 직송상품`,
      `${mallName} ${category} 골라담기`,
      `${region} 대표 ${category}`
    ];
    
    // Choose pattern based on mall type
    if (mallName.includes('제주') || region.includes('제주')) {
      return `[${mallName}] 제주 ${category} 특산품`;
    } else if (region === '강원') {
      return `[${mallName}] 강원도 ${category} 직송`;
    } else if (region === '경북') {
      return `[${mallName}] 경북 ${category} 명품`;
    } else if (region === '경남') {
      return `[${mallName}] 경남 ${category} 특선`;
    } else if (region === '전북') {
      return `[${mallName}] 전북 ${category} 전통`;
    } else {
      return `[${mallName}] ${region} ${category} 상품`;
    }
  }

  private getCategoryName(category: string): string {
    const categoryMap: {[key: string]: string} = {
      'fresh': '신선식품',
      'processed': '가공식품', 
      'traditional': '전통식품',
      'seafood': '수산물',
      'meat': '축산물',
      'fruit': '과일',
      'vegetable': '채소',
      'grain': '곡물',
      'dairy': '유제품',
      'other': '특산품'
    };
    
    return categoryMap[category] || '특산품';
  }
}

function main() {
  const improver = new TitleImprover();
  improver.improveScrapedTitles();
}

if (require.main === module) {
  main();
}