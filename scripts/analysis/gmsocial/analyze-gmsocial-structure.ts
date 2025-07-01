import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface CategoryInfo {
  code: string;
  name: string;
  url: string;
  subcategories?: CategoryInfo[];
}

interface ProductInfo {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl: string;
  vendor?: string;
  url: string;
  shipping?: string;
  rating?: number;
  reviewCount?: number;
}

interface MallAnalysis {
  mallName: string;
  mallUrl: string;
  categoryStructure: CategoryInfo[];
  productUrlPattern: string;
  categoryUrlPattern: string;
  paginationPattern?: string;
  totalCategories: number;
  sampleProducts: ProductInfo[];
  technicalNotes: string[];
  scrapingStrategy: {
    method: string;
    steps: string[];
    estimatedProductCount?: string;
  };
}

function analyzeGMSocialMall() {
  const outputDir = path.join(__dirname, 'output');
  
  // Read the downloaded HTML files
  const homepageHtml = fs.readFileSync(path.join(outputDir, 'gmsocial-homepage.html'), 'utf-8');
  const categoryHtml = fs.readFileSync(path.join(outputDir, 'gmsocial-food-category.html'), 'utf-8');
  const productHtml = fs.readFileSync(path.join(outputDir, 'gmsocial-product-sample.html'), 'utf-8');
  
  // Parse homepage to extract categories
  const $ = cheerio.load(homepageHtml);
  const categories: CategoryInfo[] = [];
  
  // Extract main categories
  $('.gnb > li').each((i, elem) => {
    const $elem = $(elem);
    const mainLink = $elem.find('> a');
    const categoryUrl = mainLink.attr('href') || '';
    const categoryCode = categoryUrl.match(/category_code=(\d+)/)?.[1] || '';
    
    if (categoryCode) {
      const category: CategoryInfo = {
        code: categoryCode,
        name: mainLink.text().trim(),
        url: `https://gmsocial.or.kr${categoryUrl}`,
        subcategories: []
      };
      
      // Extract subcategories
      $elem.find('.gnb_sub li a').each((j, subElem) => {
        const $subElem = $(subElem);
        const subUrl = $subElem.attr('href') || '';
        const subCode = subUrl.match(/category_code=(\d+)/)?.[1] || '';
        
        if (subCode) {
          category.subcategories?.push({
            code: subCode,
            name: $subElem.text().trim(),
            url: `https://gmsocial.or.kr${subUrl}`
          });
        }
      });
      
      categories.push(category);
    }
  });
  
  // Parse category page to understand product listing
  const $category = cheerio.load(categoryHtml);
  const sampleProducts: ProductInfo[] = [];
  
  // Extract product information (Note: The actual HTML structure needs to be analyzed)
  // This is a placeholder - you'll need to inspect the actual HTML structure
  $category('.product-item, .goods-list li, .item').each((i, elem) => {
    const $elem = $category(elem);
    const productUrl = $elem.find('a').attr('href') || '';
    const productId = productUrl.match(/product_id=(\d+)/)?.[1] || '';
    
    if (productId && i < 5) { // Get first 5 products as samples
      // Extract product details - adjust selectors based on actual HTML
      const product: ProductInfo = {
        id: productId,
        title: $elem.find('.product-name, .goods-name, .title').text().trim(),
        price: parseInt($elem.find('.price, .sale-price').text().replace(/[^0-9]/g, '') || '0'),
        originalPrice: parseInt($elem.find('.original-price, .regular-price').text().replace(/[^0-9]/g, '') || '0'),
        imageUrl: $elem.find('img').attr('src') || '',
        url: `https://gmsocial.or.kr${productUrl}`,
        vendor: $elem.find('.vendor, .brand').text().trim(),
        shipping: $elem.find('.shipping').text().trim()
      };
      
      sampleProducts.push(product);
    }
  });
  
  // Parse product page for detailed structure
  const $product = cheerio.load(productHtml);
  
  // Create analysis report
  const analysis: MallAnalysis = {
    mallName: "광명가치몰 (광명시사회적경제센터)",
    mallUrl: "https://gmsocial.or.kr/mall/",
    categoryStructure: categories,
    productUrlPattern: "https://gmsocial.or.kr/mall/goods/view.php?product_id={productId}",
    categoryUrlPattern: "https://gmsocial.or.kr/mall/goods/list.php?category_code={categoryCode}",
    paginationPattern: "https://gmsocial.or.kr/mall/goods/list.php?category_code={categoryCode}&page={pageNumber}",
    totalCategories: categories.reduce((acc, cat) => acc + 1 + (cat.subcategories?.length || 0), 0),
    sampleProducts: sampleProducts,
    technicalNotes: [
      "Mall uses PHP-based system with standard query parameters",
      "Product images hosted on shop-phinf.pstatic.net (Naver Smart Store CDN)",
      "Categories use hierarchical numeric codes (e.g., 0001 for main, 00010001 for subcategory)",
      "Pagination uses standard page parameter",
      "No apparent AJAX loading - server-side rendering",
      "Food category code is 0006",
      "Product IDs are sequential numbers"
    ],
    scrapingStrategy: {
      method: "Sequential category traversal with pagination",
      steps: [
        "1. Iterate through all main categories (0001-0006)",
        "2. For each category, iterate through all subcategories",
        "3. For each category/subcategory, paginate through all pages",
        "4. Extract product IDs from listing pages",
        "5. Fetch individual product pages for detailed information",
        "6. Parse product details including title, price, image, vendor"
      ],
      estimatedProductCount: "Based on food category having 12 products, estimate 100-500 total products"
    }
  };
  
  // Save analysis
  const analysisPath = path.join(outputDir, 'gmsocial-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  
  console.log('Analysis saved to:', analysisPath);
  console.log('\nSummary:');
  console.log(`- Total categories: ${analysis.totalCategories}`);
  console.log(`- Main categories: ${categories.length}`);
  console.log(`- Category codes: ${categories.map(c => `${c.name} (${c.code})`).join(', ')}`);
  
  return analysis;
}

// Run analysis
analyzeGMSocialMall();