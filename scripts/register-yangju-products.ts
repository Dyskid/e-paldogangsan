import * as fs from 'fs';
import * as path from 'path';

interface YangjuProduct {
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

class YangjuProductRegistrar {
  private rawProducts: YangjuProduct[] = [];
  private cleanProducts: any[] = [];

  async run() {
    console.log('📝 Starting Yangju product registration...');
    
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
    const rawProductsFile = path.join(__dirname, 'output', 'yangju-careful-products.json');
    
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

  private cleanSingleProduct(rawProduct: YangjuProduct): any | null {
    // Extract vendor from title if present in brackets
    let title = rawProduct.title;
    let vendor = '';
    
    const vendorMatch = title.match(/^\[([^\]]+)\]\s*(.+)/);
    if (vendorMatch) {
      vendor = vendorMatch[1];
      title = vendorMatch[2];
    }
    
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
    
    return {
      id: `yangju_${rawProduct.id}`,
      title: title.trim(),
      price: price,
      imageUrl: imageUrl,
      productUrl: rawProduct.productUrl,
      category: '농산물', // Default to agricultural products
      vendor: vendor || rawProduct.vendor || '',
      mallId: 'yangju',
      mallName: '양주농부마켓',
      mallUrl: 'https://market.yangju.go.kr',
      region: '경기도 양주시'
    };
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
      mallName: '양주농부마켓',
      mallUrl: 'https://market.yangju.go.kr',
      registeredAt: new Date().toISOString(),
      totalProductsProcessed: this.cleanProducts.length,
      newProductsRegistered: newProducts.length,
      existingProductsSkipped: this.cleanProducts.length - newProducts.length,
      vendors: [...new Set(newProducts.map(p => p.vendor).filter(v => v))],
      priceRange: newProducts.length > 0 ? {
        min: Math.min(...newProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...newProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      } : { min: 0, max: 0 },
      sampleProducts: newProducts.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        vendor: p.vendor
      }))
    };
    
    const summaryFile = path.join(__dirname, 'output', 'yangju-registration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`📊 Registration Summary:`);
    console.log(`   New products registered: ${newProducts.length}`);
    console.log(`   Total products in database: ${updatedProducts.length}`);
    console.log(`   Vendors: ${summary.vendors.length} unique vendors`);
    console.log(`   Price range: ₩${summary.priceRange.min?.toLocaleString()} - ₩${summary.priceRange.max?.toLocaleString()}`);
    console.log(`   Summary saved: ${summaryFile}`);
  }
}

async function main() {
  const registrar = new YangjuProductRegistrar();
  await registrar.run();
}

if (require.main === module) {
  main().catch(console.error);
}