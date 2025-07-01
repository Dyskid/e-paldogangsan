"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var analysis = {
    "id": 25,
    "engname": "hongcheon-mall",
    "name": "홍천몰",
    "url": "https://hongcheon-mall.com/",
    "scrapable": true,
    "structure": {
        "type": "firstmall",
        "catalogPattern": "/goods/catalog?code={categoryCode}",
        "requiresJavaScript": false,
        "notes": "Platform: firstmall. Products appear to be available in static HTML."
    },
    "categories": [
        {
            "name": "Category 0008",
            "code": "0008"
        },
        {
            "name": "Category 00080001",
            "code": "00080001"
        },
        {
            "name": "Category 00080002",
            "code": "00080002"
        },
        {
            "name": "Category 00080003",
            "code": "00080003"
        },
        {
            "name": "Category 0009",
            "code": "0009"
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
var outputPath = path.join(__dirname, 'analysis-25.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log("Analysis saved to ".concat(outputPath));
