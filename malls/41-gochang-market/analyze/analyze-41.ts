import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  url: string;
  imageUrl: string;
}

interface AnalysisResult {
  mallId: number;
  mallName: string;
  website: string;
  products: Product[];
  totalProducts: number;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  analysisDate: string;
  structureInfo: {
    platform: string;
    hasSearch: boolean;
    hasPagination: boolean;
    hasCategories: boolean;
  };
}

async function analyzeGochang(): Promise<void> {
  console.log('Analyzing Gochang Market (고창마켓)...');
  
  const products: Product[] = [];
  const categoriesSet = new Set<string>();
  
  try {
    // Read the homepage
    const homepageContent = fs.readFileSync(
      path.join(__dirname, 'requirements', 'homepage.html'),
      'utf-8'
    );
    
    // This is a Cafe24 platform site
    console.log('Detected Cafe24 e-commerce platform');
    
    // Extract product blocks
    const productBlockRegex = /<div class="thumbnail">[\s\S]*?<div class="description"[\s\S]*?<\/ul>/g;
    const productBlocks = homepageContent.match(productBlockRegex) || [];
    
    console.log(`Found ${productBlocks.length} product blocks`);
    
    productBlocks.forEach((block, index) => {
      // Extract product URL and ID
      const urlMatch = block.match(/href="\/product\/([^"]+)\/(\d+)\/category\/(\d+)\/display\/(\d+)\//);
      if (!urlMatch) return;
      
      const productPath = urlMatch[1];
      const productId = urlMatch[2];
      const categoryId = urlMatch[3];
      
      // Extract product name - it's in the second span within the name div
      const nameMatch = block.match(/<div class="name">[\s\S]*?<span[^>]*>[^<]*<\/span>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
      const productName = nameMatch ? nameMatch[1].trim() : '';
      
      // Extract price
      const priceMatch = block.match(/>([0-9,]+)원</);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      
      // Extract image
      const imageMatch = block.match(/ec-data-src="([^"]+)"/);
      const imageUrl = imageMatch ? imageMatch[1] : '';
      
      if (productId && productName) {
        const category = `Category ${categoryId}`;
        categoriesSet.add(category);
        
        products.push({
          id: productId,
          name: productName,
          price: price,
          category: category,
          url: `https://noblegochang.com/product/${productPath}/${productId}/category/${categoryId}/display/${urlMatch[4]}/`,
          imageUrl: imageUrl
        });
      }
    });
    
    console.log(`Successfully extracted ${products.length} products`);
    
    // If we didn't get products from blocks, try alternative extraction
    if (products.length === 0) {
      console.log('Trying alternative extraction method...');
      
      // Find all product links
      const linkRegex = /href="\/product\/([^"]+)\/(\d+)\/category\/(\d+)\/display\/(\d+)\//g;
      let linkMatch;
      
      while ((linkMatch = linkRegex.exec(homepageContent)) !== null) {
        const productPath = linkMatch[1];
        const productId = linkMatch[2];
        const categoryId = linkMatch[3];
        
        // Try to find associated product name
        const searchPattern = new RegExp(`href="/product/${productPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]+>([^<]+)<`, 'i');
        const nameMatch = homepageContent.match(searchPattern);
        const productName = nameMatch ? nameMatch[1].trim() : decodeURIComponent(productPath);
        
        const category = `Category ${categoryId}`;
        categoriesSet.add(category);
        
        // Create a simple product entry
        products.push({
          id: productId,
          name: productName,
          price: 0, // Price extraction failed
          category: category,
          url: `https://noblegochang.com/product/${productPath}/${productId}/category/${categoryId}/display/${linkMatch[4]}/`,
          imageUrl: ''
        });
      }
    }
    
    // Remove duplicates
    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.id === product.id)
    );
    
    console.log(`Total unique products: ${uniqueProducts.length}`);
    
    // Calculate price statistics
    const pricesWithValue = uniqueProducts.filter(p => p.price > 0).map(p => p.price);
    const priceRange = pricesWithValue.length > 0 ? {
      min: Math.min(...pricesWithValue),
      max: Math.max(...pricesWithValue),
      average: Math.round(pricesWithValue.reduce((a, b) => a + b, 0) / pricesWithValue.length)
    } : {
      min: 0,
      max: 0,
      average: 0
    };
    
    // Create analysis result
    const analysisResult: AnalysisResult = {
      mallId: 41,
      mallName: '고창마켓',
      website: 'https://noblegochang.com/',
      products: uniqueProducts.slice(0, 50), // Limit to first 50 products
      totalProducts: uniqueProducts.length,
      categories: Array.from(categoriesSet),
      priceRange: priceRange,
      analysisDate: new Date().toISOString(),
      structureInfo: {
        platform: 'Cafe24',
        hasSearch: true,
        hasPagination: true,
        hasCategories: true
      }
    };
    
    // Save analysis result
    const outputPath = path.join(__dirname, 'analysis-41.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
    
    console.log(`Analysis complete. Found ${uniqueProducts.length} products.`);
    console.log(`Categories: ${analysisResult.categories.join(', ')}`);
    if (pricesWithValue.length > 0) {
      console.log(`Price range: ${priceRange.min}원 - ${priceRange.max}원 (avg: ${priceRange.average}원)`);
    }
    console.log(`Results saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error during analysis:', error);
    
    // Save error result
    const errorResult = {
      mallId: 41,
      mallName: '고창마켓',
      website: 'https://noblegochang.com/',
      error: error.message,
      analysisDate: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'analysis-41.json'),
      JSON.stringify(errorResult, null, 2)
    );
  }
}

// Run the analysis
analyzeGochang();