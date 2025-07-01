import * as fs from 'fs';
import * as path from 'path';

// Auto-generated analysis script for 서산뜨레
const analysis = {
  "mallId": 33,
  "mallName": "서산뜨레",
  "url": "https://seosanttre.com/index.html",
  "platform": "Custom (shopbrand)",
  "requiresJavaScript": false,
  "categories": [
    {
      "id": "001",
      "name": "쌀/잡곡"
    },
    {
      "id": "001",
      "name": "일반쌀"
    },
    {
      "id": "001",
      "name": "잡곡/혼합곡"
    },
    {
      "id": "002",
      "name": "과일/채소"
    },
    {
      "id": "002",
      "name": "과일류"
    }
  ],
  "urlPatterns": {
    "category": "/shop/shopbrand.html?xcode={categoryId}",
    "product": "/shop/shopdetail.html?branduid={productId}",
    "search": "/shop/shopbrand.html?search={keyword}"
  }
};

console.log('Analysis for 서산뜨레:', analysis);
fs.writeFileSync(path.join(__dirname, 'analysis-33.json'), JSON.stringify(analysis, null, 2));
