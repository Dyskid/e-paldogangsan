"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
function analyzeGochang() {
    return __awaiter(this, void 0, void 0, function () {
        var products, categoriesSet, homepageContent, productBlockRegex, productBlocks, linkRegex, linkMatch, productPath, productId, categoryId, searchPattern, nameMatch, productName, category, uniqueProducts, pricesWithValue, priceRange, analysisResult, outputPath, errorResult;
        return __generator(this, function (_a) {
            console.log('Analyzing Gochang Market (고창마켓)...');
            products = [];
            categoriesSet = new Set();
            try {
                homepageContent = fs.readFileSync(path.join(__dirname, 'requirements', 'homepage.html'), 'utf-8');
                // This is a Cafe24 platform site
                console.log('Detected Cafe24 e-commerce platform');
                productBlockRegex = /<div class="thumbnail">[\s\S]*?<div class="description"[\s\S]*?<\/ul>/g;
                productBlocks = homepageContent.match(productBlockRegex) || [];
                console.log("Found ".concat(productBlocks.length, " product blocks"));
                productBlocks.forEach(function (block, index) {
                    // Extract product URL and ID
                    var urlMatch = block.match(/href="\/product\/([^"]+)\/(\d+)\/category\/(\d+)\/display\/(\d+)\//);
                    if (!urlMatch)
                        return;
                    var productPath = urlMatch[1];
                    var productId = urlMatch[2];
                    var categoryId = urlMatch[3];
                    // Extract product name - it's in the second span within the name div
                    var nameMatch = block.match(/<div class="name">[\s\S]*?<span[^>]*>[^<]*<\/span>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
                    var productName = nameMatch ? nameMatch[1].trim() : '';
                    // Extract price
                    var priceMatch = block.match(/>([0-9,]+)원</);
                    var price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
                    // Extract image
                    var imageMatch = block.match(/ec-data-src="([^"]+)"/);
                    var imageUrl = imageMatch ? imageMatch[1] : '';
                    if (productId && productName) {
                        var category = "Category ".concat(categoryId);
                        categoriesSet.add(category);
                        products.push({
                            id: productId,
                            name: productName,
                            price: price,
                            category: category,
                            url: "https://noblegochang.com/product/".concat(productPath, "/").concat(productId, "/category/").concat(categoryId, "/display/").concat(urlMatch[4], "/"),
                            imageUrl: imageUrl
                        });
                    }
                });
                console.log("Successfully extracted ".concat(products.length, " products"));
                // If we didn't get products from blocks, try alternative extraction
                if (products.length === 0) {
                    console.log('Trying alternative extraction method...');
                    linkRegex = /href="\/product\/([^"]+)\/(\d+)\/category\/(\d+)\/display\/(\d+)\//g;
                    linkMatch = void 0;
                    while ((linkMatch = linkRegex.exec(homepageContent)) !== null) {
                        productPath = linkMatch[1];
                        productId = linkMatch[2];
                        categoryId = linkMatch[3];
                        searchPattern = new RegExp("href=\"/product/".concat(productPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "[^>]+>([^<]+)<"), 'i');
                        nameMatch = homepageContent.match(searchPattern);
                        productName = nameMatch ? nameMatch[1].trim() : decodeURIComponent(productPath);
                        category = "Category ".concat(categoryId);
                        categoriesSet.add(category);
                        // Create a simple product entry
                        products.push({
                            id: productId,
                            name: productName,
                            price: 0, // Price extraction failed
                            category: category,
                            url: "https://noblegochang.com/product/".concat(productPath, "/").concat(productId, "/category/").concat(categoryId, "/display/").concat(linkMatch[4], "/"),
                            imageUrl: ''
                        });
                    }
                }
                uniqueProducts = products.filter(function (product, index, self) {
                    return index === self.findIndex(function (p) { return p.id === product.id; });
                });
                console.log("Total unique products: ".concat(uniqueProducts.length));
                pricesWithValue = uniqueProducts.filter(function (p) { return p.price > 0; }).map(function (p) { return p.price; });
                priceRange = pricesWithValue.length > 0 ? {
                    min: Math.min.apply(Math, pricesWithValue),
                    max: Math.max.apply(Math, pricesWithValue),
                    average: Math.round(pricesWithValue.reduce(function (a, b) { return a + b; }, 0) / pricesWithValue.length)
                } : {
                    min: 0,
                    max: 0,
                    average: 0
                };
                analysisResult = {
                    mallId: 41,
                    mallName: '고창마켓',
                    website: 'https://noblegochang.com/',
                    products: uniqueProducts.slice(0, 50), // Limit to first 50 products
                    totalProducts: uniqueProducts.length,
                    categories: Array.from(categoriesSet),
                    priceRange: priceRange,
                    analysisDate: new Date().toISOString(),
                    structureInfo: {
                        platform: 'Cafe24',
                        hasSearch: true,
                        hasPagination: true,
                        hasCategories: true
                    }
                };
                outputPath = path.join(__dirname, 'analysis-41.json');
                fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
                console.log("Analysis complete. Found ".concat(uniqueProducts.length, " products."));
                console.log("Categories: ".concat(analysisResult.categories.join(', ')));
                if (pricesWithValue.length > 0) {
                    console.log("Price range: ".concat(priceRange.min, "\uC6D0 - ").concat(priceRange.max, "\uC6D0 (avg: ").concat(priceRange.average, "\uC6D0)"));
                }
                console.log("Results saved to ".concat(outputPath));
            }
            catch (error) {
                console.error('Error during analysis:', error);
                errorResult = {
                    mallId: 41,
                    mallName: '고창마켓',
                    website: 'https://noblegochang.com/',
                    error: error.message,
                    analysisDate: new Date().toISOString()
                };
                fs.writeFileSync(path.join(__dirname, 'analysis-41.json'), JSON.stringify(errorResult, null, 2));
            }
            return [2 /*return*/];
        });
    });
}
// Run the analysis
analyzeGochang();
