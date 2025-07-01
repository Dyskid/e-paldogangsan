"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var analysis = {
    id: 21,
    engname: "jeongseon-mall",
    name: "정선몰",
    url: "https://jeongseon-mall.com/",
    scrapable: false,
    structure: {
        type: "firstmall",
        catalogPattern: "/goods/catalog?code={categoryCode}",
        requiresJavaScript: true,
        notes: "Uses Firstmall platform. Products appear to be loaded dynamically via JavaScript. Static HTML pages do not contain product data."
    },
    categories: [
        {
            name: "축산물",
            code: "0008",
            subcategories: [
                { name: "쇠고기", code: "00080001" }
            ]
        },
        {
            name: "농산물",
            code: "0001",
            subcategories: [
                { name: "건나물", code: "00010003" },
                { name: "김/해초", code: "00010004" },
                { name: "잡곡/혼합곡", code: "00010005" },
                { name: "채소", code: "00010006" },
                { name: "과일", code: "00010007" },
                { name: "견과류", code: "00010008" }
            ]
        },
        {
            name: "건강식품",
            code: "0002",
            subcategories: [
                { name: "인삼", code: "00020001" },
                { name: "건강환/정", code: "00020004" },
                { name: "한방재료", code: "00020005" },
                { name: "건강즙/과일즙", code: "00020006" }
            ]
        },
        {
            name: "음료",
            code: "0003",
            subcategories: [
                { name: "차류", code: "00030001" },
                { name: "주스/과즙음료", code: "00030002" }
            ]
        },
        {
            name: "과자/베이커리",
            code: "0007",
            subcategories: [
                { name: "떡", code: "00070001" }
            ]
        }
    ],
    issues: [
        "Product data is not available in static HTML",
        "Requires JavaScript execution to load product listings",
        "Category pages return empty content without JavaScript",
        "Uses Firstmall e-commerce platform which requires dynamic rendering"
    ],
    recommendations: [
        "Use headless browser (Puppeteer/Playwright) to render JavaScript",
        "Monitor for AJAX calls that load product data",
        "Check for API endpoints that might provide product data in JSON format",
        "Consider contacting the mall administrator for data access"
    ]
};
// Write the analysis to JSON file
var outputPath = path.join(__dirname, 'analysis-21.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log("Analysis saved to ".concat(outputPath));
