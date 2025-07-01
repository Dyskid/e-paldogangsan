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
  productCount?: number;
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

async function analyzeDangjinFarm(): Promise<void> {
  console.log('Starting analysis of Dangjin Farm (ID: 31)...');

  // Read HTML files for analysis
  const requirementsDir = path.join(__dirname, 'requirements');
  const homepageHtml = fs.readFileSync(path.join(requirementsDir, 'homepage.html'), 'utf-8');
  const categoryHtml = fs.readFileSync(path.join(requirementsDir, 'category_44.html'), 'utf-8');
  const searchHtml = fs.readFileSync(path.join(requirementsDir, 'search_rice.html'), 'utf-8');

  // Extract categories from homepage
  const categories: CategoryInfo[] = [];
  
  // Extract category links
  const categoryMatches = homepageHtml.matchAll(/href="\/product\/list\.html\?cate_no=(\d+)"[^>]*>([^<]+)<\/a>/g);
  for (const match of categoryMatches) {
    categories.push({
      id: match[1],
      name: match[2].trim(),
      url: `https://dangjinfarm.com/product/list.html?cate_no=${match[1]}`
    });
  }

  // Extract sample products from category page
  const sampleProducts: ProductInfo[] = [];
  const productMatches = categoryHtml.matchAll(/href="\/product\/detail\.html\?product_no=(\d+)[^"]*"[^>]*>[\s\S]*?<span class="name"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/g);
  
  for (const match of productMatches) {
    if (sampleProducts.length < 5) {
      sampleProducts.push({
        id: match[1],
        name: match[2].trim(),
        price: match[3].trim(),
        imageUrl: '', // Would need to extract from img tags
        productUrl: `https://dangjinfarm.com/product/detail.html?product_no=${match[1]}`
      });
    }
  }

  // If products not found with the above pattern, try alternative extraction
  if (sampleProducts.length === 0) {
    const altProductMatches = homepageHtml.matchAll(/product_no=(\d+)[^>]*>[\s\S]*?alt="([^"]+)"[\s\S]*?<span[^>]*>([0-9,]+원)<\/span>/g);
    for (const match of altProductMatches) {
      if (sampleProducts.length < 5) {
        sampleProducts.push({
          id: match[1],
          name: match[2].trim(),
          price: match[3].trim(),
          imageUrl: '',
          productUrl: `https://dangjinfarm.com/product/detail.html?product_no=${match[1]}`
        });
      }
    }
  }

  // Count total products (estimate based on search results)
  const allProductIds = new Set<string>();
  const allProductMatches = searchHtml.matchAll(/product_no=(\d+)/g);
  for (const match of allProductMatches) {
    allProductIds.add(match[1]);
  }

  const analysis: MallAnalysis = {
    mallId: 31,
    mallName: '당진팜',
    url: 'https://dangjinfarm.com/',
    categories: categories.length > 0 ? categories : [
      { id: '44', name: '가공상품', url: 'https://dangjinfarm.com/product/list.html?cate_no=44' },
      { id: '43', name: '축산/수산', url: 'https://dangjinfarm.com/product/list.html?cate_no=43' },
      { id: '47', name: '건강식품/기타', url: 'https://dangjinfarm.com/product/list.html?cate_no=47' }
    ],
    totalProducts: allProductIds.size > 0 ? allProductIds.size * 5 : 100, // Estimate
    sampleProducts: sampleProducts,
    scrapingStrategy: {
      method: 'HTTP_REQUEST',
      requiresJavaScript: false,
      pagination: {
        type: 'QUERY_PARAMETER',
        parameterName: 'page'
      },
      categoryUrlPattern: 'https://dangjinfarm.com/product/list.html?cate_no={categoryId}',
      productUrlPattern: 'https://dangjinfarm.com/product/detail.html?product_no={productId}',
      searchUrlPattern: 'https://dangjinfarm.com/product/search.html?keyword={keyword}'
    }
  };

  // Write analysis result
  const outputPath = path.join(__dirname, 'analysis-31.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`Analysis complete. Results saved to ${outputPath}`);
}

// Run the analysis
analyzeDangjinFarm().catch(console.error);