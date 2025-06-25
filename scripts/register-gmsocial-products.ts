import * as fs from 'fs';
import * as path from 'path';

interface ExtractedProduct {
  productId: string;
  name: string;
  companyName: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl: string;
  productUrl: string;
  rating?: number;
  reviewCount?: number;
  delivery?: string;
  mallName: string;
}

interface RegisteredProduct {
  id: string;
  title: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

class GmsocialProductRegistrar {
  private baseUrl = 'https://gmsocial.or.kr/mall/';
  
  async run() {
    console.log('📋 Starting 광명가치몰 product registration...');
    
    try {
      // Read existing extracted products
      const extractedFile = path.join(__dirname, 'output', 'gmsocial-extracted-products.json');
      const extractedData = JSON.parse(fs.readFileSync(extractedFile, 'utf-8'));
      
      // Read verification report for additional data
      const verificationFile = path.join(__dirname, 'output', 'gmsocial-verification-report.json');
      const verificationData = JSON.parse(fs.readFileSync(verificationFile, 'utf-8'));
      
      // Map categories from verification data
      const categoryMap = this.buildCategoryMap(verificationData);
      
      // Process and register products
      const registeredProducts: RegisteredProduct[] = [];
      
      for (const extracted of extractedData) {
        const registered = this.transformProduct(extracted, categoryMap);
        registeredProducts.push(registered);
        console.log(`✅ Registered: ${registered.name} - ${registered.price}`);
      }
      
      // Additional products from verification report that might not be in extracted
      if (verificationData.sampleProducts) {
        for (const sample of verificationData.sampleProducts) {
          if (!registeredProducts.find(p => p.id === sample.id)) {
            const registered = this.createFromSample(sample, verificationData.mallName);
            if (registered) {
              registeredProducts.push(registered);
              console.log(`✅ Added from verification: ${registered.name}`);
            }
          }
        }
      }
      
      console.log(`\n📊 Total products registered: ${registeredProducts.length}`);
      
      // Save registered products
      await this.saveResults(registeredProducts);
      
    } catch (error) {
      console.error('❌ Error during registration:', error);
      throw error;
    }
  }
  
  private buildCategoryMap(verificationData: any): Map<string, string> {
    const map = new Map<string, string>();
    
    // Extract categories from sample products
    if (verificationData.sampleProducts) {
      for (const product of verificationData.sampleProducts) {
        if (product.id && product.category) {
          const productNum = product.id.replace('gmsocial_', '');
          map.set(productNum, product.category);
        }
      }
    }
    
    return map;
  }
  
  private transformProduct(extracted: ExtractedProduct, categoryMap: Map<string, string>): RegisteredProduct {
    const category = categoryMap.get(extracted.productId) || this.inferCategory(extracted.name);
    
    return {
      id: `gmsocial_${extracted.productId}`,
      title: extracted.name,
      name: extracted.name,
      price: `${extracted.price.toLocaleString()}원`,
      originalPrice: extracted.originalPrice ? `${extracted.originalPrice.toLocaleString()}원` : undefined,
      imageUrl: extracted.imageUrl || '',
      productUrl: extracted.productUrl.startsWith('http') 
        ? extracted.productUrl 
        : `https://gmsocial.or.kr${extracted.productUrl}`,
      category: category,
      vendor: extracted.companyName || '',
      description: extracted.name,
      mallId: 'mall_12_광명가치몰',
      mallName: '광명가치몰',
      mallUrl: this.baseUrl,
      region: '경기',
      tags: [category, extracted.companyName].filter(Boolean),
      featured: false,
      isNew: false,
      clickCount: 0,
      lastVerified: new Date().toISOString()
    };
  }
  
  private createFromSample(sample: any, mallName: string): RegisteredProduct | null {
    if (!sample.id || !sample.title || !sample.price) {
      return null;
    }
    
    return {
      id: sample.id,
      title: sample.title,
      name: sample.title,
      price: sample.price,
      imageUrl: sample.imageUrl === 'Yes' ? '' : (sample.imageUrl || ''),
      productUrl: sample.productUrl || '',
      category: sample.category || '기타',
      vendor: sample.vendor || '',
      description: sample.title,
      mallId: 'mall_12_광명가치몰',
      mallName: mallName || '광명가치몰',
      mallUrl: this.baseUrl,
      region: '경기',
      tags: [sample.category, sample.vendor].filter(Boolean),
      featured: false,
      isNew: false,
      clickCount: 0,
      lastVerified: new Date().toISOString()
    };
  }
  
  private inferCategory(productName: string): string {
    const name = productName.toLowerCase();
    
    if (name.includes('고등어') || name.includes('설탕') || name.includes('생강') || 
        name.includes('시럽') || name.includes('도시락') || name.includes('쿠키') || 
        name.includes('커피') || name.includes('밥')) {
      return '식품';
    } else if (name.includes('디퓨저') || name.includes('오일') || name.includes('청소') || 
               name.includes('비누') || name.includes('세제')) {
      return '생활/리빙';
    } else if (name.includes('가방') || name.includes('지갑') || name.includes('파우치')) {
      return '패션/뷰티';
    } else if (name.includes('교육') || name.includes('코딩') || name.includes('클래스')) {
      return '교육/체험';
    } else if (name.includes('소독') || name.includes('방역')) {
      return '서비스';
    } else if (name.includes('공예') || name.includes('도자기')) {
      return '공예품';
    } else {
      return '기타';
    }
  }
  
  private async saveResults(products: RegisteredProduct[]) {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save registered products
    const productsFile = path.join(outputDir, 'gmsocial-registered-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '광명가치몰',
      mallId: 'mall_12_광명가치몰',
      mallUrl: this.baseUrl,
      registeredAt: new Date().toISOString(),
      totalProducts: products.length,
      productsByCategory: products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      productsByVendor: products.reduce((acc, product) => {
        if (product.vendor) {
          acc[product.vendor] = (acc[product.vendor] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      priceRange: {
        min: Math.min(...products.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...products.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      },
      dataQuality: {
        withImages: products.filter(p => p.imageUrl).length,
        withVendors: products.filter(p => p.vendor).length,
        withCategories: products.filter(p => p.category !== '기타').length
      }
    };
    
    const summaryFile = path.join(outputDir, 'gmsocial-registration-summary-final.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📁 Results saved:`);
    console.log(`   Products: ${productsFile}`);
    console.log(`   Summary: ${summaryFile}`);
    console.log(`\n📊 Registration Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Categories: ${Object.keys(summary.productsByCategory).join(', ')}`);
    console.log(`   Vendors: ${Object.keys(summary.productsByVendor).length}`);
    console.log(`   Price range: ${summary.priceRange.min}원 - ${summary.priceRange.max}원`);
  }
  
  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^\d]/g, '');
    return parseInt(cleanPrice) || 0;
  }
}

// Run the registrar
async function main() {
  const registrar = new GmsocialProductRegistrar();
  await registrar.run();
}

if (require.main === module) {
  main().catch(console.error);
}