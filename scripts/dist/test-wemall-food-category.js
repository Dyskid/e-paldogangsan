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
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs_1 = require("fs");
async function testWemallFoodCategory() {
    try {
        console.log('🔍 Testing wemall food category (001)...');
        // Test with food category which is more likely to have products
        const testUrl = 'https://wemall.kr/product/product.html?category=001';
        const response = await axios_1.default.get(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 30000
        });
        console.log(`✅ Successfully fetched food category (${response.status})`);
        const $ = cheerio.load(response.data);
        // Save HTML for analysis
        (0, fs_1.writeFileSync)('./scripts/output/wemall-category-001.html', response.data);
        console.log('💾 Saved food category HTML');
        console.log(`📋 Page title: ${$('title').text().trim()}`);
        // Search more specifically for table-based layout which is common in older Korean malls
        const tableCells = $('table td');
        console.log(`📊 Found ${tableCells.length} table cells`);
        // Look for links containing product view
        const viewLinks = $('a[href*="mode=view"]');
        console.log(`🔗 Found ${viewLinks.length} product view links`);
        if (viewLinks.length > 0) {
            console.log('\n📦 Sample product links:');
            viewLinks.slice(0, 10).each((i, elem) => {
                const $elem = $(elem);
                const href = $elem.attr('href');
                const text = $elem.text().trim();
                const fullUrl = href?.startsWith('http') ? href : `https://wemall.kr${href}`;
                console.log(`  ${i + 1}. ${text.substring(0, 40)}... → ${fullUrl}`);
            });
        }
        // Look for images that might be product thumbnails
        const images = $('img[src*="upload"], img[src*="thumb"], img[src*="product"]');
        console.log(`🖼️ Found ${images.length} potential product images`);
        // Look for table structure more specifically
        const productTables = $('table[cellpadding], table[border], table[width]');
        console.log(`📋 Found ${productTables.length} structured tables`);
        if (productTables.length > 0) {
            console.log('\n📋 Analyzing table structure:');
            productTables.each((i, table) => {
                const $table = $(table);
                const rows = $table.find('tr');
                const cells = $table.find('td');
                const links = $table.find('a[href*="mode=view"]');
                console.log(`  Table ${i + 1}: ${rows.length} rows, ${cells.length} cells, ${links.length} product links`);
                if (links.length > 0) {
                    console.log(`    First product link: ${links.first().attr('href')}`);
                }
            });
        }
        // Check for pagination specifically
        const pageLinks = $('a[href*="page="]');
        console.log(`📄 Found ${pageLinks.length} pagination links`);
        if (pageLinks.length > 0) {
            console.log('\n📄 Pagination structure:');
            pageLinks.slice(0, 5).each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                console.log(`  ${text}: ${href}`);
            });
        }
        // Look for any JavaScript that might load products dynamically
        const scripts = $('script').map((i, elem) => $(elem).html()).get();
        const hasAjax = scripts.some(script => script && (script.includes('ajax') || script.includes('xhr')));
        console.log(`⚡ AJAX loading detected: ${hasAjax}`);
    }
    catch (error) {
        console.error('❌ Error testing food category:', error);
    }
}
// Run test
testWemallFoodCategory().then(() => {
    console.log('✅ Food category test complete!');
}).catch(console.error);
