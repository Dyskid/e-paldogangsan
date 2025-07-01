import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

interface ProductInfo {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
}

interface CategoryInfo {
  name: string;
  url: string;
  subcategories?: CategoryInfo[];
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  mallUrl: string;
  categories: CategoryInfo[];
  productStructure: {
    listSelector: string;
    itemSelector: string;
    nameSelector: string;
    priceSelector: string;
    imageSelector: string;
    linkSelector: string;
  };
  pagination: {
    type: string;
    pageParam: string;
    itemsPerPage: number;
  };
  javascriptRequired: boolean;
  dataLoadingMethod: string;
  sampleProducts: ProductInfo[];
}

async function analyzeMall(): Promise<void> {
  const mallId = 10;
  const mallName = '강원더몰';
  const mallUrl = 'https://gwdmall.kr/';
  
  try {
    // Fetch main page
    const response = await fetch(mallUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract categories
    const categories: CategoryInfo[] = [];
    $('.categoryDepth1').each((i, elem) => {
      const mainCategory = $(elem).find('.categoryDepthLink').first();
      const categoryInfo: CategoryInfo = {
        name: mainCategory.find('em').text().trim(),
        url: 'https://gwdmall.kr' + mainCategory.attr('href'),
        subcategories: []
      };
      
      // Get subcategories
      $(elem).find('.categoryDepth3 li a').each((j, subElem) => {
        categoryInfo.subcategories?.push({
          name: $(subElem).text().trim(),
          url: 'https://gwdmall.kr' + $(subElem).attr('href')
        });
      });
      
      categories.push(categoryInfo);
    });
    
    // Extract sample products
    const sampleProducts: ProductInfo[] = [];
    $('.goods_list .gl_item').slice(0, 5).each((i, elem) => {
      const $elem = $(elem);
      const productId = $elem.find('.respItemImageArea').attr('onclick')?.match(/display_goods_view\('(\d+)'/)?.[1] || '';
      
      sampleProducts.push({
        id: productId,
        name: $elem.find('.goodS_info a').text().trim(),
        price: $elem.find('.displaY_sales_price .sale_price').text().trim(),
        imageUrl: $elem.find('.goodsDisplayImage').attr('src') || '',
        productUrl: `https://gwdmall.kr/goods/view?no=${productId}`
      });
    });
    
    const analysis: MallAnalysis = {
      mallId,
      mallName,
      mallUrl,
      categories: categories.slice(0, 10), // Limit to first 10 categories
      productStructure: {
        listSelector: '.goods_list',
        itemSelector: '.gl_item',
        nameSelector: '.goodS_info a',
        priceSelector: '.displaY_sales_price .sale_price',
        imageSelector: '.goodsDisplayImage',
        linkSelector: '.respItemImageArea'
      },
      pagination: {
        type: 'page_parameter',
        pageParam: 'page',
        itemsPerPage: 40
      },
      javascriptRequired: true,
      dataLoadingMethod: 'server_side_with_lazy_loading',
      sampleProducts
    };
    
    // Save analysis result
    const outputPath = path.join(__dirname, 'analysis-10.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    console.log('Analysis completed successfully');
    
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Run the analysis
analyzeMall().catch(console.error);