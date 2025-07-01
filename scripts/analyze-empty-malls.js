"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const emptyMalls = [
    // Gyeonggi
    { id: 'marketgyeonggi', name: '마켓경기', url: 'https://smartstore.naver.com/marketgyeonggi', region: '경기' },
    // Jeonbuk
    { id: 'jinan', name: '진안고원몰', url: 'https://xn--299az5xoii3qb66f.com/', region: '전북' },
    { id: 'imsil', name: '임실몰', url: 'https://www.imsilin.kr/home', region: '전북' },
    { id: 'sunchang', name: '순창로컬푸드쇼핑몰', url: 'https://smartstore.naver.com/schfarm', region: '전북' },
    // Jeonnam
    { id: 'hgoodfarm', name: '해피굿팜', url: 'https://smartstore.naver.com/hgoodfarm', region: '전남' },
    { id: 'haenam', name: '해남미소', url: 'https://www.hnmiso.com/ACC_index.asp', region: '전남' },
    // Gyeongbuk
    { id: 'andongjang', name: '안동장터', url: 'https://andongjang.andong.go.kr/', region: '경북' },
    { id: 'grmall', name: '고령몰', url: 'https://grmall.cyso.co.kr/', region: '경북' },
    { id: 'gcnodaji', name: '김천노다지장터', url: 'http://gcnodaji.com/', region: '경북' },
    { id: 'esmall', name: '의성장날', url: 'https://esmall.cyso.co.kr/', region: '경북' },
    { id: 'ujmall', name: '울진몰', url: 'https://ujmall.cyso.co.kr/', region: '경북' },
    { id: 'ydmall', name: '영덕장터', url: 'https://ydmall.cyso.co.kr/', region: '경북' },
    { id: 'gsmall', name: '경산몰', url: 'https://gsmall.cyso.co.kr/', region: '경북' },
    { id: 'gjmall', name: '경주몰', url: 'https://gjmall.cyso.co.kr/', region: '경북' },
    { id: 'gmmall', name: '구미팜', url: 'https://gmmall.cyso.co.kr/', region: '경북' },
    { id: '01000', name: '별빛촌장터(영천)', url: 'https://01000.cyso.co.kr/', region: '경북' },
    { id: 'pohangmarket', name: '포항마켓', url: 'https://pohangmarket.cyso.co.kr/', region: '경북' },
    // Gyeongnam
    { id: 'egnmall', name: 'e경남몰', url: 'https://egnmall.kr', region: '경남' },
    { id: 'toyoae', name: '토요애 (의령)', url: 'https://toyoae.com/', region: '경남' },
    { id: 'enamhae', name: '남해몰', url: 'https://enamhae.co.kr/', region: '경남' },
    { id: 'sanencheong', name: '산엔청 (산청)', url: 'https://sanencheong.com/', region: '경남' },
    { id: 'edinomall', name: '공룡나라 (고성)', url: 'https://www.edinomall.com/shop/smain/index.php', region: '경남' },
    { id: 'hamyang', name: '함양몰', url: 'https://2900.co.kr/', region: '경남' },
    { id: 'jinjudream', name: '진주드림', url: 'https://jinjudream.com/', region: '경남' },
    { id: 'hamanmall', name: '함안몰', url: 'https://hamanmall.com', region: '경남' }
];
async function analyzeWithPuppeteer(mall) {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        console.log(`Analyzing ${mall.name} with Puppeteer...`);
        await page.goto(mall.url, { waitUntil: 'networkidle2', timeout: 30000 });
        // Save homepage HTML
        const html = await page.content();
        await fs.writeFile(path.join(__dirname, 'output', mall.id, `${mall.id}-homepage.html`), html);
        // Check for product listings
        const structure = await page.evaluate(() => {
            // Common product selectors
            const productSelectors = [
                '.product-item', '.product', '.item', '.goods-item',
                '[class*="product"]', '[class*="item"]', '[class*="goods"]',
                '.prd-item', '.prd_item', '.product_item'
            ];
            let productSelector = null;
            let productCount = 0;
            for (const selector of productSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > productCount) {
                    productCount = elements.length;
                    productSelector = selector;
                }
            }
            // Check for categories
            const categorySelectors = [
                '.category', '.categories', '[class*="category"]',
                '.menu', '.nav', '.gnb'
            ];
            let hasCategories = false;
            for (const selector of categorySelectors) {
                if (document.querySelector(selector)) {
                    hasCategories = true;
                    break;
                }
            }
            // Check for pagination
            const paginationSelectors = [
                '.pagination', '.paging', '[class*="page"]',
                '.page-numbers', '.page-nav'
            ];
            let hasPagination = false;
            for (const selector of paginationSelectors) {
                if (document.querySelector(selector)) {
                    hasPagination = true;
                    break;
                }
            }
            return {
                hasProducts: productCount > 0,
                productCount,
                productSelector,
                hasCategories,
                hasPagination,
                requiresJavaScript: window.location.href.includes('#') ||
                    document.querySelector('[data-react-root]') !== null ||
                    document.querySelector('[id="__next"]') !== null
            };
        });
        // Check for API calls
        const apiCalls = [];
        page.on('response', response => {
            const url = response.url();
            if (url.includes('api') || url.includes('ajax') || url.includes('.json')) {
                apiCalls.push(url);
            }
        });
        // Navigate to a category or product page if possible
        const links = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            return links
                .map(link => {
                var _a;
                return ({
                    href: link.href,
                    text: ((_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''
                });
            })
                .filter(link => link.href.includes('category') ||
                link.href.includes('product') ||
                link.href.includes('goods') ||
                link.href.includes('item'))
                .slice(0, 5);
        });
        await browser.close();
        return {
            ...structure,
            apiCalls: [...new Set(apiCalls)],
            sampleLinks: links
        };
    }
    catch (error) {
        await browser.close();
        throw error;
    }
}
async function analyzeWithAxios(mall) {
    var _a;
    try {
        console.log(`Fetching ${mall.name} with axios...`);
        const response = await axios_1.default.get(mall.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        const $ = cheerio.load(response.data);
        // Save homepage HTML
        await fs.writeFile(path.join(__dirname, 'output', mall.id, `${mall.id}-homepage-axios.html`), response.data);
        // Analyze structure
        const productSelectors = [
            '.product-item', '.product', '.item', '.goods-item',
            '[class*="product"]', '[class*="item"]', '[class*="goods"]'
        ];
        let productInfo = null;
        for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                productInfo = {
                    selector,
                    count: elements.length,
                    firstItem: (_a = elements.first().html()) === null || _a === void 0 ? void 0 : _a.substring(0, 200)
                };
                break;
            }
        }
        return {
            hasProducts: productInfo !== null,
            productInfo,
            hasCategories: $('.category, .categories, [class*="category"]').length > 0,
            hasPagination: $('.pagination, .paging, [class*="page"]').length > 0,
            totalLinks: $('a[href]').length,
            scripts: $('script').length,
            hasReactRoot: $('#__next, [data-react-root]').length > 0
        };
    }
    catch (error) {
        throw error;
    }
}
async function analyzeMall(mall) {
    var _a;
    try {
        let structure;
        // Special handling for Naver Smart Store
        if (mall.url.includes('smartstore.naver.com')) {
            structure = {
                hasCategories: true,
                categoryStructure: 'Naver Smart Store Standard',
                urlPatterns: {
                    homepage: mall.url,
                    categoryPattern: 'category/:id',
                    productPattern: 'products/:id'
                },
                pagination: {
                    type: 'infinite-scroll'
                },
                requiresJavaScript: true,
                dataLocation: {
                    productListSelector: 'Naver Smart Store Dynamic',
                    productItemSelector: '[class*="product"]'
                },
                note: 'Naver Smart Store requires special handling with their API'
            };
        }
        // Special handling for cyso.co.kr malls
        else if (mall.url.includes('cyso.co.kr')) {
            try {
                const puppeteerResult = await analyzeWithPuppeteer(mall);
                structure = {
                    hasCategories: puppeteerResult.hasCategories,
                    urlPatterns: {
                        homepage: mall.url,
                        categoryPattern: '/shop/list.php?ca_id=:id',
                        productPattern: '/shop/item.php?it_id=:id'
                    },
                    pagination: {
                        type: puppeteerResult.hasPagination ? 'page-numbers' : 'none',
                        pageParamName: 'page'
                    },
                    requiresJavaScript: puppeteerResult.requiresJavaScript,
                    dataLocation: {
                        productListSelector: puppeteerResult.productSelector || '.item-list',
                        productItemSelector: '.list-item'
                    }
                };
            }
            catch (error) {
                // Fallback for cyso malls
                const axiosResult = await analyzeWithAxios(mall);
                structure = {
                    hasCategories: axiosResult.hasCategories,
                    urlPatterns: { homepage: mall.url },
                    pagination: { type: 'page-numbers' },
                    requiresJavaScript: false,
                    dataLocation: { productListSelector: '.item-list' }
                };
            }
        }
        // Regular analysis for other malls
        else {
            try {
                const puppeteerResult = await analyzeWithPuppeteer(mall);
                structure = {
                    hasCategories: puppeteerResult.hasCategories,
                    hasProducts: puppeteerResult.hasProducts,
                    productCount: puppeteerResult.productCount,
                    urlPatterns: {
                        homepage: mall.url
                    },
                    pagination: {
                        type: puppeteerResult.hasPagination ? 'page-numbers' : 'none'
                    },
                    requiresJavaScript: puppeteerResult.requiresJavaScript,
                    dataLocation: {
                        productListSelector: puppeteerResult.productSelector
                    },
                    apiEndpoints: ((_a = puppeteerResult.apiCalls) === null || _a === void 0 ? void 0 : _a.length) > 0 ? {
                        detected: puppeteerResult.apiCalls
                    } : undefined,
                    sampleLinks: puppeteerResult.sampleLinks
                };
            }
            catch (error) {
                // Fallback to axios
                const axiosResult = await analyzeWithAxios(mall);
                structure = {
                    ...axiosResult,
                    urlPatterns: { homepage: mall.url },
                    pagination: { type: axiosResult.hasPagination ? 'page-numbers' : 'none' },
                    requiresJavaScript: axiosResult.hasReactRoot || axiosResult.scripts > 10,
                    dataLocation: {}
                };
            }
        }
        return {
            mallId: mall.id,
            mallName: mall.name,
            url: mall.url,
            region: mall.region,
            status: 'success',
            structure
        };
    }
    catch (error) {
        return {
            mallId: mall.id,
            mallName: mall.name,
            url: mall.url,
            region: mall.region,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function main() {
    var _a, _b;
    console.log('Starting analysis of empty malls...\n');
    const results = [];
    const summary = {
        total: emptyMalls.length,
        success: 0,
        error: 0,
        requiresJavaScript: 0,
        hasCategories: 0,
        byRegion: {}
    };
    // Group by region for better organization
    const mallsByRegion = emptyMalls.reduce((acc, mall) => {
        if (!acc[mall.region])
            acc[mall.region] = [];
        acc[mall.region].push(mall);
        return acc;
    }, {});
    // Analyze malls by region
    for (const [region, malls] of Object.entries(mallsByRegion)) {
        console.log(`\n=== Analyzing ${region} malls (${malls.length}) ===`);
        for (const mall of malls) {
            console.log(`\nAnalyzing ${mall.name}...`);
            try {
                const result = await analyzeMall(mall);
                results.push(result);
                // Save individual analysis
                await fs.writeFile(path.join(__dirname, 'output', mall.id, `${mall.id}-analysis.json`), JSON.stringify(result, null, 2));
                // Update summary
                if (result.status === 'success') {
                    summary.success++;
                    if ((_a = result.structure) === null || _a === void 0 ? void 0 : _a.requiresJavaScript)
                        summary.requiresJavaScript++;
                    if ((_b = result.structure) === null || _b === void 0 ? void 0 : _b.hasCategories)
                        summary.hasCategories++;
                }
                else {
                    summary.error++;
                }
                summary.byRegion[region] = (summary.byRegion[region] || 0) + 1;
                console.log(`✓ Completed: ${result.status}`);
            }
            catch (error) {
                console.error(`✗ Failed to analyze ${mall.name}:`, error);
                results.push({
                    mallId: mall.id,
                    mallName: mall.name,
                    url: mall.url,
                    region: mall.region,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                summary.error++;
            }
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    // Save overall results
    await fs.writeFile(path.join(__dirname, 'output', 'empty-malls-analysis.json'), JSON.stringify({ summary, results }, null, 2));
    console.log('\n=== Analysis Complete ===');
    console.log(`Total malls analyzed: ${summary.total}`);
    console.log(`Successful: ${summary.success}`);
    console.log(`Errors: ${summary.error}`);
    console.log(`Requires JavaScript: ${summary.requiresJavaScript}`);
    console.log(`Has categories: ${summary.hasCategories}`);
    console.log('\nBy region:');
    Object.entries(summary.byRegion).forEach(([region, count]) => {
        console.log(`  ${region}: ${count}`);
    });
}
// Run the analysis
main().catch(console.error);
