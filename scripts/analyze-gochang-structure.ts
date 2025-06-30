import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface StructureAnalysis {
  timestamp: string;
  mall: string;
  url: string;
  platform: string;
  links: {
    total: number;
    unique: number;
    products: string[];
    categories: string[];
    other: string[];
  };
  navigation: any[];
  productPatterns: string[];
  categoryPatterns: string[];
  analysis: string;
}

async function analyzeGochangStructure() {
  console.log('🔍 Analyzing 고창마켓 structure...');

  const baseUrl = 'https://noblegochang.com';
  
  try {
    const response = await axios.get(baseUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    console.log('✅ Successfully loaded homepage');

    // Save homepage for analysis
    const outputPath = path.join(__dirname, 'output');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    fs.writeFileSync(path.join(outputPath, 'gochang-homepage.html'), response.data);

    // Extract all links
    const allLinks: string[] = [];
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        if (href.startsWith('/')) {
          allLinks.push(baseUrl + href);
        } else if (href.startsWith('http')) {
          allLinks.push(href);
        }
      }
    });

    const uniqueLinks = [...new Set(allLinks)].filter(link => link.includes('noblegochang.com'));
    
    console.log(`📊 Found ${allLinks.length} total links, ${uniqueLinks.length} unique`);

    // Categorize links
    const patterns = {
      products: uniqueLinks.filter(link => 
        link.includes('product') || 
        link.includes('goods') || 
        link.includes('item') ||
        link.includes('/shop/') ||
        link.includes('view') ||
        link.match(/\/\d+$/) ||
        link.includes('detail')
      ),
      categories: uniqueLinks.filter(link => 
        link.includes('category') || 
        link.includes('list') || 
        link.includes('cate') ||
        link.includes('type') ||
        link.includes('kind')
      ),
      other: uniqueLinks.filter(link => 
        !link.includes('product') && 
        !link.includes('goods') && 
        !link.includes('item') &&
        !link.includes('/shop/') &&
        !link.includes('category') && 
        !link.includes('list') && 
        !link.includes('cate') &&
        !link.includes('view') &&
        !link.match(/\/\d+$/) &&
        !link.includes('detail') &&
        !link.includes('type') &&
        !link.includes('kind')
      )
    };

    // Extract navigation structure
    const navigation: any[] = [];
    $('nav, .menu, .navigation, .nav, .gnb').each((_, element) => {
      const navText = $(element).text().trim();
      const navLinks = $(element).find('a').map((_, a) => ({
        text: $(a).text().trim(),
        href: $(a).attr('href')
      })).get();
      
      if (navText || navLinks.length > 0) {
        navigation.push({
          element: element.tagName,
          text: navText.substring(0, 200),
          links: navLinks
        });
      }
    });

    // Look for common Korean shopping mall patterns
    const productPatterns: string[] = [];
    const categoryPatterns: string[] = [];

    // Check for common patterns
    if (patterns.products.some(link => link.includes('/shop/'))) {
      productPatterns.push('/shop/ - Standard shop URLs');
    }
    if (patterns.products.some(link => link.includes('/product/'))) {
      productPatterns.push('/product/ - Product detail pages');
    }
    if (patterns.products.some(link => link.match(/\/\d+$/))) {
      productPatterns.push('Numeric IDs - Product ID based URLs');
    }

    // Analyze page structure
    let analysis = '';
    
    // Check for meta generator
    const generator = $('meta[name="generator"]').attr('content');
    if (generator) {
      analysis += `Platform: ${generator}\n`;
    }

    // Check for common shopping mall indicators
    const hasCart = $('.cart, .shopping-cart, .장바구니').length > 0;
    const hasProduct = $('.product, .goods, .item, .상품').length > 0;
    const hasPrice = $('.price, .cost, .amount, .가격, .원').length > 0;

    analysis += `Shopping features: Cart(${hasCart}), Products(${hasProduct}), Prices(${hasPrice})\n`;

    // Check page title and meta
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    
    analysis += `Title: ${title}\n`;
    analysis += `Description: ${description}\n`;

    const structureAnalysis: StructureAnalysis = {
      timestamp: new Date().toISOString(),
      mall: '고창마켓',
      url: baseUrl,
      platform: generator || 'Unknown',
      links: {
        total: allLinks.length,
        unique: uniqueLinks.length,
        products: patterns.products,
        categories: patterns.categories,
        other: patterns.other.slice(0, 20) // Limit to first 20
      },
      navigation,
      productPatterns,
      categoryPatterns,
      analysis
    };

    // Save analysis
    const analysisPath = path.join(outputPath, 'gochang-structure-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(structureAnalysis, null, 2));

    console.log('\n📋 Analysis Summary:');
    console.log(`Platform: ${structureAnalysis.platform}`);
    console.log(`Total Links: ${structureAnalysis.links.total}`);
    console.log(`Unique Links: ${structureAnalysis.links.unique}`);
    console.log(`Potential Products: ${structureAnalysis.links.products.length}`);
    console.log(`Potential Categories: ${structureAnalysis.links.categories.length}`);
    
    console.log('\n🔗 Product-like URLs:');
    structureAnalysis.links.products.slice(0, 10).forEach(url => {
      console.log(`  - ${url}`);
    });

    console.log('\n📁 Category-like URLs:');
    structureAnalysis.links.categories.slice(0, 10).forEach(url => {
      console.log(`  - ${url}`);
    });

    console.log(`\n📄 Analysis saved to: ${analysisPath}`);
    console.log(`🏠 Homepage saved to: ${path.join(outputPath, 'gochang-homepage.html')}`);

  } catch (error) {
    console.error('❌ Error analyzing structure:', error);
    throw error;
  }
}

analyzeGochangStructure().catch(console.error);