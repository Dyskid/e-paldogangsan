import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
  logo?: string;
}

interface LogoDownloadResult {
  mallId: string;
  mallName: string;
  success: boolean;
  logoPath?: string;
  error?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const LOGOS_DIR = path.join(process.cwd(), 'public', 'logos');

// Common logo selectors for Korean shopping malls
const LOGO_SELECTORS = [
  'img[alt*="로고"]',
  'img[alt*="logo"]',
  'img[alt*="Logo"]',
  'img[alt*="LOGO"]',
  'img.logo',
  'img.site-logo',
  'img#logo',
  'a.logo img',
  'a#logo img',
  'h1 img',
  'h1 a img',
  '.header img',
  '.header-logo img',
  '#header img[src*="logo"]',
  'img[src*="logo"]',
  'img[src*="Logo"]',
  'img[src*="LOGO"]',
  '.top_logo img',
  '.site-title img',
  '.brand img',
  '#site-logo img'
];

async function downloadImage(imageUrl: string, outputPath: string): Promise<void> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 10000
    });

    const buffer = Buffer.from(response.data, 'binary');
    
    // Process image with sharp to ensure it's valid and optimize it
    await sharp(buffer)
      .resize(200, 100, { 
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 90 })
      .toFile(outputPath);
  } catch (error) {
    throw error;
  }
}

async function findLogoUrl(html: string, baseUrl: string): Promise<string | null> {
  const $ = cheerio.load(html);
  
  for (const selector of LOGO_SELECTORS) {
    const elements = $(selector);
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements.eq(i);
      let logoUrl = element.attr('src') || element.attr('data-src');
      
      if (logoUrl) {
        // Skip if it's a placeholder or base64 image
        if (logoUrl.includes('data:image') || logoUrl.includes('placeholder')) {
          continue;
        }
        
        // Convert relative URLs to absolute
        if (!logoUrl.startsWith('http')) {
          if (logoUrl.startsWith('//')) {
            logoUrl = 'https:' + logoUrl;
          } else if (logoUrl.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
          } else {
            logoUrl = new URL(logoUrl, baseUrl).href;
          }
        }
        
        // Check if URL seems valid
        if (logoUrl.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) || 
            logoUrl.includes('logo') || 
            logoUrl.includes('Logo') ||
            element.attr('alt')?.toLowerCase().includes('logo')) {
          return logoUrl;
        }
      }
    }
  }
  
  return null;
}

async function downloadMallLogo(mall: Mall): Promise<LogoDownloadResult> {
  const result: LogoDownloadResult = {
    mallId: mall.id,
    mallName: mall.name,
    success: false
  };

  try {
    console.log(`Fetching logo for ${mall.name}...`);
    
    // Fetch the mall's homepage
    const response = await axios.get(mall.url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 15000
    });

    const logoUrl = await findLogoUrl(response.data, mall.url);
    
    if (!logoUrl) {
      result.error = 'Logo not found on page';
      return result;
    }

    console.log(`Found logo URL: ${logoUrl}`);
    
    // Generate filename based on mall ID
    const filename = `${mall.id}.png`;
    const outputPath = path.join(LOGOS_DIR, filename);
    
    // Download and save the logo
    await downloadImage(logoUrl, outputPath);
    
    result.success = true;
    result.logoPath = `/logos/${filename}`;
    console.log(`✅ Downloaded logo for ${mall.name}`);
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to download logo for ${mall.name}:`, result.error);
  }

  return result;
}

async function main() {
  try {
    // Ensure logos directory exists
    await fs.mkdir(LOGOS_DIR, { recursive: true });
    
    // Read mall data
    const mallData = await fs.readFile(
      path.join(process.cwd(), 'src', 'data', 'malls.json'),
      'utf-8'
    );
    const malls: Mall[] = JSON.parse(mallData);
    
    console.log(`Found ${malls.length} malls to process`);
    
    const results: LogoDownloadResult[] = [];
    
    // Process malls in batches to avoid overwhelming servers
    const batchSize = 5;
    for (let i = 0; i < malls.length; i += batchSize) {
      const batch = malls.slice(i, i + batchSize);
      const batchPromises = batch.map(mall => downloadMallLogo(mall));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < malls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Update mall data with local logo paths
    const updatedMalls = malls.map(mall => {
      const result = results.find(r => r.mallId === mall.id);
      if (result?.success && result.logoPath) {
        return { ...mall, logo: result.logoPath };
      }
      return mall;
    });
    
    // Save updated mall data
    await fs.writeFile(
      path.join(process.cwd(), 'src', 'data', 'malls.json'),
      JSON.stringify(updatedMalls, null, 2)
    );
    
    // Generate summary report
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    const summary = {
      totalMalls: malls.length,
      successfulDownloads: successCount,
      failedDownloads: failedCount,
      successRate: `${((successCount / malls.length) * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      results: results
    };
    
    await fs.writeFile(
      path.join(process.cwd(), 'scripts', 'output', 'logo-download-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n📊 Logo Download Summary:');
    console.log(`Total malls: ${malls.length}`);
    console.log(`✅ Successful downloads: ${successCount}`);
    console.log(`❌ Failed downloads: ${failedCount}`);
    console.log(`Success rate: ${summary.successRate}`);
    
  } catch (error) {
    console.error('Failed to download logos:', error);
    process.exit(1);
  }
}

main();