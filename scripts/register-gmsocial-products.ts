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
      // Load raw scraped products
      await this.loadRawProducts();
      
      // Clean and process products
      await this.cleanProducts();
      
      // Register products to main database
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

  private async cleanProducts() {
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
  }\n\n  private cleanSingleProduct(rawProduct: GmsocialRawProduct): CleanProduct | null {\n    // Clean title - remove vendor name and extra whitespace\n    let title = rawProduct.title.replace(/\\s+/g, ' ').trim();\n    \n    // Extract vendor from title if it's at the beginning\n    let vendor = rawProduct.vendor || '';\n    \n    // If title starts with vendor name, remove it\n    const vendorPatterns = [\n      '주식회사 삼호푸드',\n      '이웃컴퍼니',\n      '행원 맛드림',\n      '협동조합 담다',\n      '공예협동조합 손수지음',\n      '시니온협동조합',\n      '크린환경',\n      '미앤드',\n      '선옻칠',\n      '재미있는생각씨앗코딩',\n      '늘품애협동조합',\n      '주식회사 안녕',\n      '청소년플러스끌림',\n      '광명심포니오케스트라',\n      '주식회사 베어',\n      '주식회사 제일디자인'\n    ];\n    \n    for (const vendorPattern of vendorPatterns) {\n      if (title.includes(vendorPattern)) {\n        vendor = vendorPattern;\n        title = title.replace(vendorPattern, '').trim();\n        break;\n      }\n    }\n    \n    // Clean price - extract the actual price value\n    let price = this.extractCleanPrice(rawProduct.price);\n    \n    // Skip products without valid price\n    if (!price || price === '0원' || !this.isValidPrice(price)) {\n      return null;\n    }\n    \n    // Clean image URL\n    let imageUrl = rawProduct.imageUrl || '';\n    if (imageUrl && !imageUrl.startsWith('http')) {\n      if (imageUrl.startsWith('/')) {\n        imageUrl = 'https://gmsocial.or.kr' + imageUrl;\n      } else {\n        imageUrl = 'https://gmsocial.or.kr/mall/' + imageUrl;\n      }\n    }\n    \n    // Clean product URL\n    let productUrl = rawProduct.productUrl;\n    if (productUrl.includes('//mall/')) {\n      productUrl = productUrl.replace('//mall/', '/mall/');\n    }\n    if (!productUrl.startsWith('http')) {\n      productUrl = 'https://gmsocial.or.kr' + productUrl;\n    }\n    \n    return {\n      id: `gmsocial_${rawProduct.id}`,\n      title: title,\n      price: price,\n      imageUrl: imageUrl,\n      productUrl: productUrl,\n      category: rawProduct.category,\n      vendor: vendor,\n      mallId: 'gmsocial',\n      mallName: '광명가치몰',\n      mallUrl: 'https://gmsocial.or.kr/mall/',\n      region: '경기도 광명시'\n    };\n  }\n\n  private extractCleanPrice(priceText: string): string {\n    // Remove all whitespace and tabs\n    let cleanText = priceText.replace(/\\s+/g, ' ').trim();\n    \n    // Look for price patterns\n    const pricePatterns = [\n      /([\\d,]+원)/g,\n      /₩([\\d,]+)/g,\n      /(\\d{1,3}(?:,\\d{3})*)/g\n    ];\n    \n    const prices: string[] = [];\n    \n    for (const pattern of pricePatterns) {\n      const matches = cleanText.match(pattern);\n      if (matches) {\n        for (const match of matches) {\n          if (match.includes('원') || match.includes('₩')) {\n            prices.push(match);\n          } else if (/^\\d{1,3}(?:,\\d{3})*$/.test(match)) {\n            prices.push(match + '원');\n          }\n        }\n      }\n    }\n    \n    // If we found prices, return the first valid one\n    if (prices.length > 0) {\n      // If there are multiple prices, prefer the one without comma (usually the discounted price)\n      const singlePrices = prices.filter(p => !p.includes(',') || this.parsePrice(p) < 1000000);\n      if (singlePrices.length > 0) {\n        return singlePrices[0];\n      }\n      return prices[0];\n    }\n    \n    return '';\n  }\n\n  private isValidPrice(price: string): boolean {\n    const numericPrice = this.parsePrice(price);\n    return numericPrice > 0 && numericPrice < 10000000; // Reasonable price range\n  }\n\n  private parsePrice(priceStr: string): number {\n    const cleanPrice = priceStr.replace(/[^\\d]/g, '');\n    return parseInt(cleanPrice) || 0;\n  }\n\n  private async registerProducts() {\n    console.log('📝 Registering products to main database...');\n    \n    // Load existing products\n    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');\n    let existingProducts: any[] = [];\n    \n    if (fs.existsSync(productsFile)) {\n      const existingData = fs.readFileSync(productsFile, 'utf-8');\n      existingProducts = JSON.parse(existingData);\n    }\n    \n    console.log(`📥 Loaded ${existingProducts.length} existing products`);\n    \n    // Filter out products that already exist\n    const newProducts = this.cleanProducts.filter(product => \n      !existingProducts.some(existing => existing.id === product.id)\n    );\n    \n    console.log(`🆕 Found ${newProducts.length} new products to register`);\n    \n    if (newProducts.length === 0) {\n      console.log('ℹ️  No new products to register');\n      return;\n    }\n    \n    // Add new products\n    const updatedProducts = [...existingProducts, ...newProducts];\n    \n    // Save updated products\n    fs.writeFileSync(productsFile, JSON.stringify(updatedProducts, null, 2));\n    \n    // Save registration summary\n    const summary = {\n      mallName: '광명가치몰',\n      mallUrl: 'https://gmsocial.or.kr/mall/',\n      registeredAt: new Date().toISOString(),\n      totalProductsProcessed: this.cleanProducts.length,\n      newProductsRegistered: newProducts.length,\n      existingProductsSkipped: this.cleanProducts.length - newProducts.length,\n      categoriesRegistered: [...new Set(newProducts.map(p => p.category))],\n      productsByCategory: newProducts.reduce((acc, product) => {\n        acc[product.category] = (acc[product.category] || 0) + 1;\n        return acc;\n      }, {} as Record<string, number>),\n      priceRange: newProducts.length > 0 ? {\n        min: Math.min(...newProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0)),\n        max: Math.max(...newProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0))\n      } : { min: 0, max: 0 },\n      sampleProducts: newProducts.slice(0, 10).map(p => ({\n        id: p.id,\n        title: p.title,\n        price: p.price,\n        category: p.category,\n        vendor: p.vendor\n      }))\n    };\n    \n    const summaryFile = path.join(__dirname, 'output', 'gmsocial-registration-summary.json');\n    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));\n    \n    console.log(`📊 Registration Summary:`);\n    console.log(`   New products registered: ${newProducts.length}`);\n    console.log(`   Total products in database: ${updatedProducts.length}`);\n    console.log(`   Categories: ${Object.keys(summary.productsByCategory).join(', ')}`);\n    console.log(`   Price range: ₩${summary.priceRange.min?.toLocaleString()} - ₩${summary.priceRange.max?.toLocaleString()}`);\n    console.log(`   Summary saved: ${summaryFile}`);\n  }\n}\n\n// Run the registrar\nasync function main() {\n  const registrar = new GmsocialProductRegistrar();\n  await registrar.run();\n}\n\nif (require.main === module) {\n  main().catch(console.error);\n}