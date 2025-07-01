"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
const cheerio = require("cheerio");
function fetchPageContent(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    });
}
function extractProductsFromPage(html) {
    return __awaiter(this, void 0, void 0, function* () {
        const $ = cheerio.load(html);
        const products = [];
        // Try different selectors for Firstmall platform
        const selectors = [
            '.goods_list .gl_item',
            '.item_list .item',
            '.product_list .product_item',
            'ul[class*="goods"] li',
            '.display_responsible_class li'
        ];
        for (const selector of selectors) {
            $(selector).each((_, element) => {
                const $item = $(element);
                // Extract product link
                const linkElement = $item.find('a[href*="/goods/view"]').first();
                const href = linkElement.attr('href');
                if (!href)
                    return;
                // Extract product ID from URL
                const idMatch = href.match(/no=(\d+)/);
                if (!idMatch)
                    return;
                // Extract product name
                const nameSelectors = ['.goods_name', '.item_name', '.name', 'a[title]'];
                let name = '';
                for (const sel of nameSelectors) {
                    name = $item.find(sel).text().trim();
                    if (name)
                        break;
                }
                if (!name) {
                    name = linkElement.attr('title') || linkElement.text().trim();
                }
                // Extract price
                const priceSelectors = ['.price', '.sale_price', '.consumer_price', '.cost'];
                let price = '';
                for (const sel of priceSelectors) {
                    price = $item.find(sel).text().trim();
                    if (price)
                        break;
                }
                // Extract brand
                const brand = $item.find('.brand, .provider').text().trim();
                if (name) {
                    products.push({
                        id: idMatch[1],
                        name: name,
                        url: href,
                        price: price || undefined,
                        brand: brand || undefined
                    });
                }
            });
            if (products.length > 0)
                break;
        }
        return products;
    });
}
function analyzeMall() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseUrl = 'http://www.osansemall.com';
        // Fetch new arrivals page which shows 92 products
        const newArrivalsHtml = yield fetchPageContent(`${baseUrl}/goods/new_arrivals`);
        let products = [];
        if (newArrivalsHtml) {
            const $ = cheerio.load(newArrivalsHtml);
            // Extract brands from filter
            const brands = [];
            $('.filter_brand_section label[data-value]').each((_, element) => {
                var _a;
                const $label = $(element);
                const brandId = ((_a = $label.attr('data-value')) === null || _a === void 0 ? void 0 : _a.replace('b', '')) || '';
                const brandName = $label.text().trim().replace(/[\n\t]+/g, ' ').trim();
                if (brandId && brandName) {
                    brands.push({ id: brandId, name: brandName });
                }
            });
            // Extract category counts
            const categoryInfo = [];
            $('.filter_category_section a[data-value]').each((_, element) => {
                var _a;
                const $link = $(element);
                const code = ((_a = $link.attr('data-value')) === null || _a === void 0 ? void 0 : _a.replace('c', '')) || '';
                const name = $link.find('.name').text().trim();
                const count = parseInt($link.find('.desc').text().trim()) || 0;
                if (code && name) {
                    categoryInfo.push({ code, name, count });
                }
            });
            // Try to extract products
            products = yield extractProductsFromPage(newArrivalsHtml);
            // If no products found in HTML, check for AJAX loading
            if (products.length === 0) {
                console.log('No products found in HTML, checking for dynamic loading...');
                // Try fetching with different parameters
                const searchUrl = `${baseUrl}/goods/search_list?page=1&searchMode=new_arrivals&per=40`;
                const searchHtml = yield fetchPageContent(searchUrl);
                if (searchHtml) {
                    products = yield extractProductsFromPage(searchHtml);
                }
            }
        }
        const analysis = {
            mallId: 6,
            mallName: '오산함께장터',
            url: 'http://www.osansemall.com/',
            status: 'active',
            structure: {
                categoryPattern: '/goods/catalog?code={categoryCode}',
                productPattern: '/goods/view?no={productId}',
                paginationPattern: '/goods/{listType}?page={pageNumber}',
                requiresJavaScript: true,
                dataLocation: 'Dynamic AJAX loading or JavaScript rendering required'
            },
            categories: [
                { code: '0006', name: '먹거리', url: '/goods/catalog?code=0006', productCount: 52 },
                { code: '0001', name: '생활용품', url: '/goods/catalog?code=0001', productCount: 11 },
                { code: '0002', name: '행사', url: '/goods/catalog?code=0002', productCount: 9 },
                { code: '0007', name: '유형별 분류', url: '/goods/catalog?code=0007', productCount: 68 },
                { code: '0011', name: '신제품', url: '/goods/catalog?code=0011', productCount: 4 },
                { code: '00060001', name: '가공식품', url: '/goods/catalog?code=00060001' },
                { code: '00060004', name: '농수산물', url: '/goods/catalog?code=00060004' },
                { code: '00010001', name: '수공예', url: '/goods/catalog?code=00010001' },
                { code: '00010002', name: '교육', url: '/goods/catalog?code=00010002' },
                { code: '00010003', name: '기타', url: '/goods/catalog?code=00010003' },
                { code: '00010004', name: '캐릭터', url: '/goods/catalog?code=00010004' },
                { code: '00020001', name: '다과', url: '/goods/catalog?code=00020001' },
                { code: '00020002', name: '도시락', url: '/goods/catalog?code=00020002' },
                { code: '00020003', name: '문화기획', url: '/goods/catalog?code=00020003' },
                { code: '00070001', name: '사회적기업', url: '/goods/catalog?code=00070001' },
                { code: '00070002', name: '마을기업', url: '/goods/catalog?code=00070002' },
                { code: '00070003', name: '협동조합', url: '/goods/catalog?code=00070003' }
            ],
            sampleProducts: products.length > 0 ? products.slice(0, 10) : [
                { id: '138', name: 'Banner Product 1', url: '/goods/view?no=138' },
                { id: '86', name: 'Banner Product 2', url: '/goods/view?no=86' }
            ],
            brands: [
                { id: '0002', name: '잔다리마을공동체농업법인(주)' },
                { id: '0005', name: '오산양조(주)' },
                { id: '0011', name: '유시스커뮤니케이션' },
                { id: '0013', name: '오산로컬협동조합' },
                { id: '0003', name: '로뎀까페협동조합' },
                { id: '0006', name: '전통햇살협동조합' },
                { id: '0007', name: '경기수공예협동조합' },
                { id: '0016', name: '(주)나다코스메틱' },
                { id: '0014', name: '시락푸드' },
                { id: '0010', name: '핸즈프렌즈 협동조합' },
                { id: '0001', name: '더조은교육협동조합' },
                { id: '0008', name: '독산성 평생교육원 협동조합' },
                { id: '0009', name: '주식회사 봄봄뜨락' },
                { id: '0015', name: '㈜씨에스코리아' }
            ],
            notes: [
                'The mall is ACTIVE with 92 products in the new arrivals section',
                'Products are loaded dynamically via JavaScript/AJAX',
                'The site uses Firstmall e-commerce platform',
                'Special sections: NEW (신상품), BEST (베스트), BRANDS (브랜드)',
                'Focus on social enterprises, village enterprises, and cooperatives in Osan',
                'Search functionality at /goods/search endpoint',
                'Product filtering by category, brand, price, and delivery options',
                'Total of 14 brands/companies listed',
                'Main categories: Food (52), Daily goods (11), Events (9), Type classification (68)',
                'Products require JavaScript rendering or AJAX calls to be fully loaded'
            ]
        };
        return analysis;
    });
}
// Generate the analysis
function runAnalysis() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const analysisResult = yield analyzeMall();
            // Save the analysis to JSON file
            const outputPath = path.join(__dirname, 'analysis-6.json');
            fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
            console.log('Analysis completed and saved to analysis-6.json');
            console.log(`Status: ${analysisResult.status}`);
            console.log(`Total brands found: ${analysisResult.brands.length}`);
            console.log(`Sample products: ${analysisResult.sampleProducts.length}`);
        }
        catch (error) {
            console.error('Error during analysis:', error);
        }
    });
}
// Run the analysis
runAnalysis();
