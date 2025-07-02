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
var node_fetch_1 = require("node-fetch");
var cheerio = require("cheerio");
function analyzeMall(mallId, mallName, mallEngName, mallUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var baseDir, outputDir, headers, response, html, $_1, categories_1, categorySelectors, categoryFound, _i, categorySelectors_1, selector, elements, pagination, productStructure, sampleCategory, catResponse, catHtml, $cat, productSelectors, _a, productSelectors_1, selector, products, $firstProduct, nameSelectors, _b, nameSelectors_1, nameSelector, priceSelectors, _c, priceSelectors_1, priceSelector, paginationSelectors, _d, paginationSelectors_1, selector, catError_1, requiresJavaScript, urlPatterns, analysis, report, error_1, errorReport, failedAnalysis;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    baseDir = "malls/".concat(mallId, "-").concat(mallEngName, "/analyze");
                    outputDir = path.join(baseDir, 'requirements');
                    // Ensure directories exist
                    if (!fs.existsSync(baseDir)) {
                        fs.mkdirSync(baseDir, { recursive: true });
                    }
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 9, , 10]);
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    };
                    console.log("Fetching main page: ".concat(mallUrl));
                    return [4 /*yield*/, (0, node_fetch_1.default)(mallUrl, { headers: headers })];
                case 2:
                    response = _e.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.text()];
                case 3:
                    html = _e.sent();
                    fs.writeFileSync(path.join(outputDir, 'main.html'), html);
                    $_1 = cheerio.load(html);
                    categories_1 = [];
                    categorySelectors = [
                        '.category-list a',
                        '.nav-category a',
                        '.menu-category a',
                        '#category a',
                        '.gnb a',
                        '.lnb a',
                        'nav a',
                        '.category a',
                        '.menu a',
                        '.nav-menu a',
                        '.sub-menu a',
                        '.depth1 a',
                        '.cate_list a',
                        '.catalog_list a'
                    ];
                    categoryFound = false;
                    for (_i = 0, categorySelectors_1 = categorySelectors; _i < categorySelectors_1.length; _i++) {
                        selector = categorySelectors_1[_i];
                        elements = $_1(selector);
                        if (elements.length > 0) {
                            elements.each(function (i, el) {
                                var _a, _b, _c;
                                var $el = $_1(el);
                                var href = $el.attr('href');
                                var text = $el.text().trim();
                                if (href && text && !href.startsWith('#') && !href.includes('javascript:')) {
                                    try {
                                        var fullUrl_1 = new URL(href, mallUrl).toString();
                                        var id = ((_a = href.match(/cate[_=]?(\d+)/i)) === null || _a === void 0 ? void 0 : _a[1]) ||
                                            ((_b = href.match(/category[_=]?(\d+)/i)) === null || _b === void 0 ? void 0 : _b[1]) ||
                                            ((_c = href.match(/code[_=]?(\w+)/i)) === null || _c === void 0 ? void 0 : _c[1]) ||
                                            "cat".concat(i);
                                        // Skip duplicates
                                        if (!categories_1.find(function (c) { return c.url === fullUrl_1; })) {
                                            categories_1.push({
                                                name: text,
                                                url: fullUrl_1,
                                                id: id
                                            });
                                        }
                                    }
                                    catch (urlError) {
                                        // Skip invalid URLs
                                    }
                                }
                            });
                            if (categories_1.length > 0) {
                                categoryFound = true;
                                break;
                            }
                        }
                    }
                    pagination = { type: 'none' };
                    productStructure = {
                        containerSelector: '',
                        itemSelector: '',
                        nameSelector: '',
                        priceSelector: '',
                        imageSelector: '',
                        linkSelector: ''
                    };
                    if (!(categories_1.length > 0)) return [3 /*break*/, 8];
                    sampleCategory = categories_1[0];
                    console.log("\nFetching category page: ".concat(sampleCategory.url));
                    _e.label = 4;
                case 4:
                    _e.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, (0, node_fetch_1.default)(sampleCategory.url, { headers: headers })];
                case 5:
                    catResponse = _e.sent();
                    return [4 /*yield*/, catResponse.text()];
                case 6:
                    catHtml = _e.sent();
                    fs.writeFileSync(path.join(outputDir, 'category-sample.html'), catHtml);
                    $cat = cheerio.load(catHtml);
                    productSelectors = [
                        '.product-item',
                        '.item',
                        '.goods',
                        '.product',
                        '.prd-item',
                        'li.xans-record-',
                        '.goods_list li',
                        '.item_list li',
                        '.product_list li'
                    ];
                    for (_a = 0, productSelectors_1 = productSelectors; _a < productSelectors_1.length; _a++) {
                        selector = productSelectors_1[_a];
                        products = $cat(selector);
                        if (products.length > 0) {
                            productStructure.itemSelector = selector;
                            $firstProduct = $cat(products.first());
                            nameSelectors = ['h3', 'h4', 'h5', '.name', '.title', '.prd-name', '.goods_name', '.item_name'];
                            for (_b = 0, nameSelectors_1 = nameSelectors; _b < nameSelectors_1.length; _b++) {
                                nameSelector = nameSelectors_1[_b];
                                if ($firstProduct.find(nameSelector).length > 0) {
                                    productStructure.nameSelector = nameSelector;
                                    break;
                                }
                            }
                            priceSelectors = ['.price', '.cost', 'span:contains("원")', '.prd-price', '.goods_price'];
                            for (_c = 0, priceSelectors_1 = priceSelectors; _c < priceSelectors_1.length; _c++) {
                                priceSelector = priceSelectors_1[_c];
                                if ($firstProduct.find(priceSelector).length > 0) {
                                    productStructure.priceSelector = priceSelector;
                                    break;
                                }
                            }
                            if ($firstProduct.find('img').length > 0) {
                                productStructure.imageSelector = 'img';
                            }
                            if ($firstProduct.find('a').length > 0) {
                                productStructure.linkSelector = 'a';
                            }
                            productStructure.containerSelector = selector;
                            break;
                        }
                    }
                    paginationSelectors = [
                        '.pagination',
                        '.paging',
                        '.page-list',
                        '.xans-product-normalpaging',
                        '.page_nation',
                        '.paginate'
                    ];
                    for (_d = 0, paginationSelectors_1 = paginationSelectors; _d < paginationSelectors_1.length; _d++) {
                        selector = paginationSelectors_1[_d];
                        if ($cat(selector).length > 0) {
                            pagination = {
                                type: 'page',
                                pageParam: 'page'
                            };
                            break;
                        }
                    }
                    return [3 /*break*/, 8];
                case 7:
                    catError_1 = _e.sent();
                    console.error("Error fetching category: ".concat(catError_1));
                    return [3 /*break*/, 8];
                case 8:
                    requiresJavaScript = html.includes('__NEXT_DATA__') ||
                        html.includes('React') ||
                        html.includes('Vue') ||
                        html.includes('angular') ||
                        html.includes('firstmall') ||
                        $_1('noscript').text().includes('JavaScript');
                    urlPatterns = {
                        categoryPattern: categories_1.length > 0 ?
                            (categories_1[0].url.includes('cate=') ? '/shop/list.php?cate={categoryId}' :
                                categories_1[0].url.includes('category=') ? '/?category={categoryId}' :
                                    categories_1[0].url.includes('code=') ? '/goods/catalog?code={categoryId}' :
                                        '/category/{categoryId}') : '',
                        productPattern: '/product/{productId}',
                        paginationPattern: pagination.type === 'page' ? '?page={pageNumber}' : undefined
                    };
                    analysis = {
                        mallId: mallId,
                        mallName: mallName,
                        url: mallUrl,
                        categories: categories_1.slice(0, 10), // Limit to first 10 categories
                        urlPatterns: urlPatterns,
                        pagination: pagination,
                        requiresJavaScript: requiresJavaScript,
                        productStructure: productStructure,
                        additionalNotes: categories_1.length === 0 ?
                            'Unable to find category structure. Manual inspection required.' :
                            undefined
                    };
                    // Save analysis
                    fs.writeFileSync(path.join(baseDir, "analysis-".concat(mallId, ".json")), JSON.stringify(analysis, null, 2));
                    report = "# ".concat(mallName, " (ID: ").concat(mallId, ") Analysis Report\n\n## Status: ").concat(categories_1.length > 0 ? 'Successful' : 'Partial Success', "\n\n## Summary\n- **URL**: ").concat(mallUrl, "\n- **Categories Found**: ").concat(categories_1.length, "\n- **Requires JavaScript**: ").concat(requiresJavaScript ? 'Yes' : 'No', "\n- **Pagination Type**: ").concat(pagination.type, "\n\n## Details\n\n### Categories\n").concat(categories_1.slice(0, 5).map(function (cat) { return "- ".concat(cat.name, ": ").concat(cat.url); }).join('\n') || 'No categories found', "\n\n### URL Patterns\n- Category: ").concat(urlPatterns.categoryPattern || 'Not determined', "\n- Product: ").concat(urlPatterns.productPattern, "\n").concat(urlPatterns.paginationPattern ? "- Pagination: ".concat(urlPatterns.paginationPattern) : '', "\n\n### Product Structure\n- Container: ").concat(productStructure.containerSelector || 'Not found', "\n- Name Selector: ").concat(productStructure.nameSelector || 'Not found', "\n- Price Selector: ").concat(productStructure.priceSelector || 'Not found', "\n\n### Notes\n").concat(analysis.additionalNotes || 'Analysis completed successfully.', "\n");
                    fs.writeFileSync(path.join(baseDir, "report-".concat(mallId, ".md")), report);
                    console.log('Analysis completed successfully!');
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _e.sent();
                    console.error('Error during analysis:', error_1);
                    errorReport = "# ".concat(mallName, " (ID: ").concat(mallId, ") Analysis Report\n\n## Status: Failed\n\n## Error\n").concat(error_1, "\n\n## Reason\nUnable to complete the analysis due to the error above. This could be due to:\n- Network connectivity issues\n- Website blocking automated requests\n- Website structure changes\n- SSL/TLS certificate issues\n\n## Recommendation\nManual inspection of the website is required.\n");
                    fs.writeFileSync(path.join(baseDir, "report-".concat(mallId, ".md")), errorReport);
                    failedAnalysis = {
                        mallId: mallId,
                        mallName: mallName,
                        url: mallUrl,
                        categories: [],
                        urlPatterns: {
                            categoryPattern: '',
                            productPattern: ''
                        },
                        pagination: { type: 'none' },
                        requiresJavaScript: false,
                        productStructure: {
                            containerSelector: '',
                            itemSelector: '',
                            nameSelector: '',
                            priceSelector: '',
                            imageSelector: '',
                            linkSelector: ''
                        },
                        additionalNotes: "Analysis failed: ".concat(error_1)
                    };
                    fs.writeFileSync(path.join(baseDir, "analysis-".concat(mallId, ".json")), JSON.stringify(failedAnalysis, null, 2));
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Parse command line arguments
var args = process.argv.slice(2);
if (args.length !== 4) {
    console.error('Usage: node analyze-mall-generic.js <mallId> <mallName> <mallEngName> <mallUrl>');
    process.exit(1);
}
var mallId = args[0], mallName = args[1], mallEngName = args[2], mallUrl = args[3];
// Run the analysis
analyzeMall(parseInt(mallId), mallName, mallEngName, mallUrl).catch(console.error);
