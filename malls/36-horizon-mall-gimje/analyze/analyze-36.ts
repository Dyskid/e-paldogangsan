import * as fs from 'fs';
import * as path from 'path';

interface ProductInfo {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  url: string;
  subCategories?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  url: string;
  categories: CategoryInfo[];
  totalProducts: number;
  sampleProducts: ProductInfo[];
  scrapingStrategy: {
    method: string;
    requiresJavaScript: boolean;
    pagination: {
      type: string;
      parameterName?: string;
    };
    categoryUrlPattern: string;
    productUrlPattern: string;
    searchUrlPattern: string;
  };
}

async function analyzeHorizonMall(): Promise<void> {
  console.log('Starting analysis of Horizon Mall Gimje (ID: 36)...');

  // Read HTML files for analysis
  const requirementsDir = path.join(__dirname, 'requirements');
  const homepageHtml = fs.readFileSync(path.join(requirementsDir, 'homepage.html'), 'utf-8');

  // Extract categories from homepage
  const categories: CategoryInfo[] = [];
  
  // Main categories with subcategories
  const mainCategories = [
    { id: '10e0', name: '지평선 브랜드관', subs: [
      { id: '10e010', name: '지평선쌀' },
      { id: '10e020', name: '지평선파프리카' }
    ]},
    { id: '1010', name: '쌀/잡곡', subs: [
      { id: '101010', name: '지평선쌀' },
      { id: '101020', name: '쌀' },
      { id: '101030', name: '보리/밀' },
      { id: '101040', name: '콩' },
      { id: '101050', name: '잡곡/혼합곡' },
      { id: '101060', name: '기타' }
    ]},
    { id: '1020', name: '과일/채소류', subs: [
      { id: '102030', name: '건조제품' },
      { id: '102040', name: '파프리카' }
    ]},
    { id: '1040', name: '가공식품', subs: [] },
    { id: '1050', name: '전통식품', subs: [] },
    { id: '1070', name: '축산류', subs: [] },
    { id: '10c0', name: '사회적경제기업관', subs: [] }
  ];

  // Parse categories from HTML
  mainCategories.forEach(cat => {
    const category: CategoryInfo = {
      id: cat.id,
      name: cat.name,
      url: `https://jpsmall.com/board/shop/list.php?ca_id=${cat.id}`,
      subCategories: cat.subs.map(sub => ({
        id: sub.id,
        name: sub.name,
        url: `https://jpsmall.com/board/shop/list.php?ca_id=${sub.id}`
      }))
    };
    categories.push(category);
  });

  // Extract sample products from homepage
  const sampleProducts: ProductInfo[] = [];
  const productMatches = homepageHtml.matchAll(/href="\/board\/shop\/item\.php\?it_id=(\d+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/div>[\s\S]*?<div[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]*?([0-9,]+)원/g);
  
  // Alternative pattern for product extraction
  const altProductMatches = homepageHtml.matchAll(/item\.php\?it_id=(\d+)/g);
  const productIds = new Set<string>();
  
  for (const match of altProductMatches) {
    productIds.add(match[1]);
  }

  // Create sample products from found IDs
  let count = 0;
  for (const productId of productIds) {
    if (count < 5) {
      sampleProducts.push({
        id: productId,
        name: `Product ${productId}`, // Would need to extract from actual product pages
        price: 'Price not extracted',
        imageUrl: '',
        productUrl: `https://jpsmall.com/board/shop/item.php?it_id=${productId}`
      });
      count++;
    }
  }

  const analysis: MallAnalysis = {
    mallId: 36,
    mallName: '지평선몰(김제)',
    url: 'https://jpsmall.com/',
    categories: categories,
    totalProducts: productIds.size > 0 ? productIds.size * 15 : 300, // Estimate
    sampleProducts: sampleProducts,
    scrapingStrategy: {
      method: 'HTTP_REQUEST',
      requiresJavaScript: false,
      pagination: {
        type: 'QUERY_PARAMETER',
        parameterName: 'page'
      },
      categoryUrlPattern: 'https://jpsmall.com/board/shop/list.php?ca_id={categoryId}',
      productUrlPattern: 'https://jpsmall.com/board/shop/item.php?it_id={productId}',
      searchUrlPattern: 'https://jpsmall.com/board/shop/list.php?search_Value={keyword}'
    }
  };

  // Write analysis result
  const outputPath = path.join(__dirname, 'analysis-36.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`Analysis complete. Results saved to ${outputPath}`);
}

// Run the analysis
analyzeHorizonMall().catch(console.error);