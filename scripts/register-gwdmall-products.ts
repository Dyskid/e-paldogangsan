import * as fs from 'fs';
import * as path from 'path';

interface GwdMallProduct {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class GwdMallProductRegistrar {
  private rawProducts: GwdMallProduct[] = [];
  private cleanProducts: any[] = [];

  async run() {
    console.log('📝 Starting GWDMall product registration...');
    
    try {
      await this.loadRawProducts();
      await this.cleanProductData();
      await this.registerProducts();
      
      console.log(`✅ Registration completed! Processed ${this.cleanProducts.length} products`);
      
    } catch (error) {
      console.error('❌ Error during registration:', error);
      throw error;
    }
  }

  private async loadRawProducts() {
    const rawProductsFile = path.join(__dirname, 'output', 'gwdmall-working-products.json');
    
    if (!fs.existsSync(rawProductsFile)) {
      throw new Error('Raw products file not found. Please run the scraper first.');
    }
    
    const rawData = fs.readFileSync(rawProductsFile, 'utf-8');
    this.rawProducts = JSON.parse(rawData);
    
    console.log(`📥 Loaded ${this.rawProducts.length} raw products`);
  }

  private async cleanProductData() {
    console.log('🧹 Cleaning product data...');
    
    for (const rawProduct of this.rawProducts) {
      try {
        const cleanedProduct = this.cleanSingleProduct(rawProduct);
        if (cleanedProduct) {
          this.cleanProducts.push(cleanedProduct);
          console.log(`  ✅ Cleaned: ${cleanedProduct.title}`);
        } else {
          console.log(`  ⚠️  Skipped invalid product: ${rawProduct.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Error cleaning product ${rawProduct.id}:`, error.message);
      }
    }
    
    console.log(`🧹 Cleaned ${this.cleanProducts.length} products out of ${this.rawProducts.length}`);
  }

  private cleanSingleProduct(rawProduct: GwdMallProduct): any | null {
    // Clean title
    let title = rawProduct.title.trim();
    
    // Remove special prefixes like [라이브특가], [못난이상품] etc.
    title = title.replace(/^\[.*?\]\s*/, '');
    
    // Extract vendor from title if present
    let vendor = rawProduct.vendor || '';
    
    // Ensure price is valid
    const price = rawProduct.price;
    if (!price || !this.isValidPrice(price)) {
      return null;
    }
    
    // Ensure image URL is valid
    let imageUrl = rawProduct.imageUrl;
    if (!imageUrl) {
      imageUrl = '';
    }
    
    // Improve category classification
    const category = this.improveCategory(title, rawProduct.category);
    
    return {
      id: `gwdmall_${rawProduct.id}`,
      title: title.trim(),
      price: price,
      originalPrice: rawProduct.originalPrice,
      imageUrl: imageUrl,
      productUrl: rawProduct.productUrl,
      category: category,
      vendor: vendor,
      mallId: 'gwdmall',
      mallName: '강원더몰',
      mallUrl: 'https://gwdmall.kr',
      region: '강원도'
    };
  }

  private improveCategory(title: string, currentCategory: string): string {
    const lowerTitle = title.toLowerCase();
    
    // More specific categorization
    if (lowerTitle.includes('닭갈비') || lowerTitle.includes('갈비') || lowerTitle.includes('고기') || 
        lowerTitle.includes('한우') || lowerTitle.includes('한돈') || lowerTitle.includes('스테이크')) {
      return '축산물';
    } else if (lowerTitle.includes('만두') || lowerTitle.includes('떡') || lowerTitle.includes('수제비') || 
               lowerTitle.includes('밀키트') || lowerTitle.includes('간편식')) {
      return '만두/간편식';
    } else if (lowerTitle.includes('쌀') || lowerTitle.includes('곡') || lowerTitle.includes('콩') || 
               lowerTitle.includes('옥수수')) {
      return '곡물/쌀';
    } else if (lowerTitle.includes('감자') || lowerTitle.includes('곤드레') || lowerTitle.includes('시래기') || 
               lowerTitle.includes('더덕') || lowerTitle.includes('곰취')) {
      return '채소/산채';
    } else if (lowerTitle.includes('성게') || lowerTitle.includes('다슬기') || lowerTitle.includes('명란') || 
               lowerTitle.includes('대게') || lowerTitle.includes('수산')) {
      return '수산물';
    } else if (lowerTitle.includes('꿀') || lowerTitle.includes('벌꿀')) {
      return '양봉제품';
    } else if (lowerTitle.includes('고추장') || lowerTitle.includes('청국장') || lowerTitle.includes('된장') || 
               lowerTitle.includes('기름') || lowerTitle.includes('장류')) {
      return '장류/조미료';
    } else if (lowerTitle.includes('주') || lowerTitle.includes('술') || lowerTitle.includes('막걸리')) {
      return '전통주';
    } else if (lowerTitle.includes('빵') || lowerTitle.includes('쿠키') || lowerTitle.includes('과자') || 
               lowerTitle.includes('초콜') || lowerTitle.includes('정과')) {
      return '과자/디저트';
    } else if (lowerTitle.includes('커피') || lowerTitle.includes('차') || lowerTitle.includes('음료')) {
      return '음료/차';
    } else {
      return '강원도특산품';
    }
  }

  private isValidPrice(price: string): boolean {
    const numericPrice = this.parsePrice(price);
    return numericPrice > 0 && numericPrice < 10000000;
  }

  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^\d]/g, '');
    return parseInt(cleanPrice) || 0;
  }

  private async registerProducts() {
    console.log('📝 Registering products to main database...');
    
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    let existingProducts: any[] = [];
    
    if (fs.existsSync(productsFile)) {
      const existingData = fs.readFileSync(productsFile, 'utf-8');
      existingProducts = JSON.parse(existingData);
    }
    
    console.log(`📥 Loaded ${existingProducts.length} existing products`);
    
    const newProducts = this.cleanProducts.filter(product => 
      !existingProducts.some(existing => existing.id === product.id)
    );
    
    console.log(`🆕 Found ${newProducts.length} new products to register`);
    
    if (newProducts.length === 0) {
      console.log('ℹ️  No new products to register');
      return;
    }
    
    const updatedProducts = [...existingProducts, ...newProducts];
    fs.writeFileSync(productsFile, JSON.stringify(updatedProducts, null, 2));
    
    const summary = {
      mallName: '강원더몰',
      mallUrl: 'https://gwdmall.kr',
      registeredAt: new Date().toISOString(),
      totalProductsProcessed: this.cleanProducts.length,
      newProductsRegistered: newProducts.length,
      existingProductsSkipped: this.cleanProducts.length - newProducts.length,
      categoriesRegistered: [...new Set(newProducts.map(p => p.category))],
      productsByCategory: newProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      priceRange: newProducts.length > 0 ? {
        min: Math.min(...newProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...newProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      } : { min: 0, max: 0 },
      sampleProducts: newProducts.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };
    
    const summaryFile = path.join(__dirname, 'output', 'gwdmall-registration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`📊 Registration Summary:`);
    console.log(`   New products registered: ${newProducts.length}`);
    console.log(`   Total products in database: ${updatedProducts.length}`);
    console.log(`   Categories: ${Object.keys(summary.productsByCategory).join(', ')}`);
    console.log(`   Price range: ₩${summary.priceRange.min?.toLocaleString()} - ₩${summary.priceRange.max?.toLocaleString()}`);
    console.log(`   Summary saved: ${summaryFile}`);
  }
}

async function main() {
  const registrar = new GwdMallProductRegistrar();
  await registrar.run();
}

if (require.main === module) {
  main().catch(console.error);
}