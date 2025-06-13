import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountRate?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  seller?: string;
  description?: string;
  tags: string[];
}

const JEJU_MALL_BASE_URL = 'https://mall.ejeju.net';
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchProductsFromAPI() {
  const allProducts: Product[] = [];
  
  try {
    console.log('Fetching products from AJAX endpoint...');
    
    // Try the mainIndicatorGoodsList endpoint
    const response = await axios.post(`${JEJU_MALL_BASE_URL}/main/mainIndicatorGoodsList.do`, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${JEJU_MALL_BASE_URL}/main/index.do`
      }
    });
    
    console.log('Response received:', response.status);
    console.log('Response type:', typeof response.data);
    
    // Log the response structure
    if (response.data) {
      console.log('Response data sample:', JSON.stringify(response.data).substring(0, 500));
      
      // Try to parse products from response
      if (Array.isArray(response.data)) {
        // Direct array of products
        response.data.forEach((item, index) => {
          const product = parseProductData(item, index);
          if (product) allProducts.push(product);
        });
      } else if (response.data.list || response.data.items || response.data.products) {
        // Products in a property
        const productList = response.data.list || response.data.items || response.data.products;
        if (Array.isArray(productList)) {
          productList.forEach((item, index) => {
            const product = parseProductData(item, index);
            if (product) allProducts.push(product);
          });
        }
      } else if (response.data.result) {
        // Products might be in result property
        const result = response.data.result;
        if (Array.isArray(result)) {
          result.forEach((item, index) => {
            const product = parseProductData(item, index);
            if (product) allProducts.push(product);
          });
        }
      }
      
      // Save raw response for analysis
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'jeju-mall-api-response.json'),
        JSON.stringify(response.data, null, 2)
      );
    }
    
    // Try other potential endpoints
    const otherEndpoints = [
      '/goods/goodsList.do',
      '/product/list.do',
      '/shop/goods/list.do',
      '/main/goods/list.do'
    ];
    
    for (const endpoint of otherEndpoints) {
      try {
        console.log(`\nTrying endpoint: ${endpoint}`);
        const res = await axios.get(`${JEJU_MALL_BASE_URL}${endpoint}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log(`Response from ${endpoint}:`, res.status);
      } catch (err) {
        console.log(`Failed to fetch ${endpoint}`);
      }
    }
    
  } catch (error) {
    console.error('Error fetching from API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'jeju-mall-products-ajax.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
  
  console.log(`\nTotal products found: ${allProducts.length}`);
  console.log(`Results saved to: ${outputPath}`);
  
  return allProducts;
}

function parseProductData(item: any, index: number): Product | null {
  try {
    // Common field names in Korean e-commerce APIs
    const name = item.goodsNm || item.goods_nm || item.productName || item.product_name || 
                item.gname || item.gdsNm || item.title || item.name;
    
    const price = item.price || item.salePrice || item.sale_price || item.goodsPrice || 
                 item.goods_price || item.sellPrice || item.sell_price;
    
    const imageUrl = item.imageUrl || item.image_url || item.goodsImg || item.goods_img || 
                    item.mainImage || item.main_image || item.imgPath || item.img_path ||
                    item.listImg || item.list_img;
    
    const productNo = item.goodsNo || item.goods_no || item.productNo || item.product_no || 
                     item.gno || item.pno || item.no || item.id;
    
    if (name && (price || price === 0)) {
      const product: Product = {
        id: `jeju_${productNo || index}`,
        name: name,
        price: price.toString() + '원',
        imageUrl: imageUrl && !imageUrl.startsWith('http') ? JEJU_MALL_BASE_URL + imageUrl : imageUrl || '',
        productUrl: productNo ? `${JEJU_MALL_BASE_URL}/goods/detail.do?gno=${productNo}` : '',
        category: item.category || item.categoryNm || item.category_name || 'Unknown',
        seller: item.seller || item.sellerNm || item.seller_name || item.shopNm,
        description: item.description || item.goodsDesc || item.goods_desc,
        tags: ['제주', '제주도', 'jeju']
      };
      
      // Add original price if available
      const originalPrice = item.originalPrice || item.original_price || item.consumerPrice || item.consumer_price;
      if (originalPrice && originalPrice !== price) {
        product.originalPrice = originalPrice.toString() + '원';
      }
      
      // Add discount rate if available
      const discountRate = item.discountRate || item.discount_rate || item.dcRate || item.dc_rate;
      if (discountRate) {
        product.discountRate = discountRate.toString() + '%';
      }
      
      return product;
    }
  } catch (error) {
    console.error('Error parsing product data:', error);
  }
  
  return null;
}

// Run the scraper
fetchProductsFromAPI().catch(console.error);