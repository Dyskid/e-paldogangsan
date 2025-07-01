"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var analysis = {
    "id": 26,
    "engname": "pyeongchang-mall",
    "name": "평창몰",
    "url": "https://gwpc-mall.com/",
    "scrapable": true,
    "structure": {
        "type": "firstmall",
        "catalogPattern": "/goods/catalog?code={categoryCode}",
        "requiresJavaScript": false,
        "notes": "Platform: firstmall. Products appear to be available in static HTML."
    },
    "categories": [
        {
            "name": "Category 00120001",
            "code": "00120001"
        },
        {
            "name": "Category 0002",
            "code": "0002"
        },
        {
            "name": "Category 0012",
            "code": "0012"
        },
        {
            "name": "Category 0007",
            "code": "0007"
        },
        {
            "name": "Category 00050002",
            "code": "00050002"
        }
    ],
    "issues": [],
    "recommendations": [
        "Use standard HTTP requests to fetch pages",
        "Parse HTML to extract product information",
        "Monitor for pagination patterns"
    ]
};
// Write the analysis to JSON file
var outputPath = path.join(__dirname, 'analysis-26.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log("Analysis saved to ".concat(outputPath));
