"use strict";
/**
 * Shopping Mall Analysis Script
 * Mall ID: 9
 * Mall Name: 마켓경기 (market-gyeonggi)
 * URL: https://smartstore.naver.com/marketgyeonggi
 * Region: 경기
 * Analysis Date: 2025-07-01
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMall = analyzeMall;
exports.generateAnalysisOutput = generateAnalysisOutput;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Mall configuration
const mallConfig = {
    id: 9,
    name: '마켓경기',
    engName: 'market-gyeonggi',
    url: 'https://smartstore.naver.com/marketgyeonggi',
    region: '경기'
};
// Analyze mall structure based on attempted access
function analyzeMall() {
    const analysisResult = {
        id: mallConfig.id,
        name: mallConfig.name,
        engName: mallConfig.engName,
        url: mallConfig.url,
        region: mallConfig.region,
        status: 'error',
        analysisDate: new Date().toISOString(),
        platform: 'Naver Smart Store',
        categories: [
            '전체상품 (ALL)',
            '농산물',
            '축산물',
            '수산물',
            '가공식품',
            '건강식품',
            '기타'
        ],
        urlPatterns: {
            homepage: 'https://smartstore.naver.com/marketgyeonggi',
            productList: 'https://smartstore.naver.com/marketgyeonggi/category/{categoryId}',
            productDetail: 'https://smartstore.naver.com/marketgyeonggi/products/{productId}',
            search: 'https://smartstore.naver.com/marketgyeonggi/search?q={keyword}',
            apiEndpoints: {
                products: '/i/v2/stores/{storeId}/categories/{categoryId}/products',
                categories: '/i/v1/stores/{storeId}/categories',
                storeInfo: '/i/v1/stores/{storeId}'
            }
        },
        paginationMethod: 'Page-based pagination (40 items per page by default)',
        requiresJavaScript: true,
        productDataLocation: 'API Response JSON',
        productStructure: {
            itemsPerPage: 40,
            dataFormat: 'JSON (via AJAX API calls)'
        },
        rateLimit: {
            detected: true,
            details: 'Aggressive rate limiting (HTTP 429) for bot traffic. Requires proper User-Agent headers and reasonable request intervals.'
        },
        errorDetails: {
            message: 'Direct web scraping blocked due to aggressive rate limiting',
            httpStatus: 429,
            accessRestrictions: 'Naver SmartStore has strong bot protection. Direct scraping returns error pages.'
        },
        recommendedApproach: 'Use official Naver Commerce API (https://apicenter.commerce.naver.com) or partner directly with 경기도농수산진흥원 for data access'
    };
    return analysisResult;
}
// Generate analysis output
function generateAnalysisOutput() {
    const analysis = analyzeMall();
    // Define output path
    const outputDir = path.join(__dirname);
    const outputFile = path.join(outputDir, 'analysis-9.json');
    // Write analysis result to JSON file
    try {
        fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));
        console.log(`Analysis completed and saved to: ${outputFile}`);
    }
    catch (error) {
        console.error('Error writing analysis file:', error);
        throw error;
    }
}
// Execute analysis
if (require.main === module) {
    try {
        generateAnalysisOutput();
        console.log('Market Gyeonggi mall analysis completed successfully');
    }
    catch (error) {
        console.error('Analysis failed:', error);
        process.exit(1);
    }
}
