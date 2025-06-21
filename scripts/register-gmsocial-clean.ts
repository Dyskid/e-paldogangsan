import * as fs from 'fs';
import * as path from 'path';

interface GmsocialRawProduct {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  categoryCode: string;
  vendor?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

interface CleanProduct {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class GmsocialProductRegistrar {
  private rawProducts: GmsocialRawProduct[] = [];
  private cleanProducts: CleanProduct[] = [];

  async run() {
    console.log('🧹 Starting Gmsocial product cleaning and registration...');
    
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
    const rawProductsFile = path.join(__dirname, 'output', 'gmsocial-all-products.json');
    
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

  private cleanSingleProduct(rawProduct: GmsocialRawProduct): CleanProduct | null {
    // Clean title - remove vendor name and extra whitespace
    let title = rawProduct.title.replace(/\s+/g, ' ').trim();
    
    // Extract vendor from title if it's at the beginning
    let vendor = rawProduct.vendor || '';
    
    const vendorPatterns = [
      '주식회사 삼호푸드',
      '이웃컴퍼니',
      '행원 맛드림',
      '협동조합 담다',
      '공예협동조합 손수지음',
      '시니온협동조합',
      '크린환경',
      '미앤드',
      '선옻칠',
      '재미있는생각씨앗코딩',
      '늘품애협동조합',
      '주식회사 안녕',
      '청소년플러스끌림',
      '광명심포니오케스트라',
      '주식회사 베어',
      '주식회사 제일디자인'
    ];
    
    for (const vendorPattern of vendorPatterns) {
      if (title.includes(vendorPattern)) {
        vendor = vendorPattern;
        title = title.replace(vendorPattern, '').trim();
        break;
      }
    }
    
    // Clean price - extract the actual price value
    let price = this.extractCleanPrice(rawProduct.price);
    
    if (!price || price === '0원' || !this.isValidPrice(price)) {
      return null;
    }
    
    // Clean image URL
    let imageUrl = rawProduct.imageUrl || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('/')) {
        imageUrl = 'https://gmsocial.or.kr' + imageUrl;
      } else {
        imageUrl = 'https://gmsocial.or.kr/mall/' + imageUrl;
      }
    }
    
    // Clean product URL
    let productUrl = rawProduct.productUrl;
    if (productUrl.includes('//mall/')) {
      productUrl = productUrl.replace('//mall/', '/mall/');
    }
    if (!productUrl.startsWith('http')) {
      productUrl = 'https://gmsocial.or.kr' + productUrl;
    }
    
    return {
      id: `gmsocial_${rawProduct.id}`,
      title: title,
      price: price,
      imageUrl: imageUrl,
      productUrl: productUrl,
      category: rawProduct.category,
      vendor: vendor,
      mallId: 'gmsocial',
      mallName: '광명가치몰',
      mallUrl: 'https://gmsocial.or.kr/mall/',
      region: '경기도 광명시'
    };
  }

  private extractCleanPrice(priceText: string): string {
    let cleanText = priceText.replace(/\s+/g, ' ').trim();
    
    const pricePatterns = [
      /([0-9,]+원)/g,
      /₩([0-9,]+)/g,
      /([0-9]{1,3}(?:,[0-9]{3})*)/g
    ];
    
    const prices: string[] = [];
    
    for (const pattern of pricePatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (match.includes('원') || match.includes('₩')) {
            prices.push(match);
          } else if (/^[0-9]{1,3}(?:,[0-9]{3})*$/.test(match)) {
            prices.push(match + '원');
          }
        }
      }
    }
    
    if (prices.length > 0) {
      const singlePrices = prices.filter(p => this.parsePrice(p) < 1000000);
      if (singlePrices.length > 0) {
        return singlePrices[0];
      }
      return prices[0];
    }
    
    return '';
  }

  private isValidPrice(price: string): boolean {
    const numericPrice = this.parsePrice(price);
    return numericPrice > 0 && numericPrice < 10000000;
  }

  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^0-9]/g, '');
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
      mallName: '광명가치몰',
      mallUrl: 'https://gmsocial.or.kr/mall/',
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
        category: p.category,
        vendor: p.vendor
      }))
    };
    
    const summaryFile = path.join(__dirname, 'output', 'gmsocial-registration-summary.json');
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
  const registrar = new GmsocialProductRegistrar();
  await registrar.run();
}

if (require.main === module) {
  main().catch(console.error);
}