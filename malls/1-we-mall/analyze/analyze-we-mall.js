"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var cheerio = __importStar(require("cheerio"));
function analyzeMall() {
    return __awaiter(this, void 0, void 0, function () {
        var analysis, homepageHtml, categoryHtml, $_1, categories_1, $category, paginationLinks, startMatch, outputPath, outputPath;
        var _a;
        return __generator(this, function (_b) {
            analysis = {
                mallId: 1,
                mallName: '우리몰',
                mallUrl: 'https://wemall.kr',
                engName: 'we-mall',
                structure: {
                    categories: [],
                    productListing: {
                        selector: '.shop .list > li',
                        fields: {
                            name: '.description h3 em',
                            price: '.description .price strong',
                            image: '.tumb img',
                            link: '.btn a.view',
                            seller: '.description .point span'
                        }
                    },
                    pagination: {
                        type: 'offset',
                        parameter: 'start',
                        itemsPerPage: 12,
                        selector: '.pagination'
                    },
                    requiresJavaScript: false,
                    searchUrl: '/product/product.html',
                    searchParameter: 'keyword'
                },
                analysisDate: new Date().toISOString(),
                status: 'success',
                notes: []
            };
            try {
                homepageHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'homepage.html'), 'utf-8');
                categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
                $_1 = cheerio.load(homepageHtml);
                categories_1 = [];
                // Main categories
                $_1('.gnb_cate > a').each(function (i, elem) {
                    var $elem = $_1(elem);
                    var href = $elem.attr('href') || '';
                    var categoryMatch = href.match(/category=(\d+)/);
                    if (categoryMatch) {
                        var category_1 = {
                            id: categoryMatch[1],
                            name: $elem.text().trim(),
                            url: "https://wemall.kr".concat(href),
                            subcategories: []
                        };
                        // Get subcategories
                        $elem.nextAll('ul').first().find('li a').each(function (j, subElem) {
                            var $subElem = $_1(subElem);
                            var subHref = $subElem.attr('href') || '';
                            var subCategoryMatch = subHref.match(/category=(\d+)/);
                            if (subCategoryMatch) {
                                category_1.subcategories.push({
                                    id: subCategoryMatch[1],
                                    name: $subElem.text().trim(),
                                    url: "https://wemall.kr".concat(subHref)
                                });
                            }
                        });
                        categories_1.push(category_1);
                    }
                });
                analysis.structure.categories = categories_1;
                $category = cheerio.load(categoryHtml);
                paginationLinks = $category('.pagination a');
                if (paginationLinks.length > 0) {
                    startMatch = (_a = paginationLinks.first().attr('href')) === null || _a === void 0 ? void 0 : _a.match(/start=(\d+)/);
                    if (startMatch) {
                        analysis.notes.push('Pagination uses offset-based system with "start" parameter');
                        analysis.notes.push('Items per page appears to be 12 based on pagination links');
                    }
                }
                // Additional notes based on analysis
                analysis.notes.push('Mall uses traditional server-side rendering without AJAX loading');
                analysis.notes.push('Product URLs follow pattern: /product/product.html?category={id}&id={productId}&mode=view');
                analysis.notes.push('Search functionality uses GET request with "keyword" parameter');
                analysis.notes.push('Categories are hierarchical with main categories and subcategories');
                analysis.notes.push('Special categories exist for government purchases (011) and group purchases (012)');
                analysis.notes.push('Products for disabled-owned businesses have dedicated categories (039, 040)');
                outputPath = path.join(__dirname, 'analysis-we-mall.json');
                fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
                console.log('Analysis completed successfully!');
                console.log("Output saved to: ".concat(outputPath));
            }
            catch (error) {
                analysis.status = 'error';
                analysis.notes.push("Error during analysis: ".concat(error));
                outputPath = path.join(__dirname, 'analysis-we-mall.json');
                fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
                console.error('Analysis failed:', error);
            }
            return [2 /*return*/];
        });
    });
}
// Run the analysis
analyzeMall();
