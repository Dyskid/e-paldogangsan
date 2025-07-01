import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface AnalysisOptions {
  mode: 'simple' | 'comprehensive' | 'spa' | 'price' | 'ajax';
  method: 'static' | 'dynamic';
  specialFeatures?: string[];
}

interface MallAnalysis {
  mallName: string;
  mallUrl: string;
  timestamp: string;
  analysisType: string;
  [key: string]: any;
}

export class UnifiedMallAnalyzer {
  private mallName: string;
  private mallUrl: string;
  private outputDir: string;

  constructor(mallName: string, mallUrl: string) {
    this.mallName = mallName;
    this.mallUrl = mallUrl;
    this.outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async analyze(options: AnalysisOptions = { mode: 'comprehensive', method: 'dynamic' }): Promise<MallAnalysis> {
    console.log(`🔍 Analyzing ${this.mallName}...`);
    console.log(`Mode: ${options.mode}, Method: ${options.method}`);

    const baseAnalysis: MallAnalysis = {
      mallName: this.mallName,
      mallUrl: this.mallUrl,
      timestamp: new Date().toISOString(),
      analysisType: `${options.mode}-${options.method}`
    };

    try {
      if (options.method === 'dynamic') {
        return await this.analyzeDynamic(baseAnalysis, options);
      } else {
        return await this.analyzeStatic(baseAnalysis, options);
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private async analyzeDynamic(baseAnalysis: MallAnalysis, options: AnalysisOptions): Promise<MallAnalysis> {
    const browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    try {
      const page = await browser.newPage();
      
      // Mode-specific analysis
      switch (options.mode) {
        case 'spa':
          return await this.analyzeSPA(page, baseAnalysis);
        case 'ajax':
          return await this.analyzeAjax(page, baseAnalysis);
        case 'price':
          return await this.analyzePrice(page, baseAnalysis);
        default:
          return await this.analyzeComprehensive(page, baseAnalysis);
      }
    } finally {
      await browser.close();
    }
  }

  private async analyzeStatic(baseAnalysis: MallAnalysis, options: AnalysisOptions): Promise<MallAnalysis> {
    const response = await axios.get(this.mallUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Basic structure analysis
    baseAnalysis.structure = {
      title: $('title').text(),
      hasCategories: $('[class*="category"], [href*="category"]').length > 0,
      hasProducts: $('[class*="product"], [href*="product"]').length > 0,
      forms: $('form').length,
      scripts: $('script').length
    };

    return baseAnalysis;
  }

  private async analyzeSPA(page: any, baseAnalysis: MallAnalysis): Promise<MallAnalysis> {
    // SPA-specific analysis logic
    await page.goto(this.mallUrl, { waitUntil: 'networkidle2' });
    // Add SPA detection and handling
    return { ...baseAnalysis, spaDetected: true };
  }

  private async analyzeAjax(page: any, baseAnalysis: MallAnalysis): Promise<MallAnalysis> {
    // AJAX-specific analysis logic
    await page.goto(this.mallUrl, { waitUntil: 'networkidle2' });
    // Add AJAX request interception
    return { ...baseAnalysis, ajaxRequests: [] };
  }

  private async analyzePrice(page: any, baseAnalysis: MallAnalysis): Promise<MallAnalysis> {
    // Price extraction specific logic
    await page.goto(this.mallUrl, { waitUntil: 'networkidle2' });
    // Add price pattern detection
    return { ...baseAnalysis, pricePatterns: [] };
  }

  private async analyzeComprehensive(page: any, baseAnalysis: MallAnalysis): Promise<MallAnalysis> {
    // Comprehensive analysis combining all approaches
    await page.goto(this.mallUrl, { waitUntil: 'networkidle2' });
    // Add comprehensive analysis logic
    return { ...baseAnalysis, comprehensive: true };
  }

  async saveAnalysis(analysis: MallAnalysis, filename?: string): Promise<string> {
    const file = filename || `${this.mallName.replace(/[^a-zA-Z0-9가-힣]/g, '-')}-analysis.json`;
    const filepath = path.join(this.outputDir, file);
    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
    console.log(`✅ Analysis saved to: ${filepath}`);
    return filepath;
  }
}

// Main execution function
async function main() {
  const analyzer = new UnifiedMallAnalyzer('해남미소', 'https://www.hnmiso.com/kwa-home');
  
  try {
    const analysis = await analyzer.analyze({
      mode: 'comprehensive',
      method: 'dynamic'
    });
    
    await analyzer.saveAnalysis(analysis);
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

if (require.main === module) {
  main();
}
