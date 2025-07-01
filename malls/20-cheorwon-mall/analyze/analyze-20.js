"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var analysis = {
    mallId: 20,
    mallName: 'cheorwon-mall',
    websiteUrl: 'https://cheorwon-mall.com/',
    status: 'accessible',
    platform: 'firstmall',
    productStructure: {
        categoryPattern: '/goods/catalog?code=',
        productListSelector: '.gl_item',
        productItemSelector: '.goodS_info.displaY_goods_name a',
        productUrlPattern: '/goods/view?no=',
        paginationSelector: '.paging a',
        searchPattern: '/goods/search'
    },
    dataLocation: {
        type: 'javascript_rendered',
        endpoints: [
            '/goods/search',
            '/goods/catalog',
            '/goods/view'
        ]
    },
    categories: [
        { name: '쌀/잡곡', url: '/goods/catalog?code=0002' },
        { name: '채소/임산물', url: '/goods/catalog?code=0001' },
        { name: '과일/건과', url: '/goods/catalog?code=0003' },
        { name: '수산/건어물', url: '/goods/catalog?code=0004' },
        { name: '정육/계란류', url: '/goods/catalog?code=0005' }
    ],
    selectors: {
        price: '.goodS_info.displaY_sales_price .nuM',
        title: '.goodS_info.displaY_goods_name',
        image: '.goodsDisplayImage',
        options: '.goods_option select'
    },
    analysisDate: new Date().toISOString()
};
// Save analysis result
var outputPath = path.join(__dirname, 'analysis-20.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log('Analysis completed for cheorwon-mall (ID: 20)');
console.log('Platform: Firstmall');
console.log('Categories found:', analysis.categories.length || 0);
console.log('Status: Accessible');