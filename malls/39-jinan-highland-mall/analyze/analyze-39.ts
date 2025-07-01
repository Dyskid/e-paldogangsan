import * as fs from 'fs';
import * as path from 'path';

// Auto-generated analysis script for 진안고원몰
const analysis = {
  "mallId": 39,
  "mallName": "진안고원몰",
  "url": "https://xn--299az5xoii3qb66f.com/",
  "platform": "Cafe24",
  "requiresJavaScript": false,
  "categories": [],
  "urlPatterns": {
    "category": "/product/list.html?cate_no={categoryId}",
    "product": "/product/detail.html?product_no={productId}",
    "search": "/product/search.html?keyword={keyword}"
  }
};

console.log('Analysis for 진안고원몰:', analysis);
fs.writeFileSync(path.join(__dirname, 'analysis-39.json'), JSON.stringify(analysis, null, 2));
