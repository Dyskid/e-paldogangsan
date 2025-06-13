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

interface MallAnalysis {
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  productCount: number;
  urlPatterns: string[];
  imagePatterns: string[];
  titlePatterns: string[];
  needsUpdate: boolean;
  updateReasons: string[];
}

class AllMallsAnalyzer {
  async analyzeAllMalls(): Promise<void> {
    console.log('🔍 Analyzing all malls and their products for authenticity updates...\n');
    
    // Load data
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
    
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const malls: Mall[] = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
    
    console.log(`📊 Total products: ${products.length}`);
    console.log(`📊 Total malls: ${malls.length}\n`);
    
    // Group products by mall
    const productsByMall = new Map<string, Product[]>();
    products.forEach(product => {
      if (!productsByMall.has(product.mallId)) {
        productsByMall.set(product.mallId, []);
      }
      productsByMall.get(product.mallId)!.push(product);
    });
    
    // Analyze each mall
    const analyses: MallAnalysis[] = [];
    
    for (const mall of malls) {
      const mallProducts = productsByMall.get(mall.id) || [];
      const analysis = this.analyzeMall(mall, mallProducts);
      analyses.push(analysis);
      
      console.log(`🏪 ${analysis.mallName} (${analysis.mallId})`);
      console.log(`   Region: ${analysis.region}`);
      console.log(`   Products: ${analysis.productCount}`);
      console.log(`   Mall URL: ${analysis.mallUrl}`);
      
      if (analysis.productCount > 0) {
        console.log(`   URL Patterns: ${analysis.urlPatterns.join(', ')}`);
        console.log(`   Image Patterns: ${analysis.imagePatterns.join(', ')}`);
        console.log(`   Needs Update: ${analysis.needsUpdate ? '❌ YES' : '✅ NO'}`);
        if (analysis.needsUpdate) {
          console.log(`   Reasons: ${analysis.updateReasons.join(', ')}`);
        }
      } else {
        console.log(`   ⚠️ No products found`);
      }
      console.log('');
    }
    
    // Generate summary
    this.generateSummary(analyses);
    
    // Save analysis
    const outputPath = path.join(__dirname, 'output', 'all-malls-analysis.json');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalMalls: malls.length,
      totalProducts: products.length,
      analyses
    }, null, 2));
    
    console.log(`\n📁 Full analysis saved to: ${outputPath}`);
  }
  
  private analyzeMall(mall: Mall, products: Product[]): MallAnalysis {
    const analysis: MallAnalysis = {
      mallId: mall.id,
      mallName: mall.name,
      mallUrl: mall.url,
      region: mall.region,
      productCount: products.length,
      urlPatterns: [],
      imagePatterns: [],
      titlePatterns: [],
      needsUpdate: false,
      updateReasons: []
    };
    
    if (products.length === 0) {
      return analysis;
    }
    
    // Analyze URL patterns
    const urlDomains = new Set<string>();
    const urlPatterns = new Set<string>();
    
    products.forEach(product => {
      try {
        const url = new URL(product.productUrl);
        urlDomains.add(url.hostname);
        
        // Extract pattern
        const pathname = url.pathname;
        const pattern = pathname.replace(/\/\d+/g, '/[id]').replace(/\d+/g, '[id]');
        urlPatterns.add(pattern);
      } catch (e) {
        // Invalid URL
        urlPatterns.add('INVALID_URL');
      }
    });
    
    analysis.urlPatterns = Array.from(urlPatterns);
    
    // Analyze image patterns
    const imageHosts = new Set<string>();
    const imagePatterns = new Set<string>();
    
    products.forEach(product => {
      try {
        const url = new URL(product.imageUrl);
        imageHosts.add(url.hostname);
        
        if (url.hostname.includes('unsplash.com')) {
          imagePatterns.add('PLACEHOLDER_UNSPLASH');
        } else if (url.hostname.includes('example.com')) {
          imagePatterns.add('PLACEHOLDER_EXAMPLE');
        } else {
          imagePatterns.add('REAL_IMAGE');
        }
      } catch (e) {
        imagePatterns.add('INVALID_IMAGE_URL');
      }
    });
    
    analysis.imagePatterns = Array.from(imagePatterns);
    
    // Analyze title patterns
    const titlePatterns = new Set<string>();
    
    products.forEach(product => {
      if (product.name.includes('상품') && /\d+/.test(product.name)) {
        titlePatterns.add('GENERIC_NUMBERED');
      } else if (product.name.includes('특산품') || product.name.includes('직배송')) {
        titlePatterns.add('GENERIC_DESCRIPTION');
      } else if (product.name.includes('[') && product.name.includes(']')) {
        titlePatterns.add('BRANDED_TITLE');
      } else {
        titlePatterns.add('REGULAR_TITLE');
      }
    });
    
    analysis.titlePatterns = Array.from(titlePatterns);
    
    // Determine if needs update
    const reasons: string[] = [];
    
    // Check URLs
    if (analysis.urlPatterns.includes('INVALID_URL')) {
      reasons.push('Invalid URLs');
    }
    
    if (!Array.from(urlDomains).some(domain => mall.url.includes(domain))) {
      reasons.push('URL domain mismatch');
    }
    
    // Check images
    if (analysis.imagePatterns.includes('PLACEHOLDER_UNSPLASH') || 
        analysis.imagePatterns.includes('PLACEHOLDER_EXAMPLE') ||
        analysis.imagePatterns.includes('INVALID_IMAGE_URL')) {
      reasons.push('Placeholder/invalid images');
    }
    
    // Check titles
    if (analysis.titlePatterns.includes('GENERIC_NUMBERED') ||
        analysis.titlePatterns.includes('GENERIC_DESCRIPTION')) {
      reasons.push('Generic titles');
    }
    
    analysis.needsUpdate = reasons.length > 0;
    analysis.updateReasons = reasons;
    
    return analysis;
  }
  
  private generateSummary(analyses: MallAnalysis[]): void {
    console.log('📋 COMPREHENSIVE ANALYSIS SUMMARY');
    console.log('==================================\n');
    
    const totalMalls = analyses.length;
    const mallsWithProducts = analyses.filter(a => a.productCount > 0).length;
    const mallsNeedingUpdate = analyses.filter(a => a.needsUpdate).length;
    const totalProducts = analyses.reduce((sum, a) => sum + a.productCount, 0);
    
    console.log(`📊 Total malls: ${totalMalls}`);
    console.log(`📊 Malls with products: ${mallsWithProducts}`);
    console.log(`📊 Malls needing updates: ${mallsNeedingUpdate}`);
    console.log(`📊 Total products: ${totalProducts}\n`);
    
    // Most common issues
    const issueCount = new Map<string, number>();
    analyses.forEach(analysis => {
      analysis.updateReasons.forEach(reason => {
        issueCount.set(reason, (issueCount.get(reason) || 0) + 1);
      });
    });
    
    console.log('🔍 Most common issues:');
    Array.from(issueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        console.log(`   ${issue}: ${count} malls`);
      });
    
    console.log('\n🚨 Priority malls needing immediate updates:');
    analyses
      .filter(a => a.needsUpdate && a.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 10)
      .forEach(analysis => {
        console.log(`   ${analysis.mallName}: ${analysis.productCount} products - ${analysis.updateReasons.join(', ')}`);
      });
  }
}

async function main() {
  const analyzer = new AllMallsAnalyzer();
  await analyzer.analyzeAllMalls();
}

if (require.main === module) {
  main().catch(console.error);
}