import * as fs from 'fs';
import * as path from 'path';

class GmsocialScraperUrlFixer {
  private scriptFiles = [
    'scrape-gmsocial-categories.ts',
    'scrape-gmsocial-comprehensive.ts', 
    'scrape-gmsocial-direct.ts',
    'scrape-gmsocial-focused.ts',
    'scrape-gmsocial-optimized.ts',
    'scrape-gmsocial-quick.ts',
    'scrape-gmsocial-robust.ts'
  ];

  private oldBaseUrl = 'https://gmsocial.or.kr/mall/';
  private newBaseUrl = 'http://gmsocial.mangotree.co.kr/mall/';

  async run() {
    console.log('🔧 Fixing 광명가치몰 scraper URLs...');
    
    let totalFixed = 0;
    
    for (const scriptFile of this.scriptFiles) {
      const scriptPath = path.join(__dirname, scriptFile);
      
      if (fs.existsSync(scriptPath)) {
        const fixed = await this.fixScriptUrls(scriptPath);
        if (fixed) {
          totalFixed++;
          console.log(`  ✅ Fixed: ${scriptFile}`);
        } else {
          console.log(`  ⚠️  No changes needed: ${scriptFile}`);
        }
      } else {
        console.log(`  ❌ File not found: ${scriptFile}`);
      }
    }
    
    console.log(`\n✅ URL fixing completed! Fixed ${totalFixed} scraper files`);
  }

  private async fixScriptUrls(scriptPath: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Replace the base URL
      let updatedContent = content.replace(
        /private baseUrl = ['"`]https:\/\/gmsocial\.or\.kr\/mall\/['"`]/g,
        `private baseUrl = '${this.newBaseUrl}'`
      );
      
      // Replace any hardcoded URLs in the content
      updatedContent = updatedContent.replace(
        /https:\/\/gmsocial\.or\.kr\/mall\//g,
        this.newBaseUrl
      );
      
      // Replace any references to the old domain in URL construction
      updatedContent = updatedContent.replace(
        /https:\/\/gmsocial\.or\.kr/g,
        'http://gmsocial.mangotree.co.kr'
      );
      
      // Check if any changes were made
      if (content !== updatedContent) {
        fs.writeFileSync(scriptPath, updatedContent);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error fixing ${scriptPath}:`, error);
      return false;
    }
  }
}

// Run the fixer
async function main() {
  const fixer = new GmsocialScraperUrlFixer();
  await fixer.run();
}

if (require.main === module) {
  main().catch(console.error);
}