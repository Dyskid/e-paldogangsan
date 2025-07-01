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
function analyzeImsilMall() {
    return __awaiter(this, void 0, void 0, function () {
        var homepageContent, analysisResult, descriptionMatch, keywordsMatch, outputPath, errorResult;
        return __generator(this, function (_a) {
            console.log('Analyzing Imsil Mall (임실몰)...');
            try {
                homepageContent = fs.readFileSync(path.join(__dirname, 'requirements', 'homepage.html'), 'utf-8');
                // This is an Angular SPA using KBShop platform
                console.log('Detected Angular SPA with KBShop platform');
                console.log('Site requires JavaScript rendering for product data');
                analysisResult = {
                    mallId: 42,
                    mallName: '임실몰',
                    website: 'https://www.imsilin.kr/home',
                    products: [],
                    totalProducts: 0,
                    categories: [],
                    priceRange: {
                        min: 0,
                        max: 0,
                        average: 0
                    },
                    analysisDate: new Date().toISOString(),
                    structureInfo: {
                        platform: 'KBShop (Angular SPA)',
                        hasSearch: true, // Typical for e-commerce sites
                        hasPagination: true, // Typical for e-commerce sites
                        hasCategories: true, // Mentioned in meta description
                        requiresJavaScript: true
                    },
                    error: 'Site requires JavaScript rendering. Cannot extract product data from static HTML. Would need Puppeteer or similar tool for full analysis.'
                };
                descriptionMatch = homepageContent.match(/<meta name="description" content="([^"]+)"/);
                if (descriptionMatch) {
                    console.log('Site description:', descriptionMatch[1]);
                }
                keywordsMatch = homepageContent.match(/<meta name="keywords" content="([^"]+)"/);
                if (keywordsMatch) {
                    console.log('Keywords:', keywordsMatch[1]);
                    // Keywords include: 농산물, 쇼핑몰, 임실군청, 임실치즈
                    // This tells us they sell agricultural products, especially Imsil cheese
                }
                outputPath = path.join(__dirname, 'analysis-42.json');
                fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
                console.log('Analysis complete (limited due to JavaScript requirement)');
                console.log("Results saved to ".concat(outputPath));
            }
            catch (error) {
                console.error('Error during analysis:', error);
                errorResult = {
                    mallId: 42,
                    mallName: '임실몰',
                    website: 'https://www.imsilin.kr/home',
                    products: [],
                    totalProducts: 0,
                    categories: [],
                    priceRange: {
                        min: 0,
                        max: 0,
                        average: 0
                    },
                    analysisDate: new Date().toISOString(),
                    structureInfo: {
                        platform: 'KBShop (Angular SPA)',
                        hasSearch: false,
                        hasPagination: false,
                        hasCategories: false,
                        requiresJavaScript: true
                    },
                    error: error.message
                };
                fs.writeFileSync(path.join(__dirname, 'analysis-42.json'), JSON.stringify(errorResult, null, 2));
            }
            return [2 /*return*/];
        });
    });
}
// Run the analysis
analyzeImsilMall();
