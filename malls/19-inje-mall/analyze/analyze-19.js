"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var analysis = {
    mallId: 19,
    mallName: 'inje-mall',
    websiteUrl: 'https://inje-mall.com/',
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
        { name: '용대리 황태', url: '/goods/catalog?code=0015' },
        { name: '선물세트', url: '/goods/catalog?code=0016' },
        { name: '농산물', url: '/goods/catalog?code=0004' },
        { name: '수산물', url: '/goods/catalog?code=0008' },
        { name: '임산물', url: '/goods/catalog?code=0013' },
        { name: '건강식품', url: '/goods/catalog?code=0007' },
        { name: '가공식품', url: '/goods/catalog?code=0009' }
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
var outputPath = path.join(__dirname, 'analysis-19.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log('Analysis completed for inje-mall (ID: 19)');
console.log('Platform: Firstmall');
console.log('Categories found:', analysis.categories.length || 0);
console.log('Status: Accessible');