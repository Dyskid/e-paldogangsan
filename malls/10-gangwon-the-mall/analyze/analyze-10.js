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
function analyzeMall() {
    return __awaiter(this, void 0, void 0, function () {
        var mallId, mallName, mallUrl, response, html, $_1, categories_1, sampleProducts_1, analysis, outputPath, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mallId = 10;
                    mallName = '강원더몰';
                    mallUrl = 'https://gwdmall.kr/';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, node_fetch_1.default)(mallUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.text()];
                case 3:
                    html = _a.sent();
                    $_1 = cheerio.load(html);
                    categories_1 = [];
                    $_1('.categoryDepth1').each(function (i, elem) {
                        var mainCategory = $_1(elem).find('.categoryDepthLink').first();
                        var categoryInfo = {
                            name: mainCategory.find('em').text().trim(),
                            url: 'https://gwdmall.kr' + mainCategory.attr('href'),
                            subcategories: []
                        };
                        // Get subcategories
                        $_1(elem).find('.categoryDepth3 li a').each(function (j, subElem) {
                            var _a;
                            (_a = categoryInfo.subcategories) === null || _a === void 0 ? void 0 : _a.push({
                                name: $_1(subElem).text().trim(),
                                url: 'https://gwdmall.kr' + $_1(subElem).attr('href')
                            });
                        });
                        categories_1.push(categoryInfo);
                    });
                    sampleProducts_1 = [];
                    $_1('.goods_list .gl_item').slice(0, 5).each(function (i, elem) {
                        var _a, _b;
                        var $elem = $_1(elem);
                        var productId = ((_b = (_a = $elem.find('.respItemImageArea').attr('onclick')) === null || _a === void 0 ? void 0 : _a.match(/display_goods_view\('(\d+)'/)) === null || _b === void 0 ? void 0 : _b[1]) || '';
                        sampleProducts_1.push({
                            id: productId,
                            name: $elem.find('.goodS_info a').text().trim(),
                            price: $elem.find('.displaY_sales_price .sale_price').text().trim(),
                            imageUrl: $elem.find('.goodsDisplayImage').attr('src') || '',
                            productUrl: "https://gwdmall.kr/goods/view?no=".concat(productId)
                        });
                    });
                    analysis = {
                        mallId: mallId,
                        mallName: mallName,
                        mallUrl: mallUrl,
                        categories: categories_1.slice(0, 10), // Limit to first 10 categories
                        productStructure: {
                            listSelector: '.goods_list',
                            itemSelector: '.gl_item',
                            nameSelector: '.goodS_info a',
                            priceSelector: '.displaY_sales_price .sale_price',
                            imageSelector: '.goodsDisplayImage',
                            linkSelector: '.respItemImageArea'
                        },
                        pagination: {
                            type: 'page_parameter',
                            pageParam: 'page',
                            itemsPerPage: 40
                        },
                        javascriptRequired: true,
                        dataLoadingMethod: 'server_side_with_lazy_loading',
                        sampleProducts: sampleProducts_1
                    };
                    outputPath = path.join(__dirname, 'analysis-10.json');
                    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
                    console.log('Analysis completed successfully');
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Analysis failed:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Run the analysis
analyzeMall().catch(console.error);
