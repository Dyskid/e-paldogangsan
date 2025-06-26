import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  name?: string;
  price: string | number;
  imageUrl: string;
  productUrl: string;
  category: string;
  description?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags?: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
  vendor?: string;
  originalPrice?: string;
}

class GmsocialUrlFixer {
  private products: Product[] = [];
  private fixedCount = 0;

  async run() {
    console.log('🔧 Starting 광명가치몰 URL correction...');
    
    try {
      // Load products database
      await this.loadProducts();
      
      // Fix URLs
      await this.fixUrls();
      
      // Save updated products
      await this.saveProducts();
      
      console.log(`✅ URL correction completed! Fixed ${this.fixedCount} products`);
      
    } catch (error) {
      console.error('❌ Error during URL fixing:', error);
      throw error;
    }
  }

  private async loadProducts() {
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    
    if (!fs.existsSync(productsFile)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsFile, 'utf-8');
    this.products = JSON.parse(productsData);
    
    console.log(`📥 Loaded ${this.products.length} products`);
  }

  private async fixUrls() {
    console.log('🔧 Fixing 광명가치몰 URLs...');
    
    for (let i = 0; i < this.products.length; i++) {
      const product = this.products[i];
      
      // Check if this is a 광명가치몰 product
      if (this.isGmsocialProduct(product)) {
        const originalUrl = product.productUrl;
        const originalMallUrl = product.mallUrl;
        
        // Fix product URL
        const fixedProductUrl = this.fixProductUrl(originalUrl);
        
        // Fix mall URL
        const fixedMallUrl = 'http://gmsocial.mangotree.co.kr/mall/';
        
        if (fixedProductUrl !== originalUrl || fixedMallUrl !== originalMallUrl) {
          this.products[i] = {
            ...product,
            productUrl: fixedProductUrl,
            mallUrl: fixedMallUrl
          };
          
          this.fixedCount++;
          console.log(`  ✅ Fixed: ${product.id}`);
          console.log(`     Old: ${originalUrl}`);
          console.log(`     New: ${fixedProductUrl}`);
        }
      }
    }
    
    console.log(`🔧 Fixed URLs for ${this.fixedCount} 광명가치몰 products`);
  }

  private isGmsocialProduct(product: Product): boolean {
    if (!product) return false;
    
    return (
      (product.id && product.id.startsWith('gmsocial_')) ||
      (product.mallId && (product.mallId === 'gmsocial' || product.mallId === 'mall_12_광명가치몰')) ||
      (product.mallName && product.mallName === '광명가치몰') ||
      (product.productUrl && product.productUrl.includes('gmsocial'))
    );
  }

  private fixProductUrl(originalUrl: string): string {
    // Extract product ID from URL
    const productIdMatch = originalUrl.match(/product_id=(\d+)/);
    if (!productIdMatch) {
      console.warn(`⚠️  Could not extract product ID from: ${originalUrl}`);
      return originalUrl;
    }
    
    const productId = productIdMatch[1];
    
    // Create correct URL
    return `http://gmsocial.mangotree.co.kr/mall/goods/view.php?product_id=${productId}`;
  }

  private async saveProducts() {
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    
    // Create backup
    const backupFile = path.join(__dirname, 'output', `products-backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(this.products, null, 2));
    console.log(`💾 Backup created: ${backupFile}`);
    
    // Save updated products
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    console.log(`💾 Updated products saved: ${productsFile}`);
    
    // Save summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalProducts: this.products.length,
      gmsocialProductsFixed: this.fixedCount,
      oldDomain: 'https://gmsocial.or.kr',
      newDomain: 'http://gmsocial.mangotree.co.kr',
      urlPattern: {
        old: 'https://gmsocial.or.kr/mall/mall/goods/view.php?product_id=X',
        new: 'http://gmsocial.mangotree.co.kr/mall/goods/view.php?product_id=X'
      }
    };
    
    const summaryFile = path.join(__dirname, 'output', 'gmsocial-url-fix-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary saved: ${summaryFile}`);
  }
}

// Run the URL fixer
async function main() {
  const fixer = new GmsocialUrlFixer();
  await fixer.run();
}

if (require.main === module) {
  main().catch(console.error);
}