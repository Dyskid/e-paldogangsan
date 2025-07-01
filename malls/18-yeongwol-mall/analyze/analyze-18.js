"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var analysis = {
    mallId: 18,
    mallName: 'yeongwol-mall',
    websiteUrl: 'https://yeongwol-mall.com/',
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
        { name: '축산물', url: '/goods/catalog?code=0030' },
        { name: '과일/견과', url: '/goods/catalog?code=0017' },
        { name: '채소/나물', url: '/goods/catalog?code=0021' },
        { name: '장/소금/기름/양념', url: '/goods/catalog?code=0005' },
        { name: '가공식품', url: '/goods/catalog?code=0020' },
        { name: '쌀/잡곡', url: '/goods/catalog?code=0019' },
        { name: '건강식품', url: '/goods/catalog?code=0022' },
        { name: '생활용품/뷰티', url: '/goods/catalog?code=0008' }
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
var outputPath = path.join(__dirname, 'analysis-18.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log('Analysis completed for yeongwol-mall (ID: 18)');
console.log('Platform: Firstmall');
console.log('Categories found:', analysis.categories.length || 0);
console.log('Status: Accessible');