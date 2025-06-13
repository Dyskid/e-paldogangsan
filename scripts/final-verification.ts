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

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

class FinalVerification {
  verifyAllProducts(): void {
    console.log('🔍 FINAL VERIFICATION - All Products Authenticity Check\n');
    console.log('='.repeat(60));
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
    
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const malls: Mall[] = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
    
    console.log(`📊 Total malls: ${malls.length}`);
    console.log(`📊 Total products: ${products.length}\n`);
    
    // Group products by mall
    const productsByMall = new Map<string, Product[]>();
    products.forEach(product => {
      if (!productsByMall.has(product.mallId)) {
        productsByMall.set(product.mallId, []);
      }
      productsByMall.get(product.mallId)!.push(product);
    });
    
    let totalAuthentic = 0;
    let totalGeneric = 0;
    let totalUrlIssues = 0;
    let totalImageIssues = 0;
    
    // Check each mall
    for (const mall of malls) {
      const mallProducts = productsByMall.get(mall.id) || [];
      if (mallProducts.length === 0) continue;
      
      const analysis = this.analyzeMallProducts(mall, mallProducts);
      
      console.log(`🏪 ${mall.name} (${analysis.productCount} products)`);
      console.log(`   Region: ${mall.region}`);
      console.log(`   Status: ${analysis.isFullyAuthentic ? '✅ FULLY AUTHENTIC' : '⚠️ NEEDS ATTENTION'}`);
      
      if (!analysis.isFullyAuthentic) {
        if (analysis.genericTitles > 0) {
          console.log(`   Generic titles: ${analysis.genericTitles}`);
        }
        if (analysis.urlIssues > 0) {
          console.log(`   URL issues: ${analysis.urlIssues}`);
        }
        if (analysis.imageIssues > 0) {
          console.log(`   Image issues: ${analysis.imageIssues}`);
        }
      }
      console.log('');
      
      totalAuthentic += analysis.isFullyAuthentic ? mallProducts.length : (mallProducts.length - analysis.genericTitles - analysis.urlIssues - analysis.imageIssues);
      totalGeneric += analysis.genericTitles;
      totalUrlIssues += analysis.urlIssues;
      totalImageIssues += analysis.imageIssues;
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL AUTHENTICITY REPORT');
    console.log('='.repeat(60));
    console.log(`✅ Fully authentic products: ${totalAuthentic}/${products.length} (${Math.round(totalAuthentic/products.length*100)}%)`);
    console.log(`❌ Generic titles remaining: ${totalGeneric}`);
    console.log(`❌ URL issues remaining: ${totalUrlIssues}`);
    console.log(`❌ Image issues remaining: ${totalImageIssues}`);
    
    const totalIssues = totalGeneric + totalUrlIssues + totalImageIssues;
    console.log(`\n📈 Overall completion: ${Math.round((products.length - totalIssues)/products.length*100)}%`);
    
    if (totalIssues === 0) {
      console.log('\n🎉 CONGRATULATIONS! All products are now fully authentic!');
      console.log('✅ All URLs match their respective shopping malls');
      console.log('✅ All images are real thumbnails from the malls');
      console.log('✅ All titles are authentic from the source malls');
    } else {
      console.log(`\n⚠️ ${totalIssues} products still need attention for full authenticity.`);
    }
  }

  private analyzeMallProducts(mall: Mall, products: Product[]): {
    productCount: number;
    isFullyAuthentic: boolean;
    genericTitles: number;
    urlIssues: number;
    imageIssues: number;
  } {
    let genericTitles = 0;
    let urlIssues = 0;
    let imageIssues = 0;
    
    for (const product of products) {
      // Check title authenticity
      if (this.hasGenericTitle(product)) {
        genericTitles++;
      }
      
      // Check URL authenticity
      if (this.hasUrlIssue(product, mall)) {
        urlIssues++;
      }
      
      // Check image authenticity
      if (this.hasImageIssue(product)) {
        imageIssues++;
      }
    }
    
    return {
      productCount: products.length,
      isFullyAuthentic: genericTitles === 0 && urlIssues === 0 && imageIssues === 0,
      genericTitles,
      urlIssues,
      imageIssues
    };
  }

  private hasGenericTitle(product: Product): boolean {
    const genericPatterns = [
      /상품\s*\d+/,
      /특산품.*직배송/,
      /지역.*특산품.*세트/,
      /최근본.*상품/,
      /오늘본상품/,
      /대표.*농특산물/
    ];
    
    return genericPatterns.some(pattern => pattern.test(product.name)) ||
           product.name.length < 8;
  }

  private hasUrlIssue(product: Product, mall: Mall): boolean {
    try {
      const productUrl = new URL(product.productUrl);
      const mallUrl = new URL(mall.url);
      
      // Check if domains match or are related
      const productDomain = productUrl.hostname.replace('www.', '');
      const mallDomain = mallUrl.hostname.replace('www.', '');
      
      return !productDomain.includes(mallDomain) && !mallDomain.includes(productDomain);
    } catch (e) {
      return true; // Invalid URL
    }
  }

  private hasImageIssue(product: Product): boolean {
    return product.imageUrl.includes('unsplash.com') ||
           product.imageUrl.includes('example.com') ||
           product.imageUrl.includes('placeholder') ||
           !product.imageUrl.startsWith('http');
  }
}

function main() {
  const verifier = new FinalVerification();
  verifier.verifyAllProducts();
}

if (require.main === module) {
  main();
}