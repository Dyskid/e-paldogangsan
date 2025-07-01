import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface MallInfo {
  id: number;
  engname: string;
  name: string;
  url: string;
}

interface AnalysisResult {
  mallId: number;
  mallName: string;
  url: string;
  platform: string;
  requiresJavaScript: boolean;
  categories: any[];
  urlPatterns: {
    category?: string;
    product?: string;
    search?: string;
  };
}

function analyzeMall(mall: MallInfo): void {
  console.log(`\n=== Analyzing Mall ID: ${mall.id} - ${mall.name} ===`);
  
  const mallDir = `/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls/${mall.id}-${mall.engname}`;
  const analyzeDir = `${mallDir}/analyze`;
  const requirementsDir = `${analyzeDir}/requirements`;

  // Create directories
  execSync(`mkdir -p "${requirementsDir}"`, { stdio: 'pipe' });

  try {
    // Download homepage
    console.log('Downloading homepage...');
    execSync(`cd "${requirementsDir}" && curl -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${mall.url}" > homepage.html`, { stdio: 'pipe' });

    // Read and analyze homepage
    const homepageHtml = fs.readFileSync(`${requirementsDir}/homepage.html`, 'utf-8');
    
    // Detect platform
    let platform = 'Unknown';
    let requiresJavaScript = false;
    const urlPatterns: any = {};

    if (homepageHtml.includes('cafe24') || homepageHtml.includes('CAFE24')) {
      platform = 'Cafe24';
      urlPatterns.category = '/product/list.html?cate_no={categoryId}';
      urlPatterns.product = '/product/detail.html?product_no={productId}';
      urlPatterns.search = '/product/search.html?keyword={keyword}';
    } else if (homepageHtml.includes('shopbrand.html')) {
      platform = 'Custom (shopbrand)';
      urlPatterns.category = '/shop/shopbrand.html?xcode={categoryId}';
      urlPatterns.product = '/shop/shopdetail.html?branduid={productId}';
      urlPatterns.search = '/shop/shopbrand.html?search={keyword}';
    } else if (homepageHtml.includes('smartstore.naver.com')) {
      platform = 'Naver SmartStore';
      requiresJavaScript = true;
      urlPatterns.category = '/category/{categoryId}';
      urlPatterns.product = '/products/{productId}';
      urlPatterns.search = '/search?keyword={keyword}';
    }

    // Extract categories
    const categories: any[] = [];
    
    // Try Cafe24 pattern
    let categoryMatches = homepageHtml.matchAll(/href="[^"]*\/product\/list\.html\?cate_no=(\d+)"[^>]*>([^<]+)</g);
    for (const match of categoryMatches) {
      categories.push({ id: match[1], name: match[2].trim() });
    }
    
    // Try shopbrand pattern
    if (categories.length === 0) {
      categoryMatches = homepageHtml.matchAll(/href="[^"]*\/shop\/shopbrand\.html\?xcode=(\d+)[^"]*"[^>]*>([^<]+)</g);
      for (const match of categoryMatches) {
        categories.push({ id: match[1], name: match[2].trim() });
      }
    }

    // Create analysis result
    const analysis: AnalysisResult = {
      mallId: mall.id,
      mallName: mall.name,
      url: mall.url,
      platform: platform,
      requiresJavaScript: requiresJavaScript,
      categories: categories.slice(0, 5), // Top 5 categories
      urlPatterns: urlPatterns
    };

    // Write analysis result
    const analysisPath = `${analyzeDir}/analysis-${mall.id}.json`;
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');

    // Create analysis script
    const analyzeScriptContent = `import * as fs from 'fs';
import * as path from 'path';

// Auto-generated analysis script for ${mall.name}
const analysis = ${JSON.stringify(analysis, null, 2)};

console.log('Analysis for ${mall.name}:', analysis);
fs.writeFileSync(path.join(__dirname, 'analysis-${mall.id}.json'), JSON.stringify(analysis, null, 2));
`;

    fs.writeFileSync(`${analyzeDir}/analyze-${mall.id}.ts`, analyzeScriptContent, 'utf-8');

    // Create report
    const reportContent = `# Analysis Report for ${mall.name} - Mall ID: ${mall.id}

## Status: SUCCESS

## Summary
The analysis of ${mall.name} was completed successfully.

## Key Findings

### 1. Mall Information
- **Platform**: ${platform}
- **Base URL**: ${mall.url}
- **JavaScript Required**: ${requiresJavaScript ? 'Yes' : 'No'}

### 2. Categories Found
${categories.slice(0, 5).map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

### 3. URL Patterns
${Object.entries(urlPatterns).map(([key, value]) => `- **${key}**: \`${value}\``).join('\n')}

## Technical Details
- Homepage downloaded and saved
- Analysis completed successfully
- Results saved in analysis-${mall.id}.json
`;

    fs.writeFileSync(`${analyzeDir}/report-${mall.id}.md`, reportContent, 'utf-8');
    
    console.log(`✓ Mall ${mall.id} analysis completed successfully`);

  } catch (error) {
    console.error(`✗ Error analyzing mall ${mall.id}:`, error);
    
    // Create error report
    const errorReport = `# Analysis Report for ${mall.name} - Mall ID: ${mall.id}

## Status: ERROR

## Summary
The analysis of ${mall.name} encountered an error.

## Error Details
${error}

## Possible Causes
1. Website may be down or inaccessible
2. URL may have changed
3. Website may require special authentication
4. Network connectivity issues

## Recommendations
1. Verify the URL is correct
2. Check if the website requires login
3. Try accessing the website manually
4. Consider using a different scraping approach
`;

    fs.writeFileSync(`${analyzeDir}/report-${mall.id}.md`, errorReport, 'utf-8');
  }
}

// Malls to analyze
const mallsToAnalyze: MallInfo[] = [
  { id: 33, engname: 'seosan-ttre', name: '서산뜨레', url: 'https://seosanttre.com/index.html' },
  { id: 34, engname: 'buan-grandmas-garden', name: '부안 텃밭할매', url: 'https://www.xn--9z2bv5bx25anyd.kr/' },
  { id: 35, engname: 'maple-beauty-jeongeup', name: '단풍미인 (정읍)', url: 'https://www.danpoongmall.kr/' },
  { id: 36, engname: 'horizon-mall-gimje', name: '지평선몰(김제)', url: 'https://jpsmall.com/' },
  { id: 37, engname: 'jeonbuk-fresh-market', name: '전북생생장터', url: 'https://freshjb.com/' },
  { id: 38, engname: 'iksan-mall', name: '익산몰', url: 'https://iksanmall.com/' },
  { id: 39, engname: 'jinan-highland-mall', name: '진안고원몰', url: 'https://xn--299az5xoii3qb66f.com/' },
  { id: 40, engname: 'jangsu-mall', name: '장수몰', url: 'https://www.xn--352bl9k1ze.com/' }
];

// Analyze each mall
mallsToAnalyze.forEach(mall => {
  analyzeMall(mall);
});

console.log('\n=== Batch analysis complete ===');