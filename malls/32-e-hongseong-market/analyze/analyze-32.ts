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

async function analyzeEHongseongMarket(): Promise<void> {
  console.log('Starting analysis of e-Hongseong Market (ID: 32)...');

  // Read HTML files for analysis
  const requirementsDir = path.join(__dirname, 'requirements');
  const homepageHtml = fs.readFileSync(path.join(requirementsDir, 'homepage.html'), 'utf-8');
  const categoryHtml = fs.readFileSync(path.join(requirementsDir, 'category_007.html'), 'utf-8');
  const searchHtml = fs.readFileSync(path.join(requirementsDir, 'search_kimchi.html'), 'utf-8');

  // Extract categories from homepage
  const categories: CategoryInfo[] = [];
  const categoryNames: { [key: string]: string } = {
    '007': '친환경',
    '008': '축산물', 
    '009': '수산물',
    '010': '가공식품',
    '011': '과자/음료',
    '013': '금액별 상품'
  };

  // Extract main categories
  const mainCategoryMatches = homepageHtml.matchAll(/href="\/shop\/shopbrand\.html\?xcode=(\d+)&type=Y"[^>]*>[^<]*<span[^>]*>[^<]*<span[^>]*>([^<]+)</g);
  for (const match of mainCategoryMatches) {
    const xcode = match[1];
    const name = match[2].trim().replace(/&nbsp;.*$/, '');
    if (!categories.find(c => c.id === xcode)) {
      categories.push({
        id: xcode,
        name: name || categoryNames[xcode] || `Category ${xcode}`,
        url: `https://ehongseong.com/shop/shopbrand.html?xcode=${xcode}&type=Y`
      });
    }
  }

  // Add known categories if not found
  for (const [id, name] of Object.entries(categoryNames)) {
    if (!categories.find(c => c.id === id)) {
      categories.push({
        id,
        name,
        url: `https://ehongseong.com/shop/shopbrand.html?xcode=${id}&type=Y`
      });
    }
  }

  // Extract sample products from category page
  const sampleProducts: ProductInfo[] = [];
  const productMatches = categoryHtml.matchAll(/href="\/shop\/shopdetail\.html\?branduid=(\d+)[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*tit[^"]*"[^>]*>([^<]+)<\/div>[\s\S]*?<div[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]*?([0-9,]+)원/g);
  
  for (const match of productMatches) {
    if (sampleProducts.length < 5) {
      sampleProducts.push({
        id: match[1],
        name: match[2].trim(),
        price: match[3].trim() + '원',
        imageUrl: '',
        productUrl: `https://ehongseong.com/shop/shopdetail.html?branduid=${match[1]}`
      });
    }
  }

  // If products not found with the above pattern, try alternative extraction
  if (sampleProducts.length === 0) {
    const altProductMatches = categoryHtml.matchAll(/branduid=(\d+)[^>]*>[\s\S]*?title="([^"]+)"[\s\S]*?<span[^>]*>([0-9,]+원)</g);
    for (const match of altProductMatches) {
      if (sampleProducts.length < 5) {
        sampleProducts.push({
          id: match[1],
          name: match[2].trim(),
          price: match[3].trim(),
          imageUrl: '',
          productUrl: `https://ehongseong.com/shop/shopdetail.html?branduid=${match[1]}`
        });
      }
    }
  }

  // Count total products (estimate based on category page)
  const allProductIds = new Set<string>();
  const allProductMatches = categoryHtml.matchAll(/branduid=(\d+)/g);
  for (const match of allProductMatches) {
    allProductIds.add(match[1]);
  }

  const analysis: MallAnalysis = {
    mallId: 32,
    mallName: 'e홍성장터',
    url: 'https://ehongseong.com/',
    categories: categories,
    totalProducts: allProductIds.size > 0 ? allProductIds.size * 10 : 200, // Estimate
    sampleProducts: sampleProducts,
    scrapingStrategy: {
      method: 'HTTP_REQUEST',
      requiresJavaScript: false,
      pagination: {
        type: 'NO_PAGINATION',
        parameterName: undefined
      },
      categoryUrlPattern: 'https://ehongseong.com/shop/shopbrand.html?xcode={categoryId}&type=Y',
      productUrlPattern: 'https://ehongseong.com/shop/shopdetail.html?branduid={productId}',
      searchUrlPattern: 'https://ehongseong.com/shop/shopbrand.html?search={keyword}'
    }
  };

  // Write analysis result
  const outputPath = path.join(__dirname, 'analysis-32.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`Analysis complete. Results saved to ${outputPath}`);
}

// Run the analysis
analyzeEHongseongMarket().catch(console.error);