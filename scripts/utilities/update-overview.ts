#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ProjectStats {
  totalFiles: number;
  totalDirectories: number;
  mallCount: number;
  productCount: number;
  regionCount: number;
  categoryCount: number;
  lastUpdated: string;
  gitBranch: string;
  lastCommit: string;
}

interface FileChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  timestamp: string;
}

class OverviewUpdater {
  private projectRoot: string;
  private overviewPath: string;
  private dataPath: string;
  private changelog: FileChange[] = [];

  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.overviewPath = path.join(this.projectRoot, 'PROJECT_OVERVIEW.md');
    this.dataPath = path.join(this.projectRoot, 'src', 'data');
  }

  private getProjectStats(): ProjectStats {
    // Get mall count
    const mallsData = JSON.parse(
      fs.readFileSync(path.join(this.dataPath, 'malls.json'), 'utf-8')
    );
    const mallCount = mallsData.length;

    // Get product count
    const productsData = JSON.parse(
      fs.readFileSync(path.join(this.dataPath, 'products.json'), 'utf-8')
    );
    const productCount = productsData.length;

    // Get region count
    const regionsData = JSON.parse(
      fs.readFileSync(path.join(this.dataPath, 'regions.json'), 'utf-8')
    );
    const regionCount = regionsData.length;

    // Get category count
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(this.dataPath, 'categories.json'), 'utf-8')
    );
    const categoryCount = categoriesData.length;

    // Get file/directory counts
    const countFilesAndDirs = (dir: string): { files: number; dirs: number } => {
      let files = 0;
      let dirs = 0;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') continue;
        
        if (item.isDirectory()) {
          dirs++;
          const subCount = countFilesAndDirs(path.join(dir, item.name));
          files += subCount.files;
          dirs += subCount.dirs;
        } else {
          files++;
        }
      }
      
      return { files, dirs };
    };

    const counts = countFilesAndDirs(this.projectRoot);

    // Get git info
    let gitBranch = 'unknown';
    let lastCommit = 'unknown';
    try {
      gitBranch = execSync('git branch --show-current', { cwd: this.projectRoot })
        .toString()
        .trim();
      lastCommit = execSync('git log -1 --format="%h %s"', { cwd: this.projectRoot })
        .toString()
        .trim();
    } catch (e) {
      // Git commands might fail if not in a git repo
    }

    return {
      totalFiles: counts.files,
      totalDirectories: counts.dirs,
      mallCount,
      productCount,
      regionCount,
      categoryCount,
      lastUpdated: new Date().toISOString().split('T')[0],
      gitBranch,
      lastCommit,
    };
  }

  private updateSection(content: string, sectionName: string, newContent: string): string {
    const sectionRegex = new RegExp(`(## [^\\n]*${sectionName}[^\\n]*\\n)([\\s\\S]*?)(?=\\n## |$)`, 'i');
    const match = content.match(sectionRegex);
    
    if (match) {
      return content.replace(sectionRegex, `$1${newContent}`);
    }
    
    return content;
  }

  private generateProjectStructure(): string {
    const generateTree = (dir: string, prefix = '', isRoot = true): string => {
      let tree = '';
      const items = fs.readdirSync(dir, { withFileTypes: true })
        .filter(item => !item.name.startsWith('.') && item.name !== 'node_modules')
        .sort((a, b) => {
          // Directories first, then files
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
      
      items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const itemPath = path.join(dir, item.name);
        const relativePath = path.relative(this.projectRoot, itemPath);
        
        if (isRoot) {
          tree += `${item.name}/\n`;
          if (item.isDirectory()) {
            tree += generateTree(itemPath, '  ', false);
          }
        } else {
          tree += `${prefix}├── ${item.name}${item.isDirectory() ? '/' : ''}\n`;
          if (item.isDirectory() && item.name !== 'backup' && item.name !== 'public') {
            tree += generateTree(itemPath, prefix + '│   ', false);
          }
        }
      });
      
      return tree;
    };

    return '```\n' + generateTree(this.projectRoot) + '```';
  }

  private updateDataArchitecture(stats: ProjectStats): string {
    return `### 1. Malls Data (\`malls.json\`)
\`\`\`typescript
{
  id: string;           // Unique identifier (e.g., "mall_1_온서울마켓")
  name: string;         // Korean name
  url: string;          // Mall website URL
  region: string;       // Korean region name (서울, 부산, etc.)
  tags: string[];       // Categories/features
  featured: boolean;    // Featured status
  isNew: boolean;       // New mall indicator
  clickCount: number;   // Popularity metric
  lastVerified: string; // Date last checked
  district?: string;    // Optional sub-region
}
\`\`\`

Total: **${stats.mallCount} shopping malls** across ${stats.regionCount} regions

### 2. Products Data (\`products.json\`)
\`\`\`typescript
{
  id: string;              // Unique identifier
  name: string;            // Product name
  description: string;     // Product description
  price: string;           // Current price (Korean format)
  originalPrice?: string;  // Original price if discounted
  imageUrl: string;        // Product image URL
  productUrl: string;      // Link to product page
  mallId: string;          // Associated mall ID
  mallName: string;        // Mall name for display
  category: string;        // Product category
  tags: string[];          // Search tags
  inStock: boolean;        // Availability status
  lastUpdated: string;     // Last update timestamp
  createdAt: string;       // Creation timestamp
}
\`\`\`

Total: **${stats.productCount} products** with real data for featured malls

### 3. Regions Data (\`regions.json\`)
\`\`\`typescript
{
  id: string;           // Region identifier (e.g., "seoul")
  name_ko: string;      // Korean name (서울)
  name_en: string;      // English name
  description_ko: string; // Korean description
  mall_count: number;   // Number of malls
  highlight_text: string; // Featured text
}
\`\`\`

${stats.regionCount} regions covering all of South Korea:
- Metropolitan cities: Seoul, Busan, Daegu, Incheon, Gwangju, Daejeon, Ulsan, Sejong
- Provinces: Gyeonggi, Gangwon, Chungbuk, Chungnam, Jeonbuk, Jeonnam, Gyeongbuk, Gyeongnam, Jeju

### 4. Categories Data (\`categories.json\`)
\`\`\`typescript
{
  id: string;        // Category identifier
  name: string;      // Korean name
  slug: string;      // URL-friendly name
  icon?: string;     // Optional icon
}
\`\`\`

${stats.categoryCount} main categories:
- agricultural (농산물)
- seafood (수산물)
- livestock (축산물)
- processed (가공식품)
- health (건강식품)
- traditional (전통식품)
- specialty (지역특산품)
- eco_friendly (친환경인증)
- crafts (공예품)
- other (기타)`;
  }

  public async updateOverview(): Promise<void> {
    console.log('📊 Gathering project statistics...');
    const stats = this.getProjectStats();
    
    console.log('📖 Reading current overview...');
    let content = fs.readFileSync(this.overviewPath, 'utf-8');
    
    // Update Project Structure section
    console.log('🏗️  Updating project structure...');
    const projectStructure = this.generateProjectStructure();
    content = this.updateSection(content, 'Project Structure', '\n' + projectStructure + '\n');
    
    // Update Data Architecture section
    console.log('🗄️  Updating data architecture...');
    const dataArchitecture = this.updateDataArchitecture(stats);
    content = this.updateSection(content, 'Data Architecture', '\n' + dataArchitecture + '\n');
    
    // Update footer with last updated date and stats
    const footerRegex = /---\n\nLast Updated: .+\nVersion: .+$/s;
    const newFooter = `---

Last Updated: ${stats.lastUpdated}
Version: 1.0.0
Git Branch: ${stats.gitBranch}
Last Commit: ${stats.lastCommit}

### Project Statistics
- Total Files: ${stats.totalFiles}
- Total Directories: ${stats.totalDirectories}
- Shopping Malls: ${stats.mallCount}
- Products: ${stats.productCount}
- Regions: ${stats.regionCount}
- Categories: ${stats.categoryCount}`;
    
    if (footerRegex.test(content)) {
      content = content.replace(footerRegex, newFooter);
    } else {
      // If footer doesn't exist, append it
      content = content.trimEnd() + '\n\n' + newFooter;
    }
    
    console.log('💾 Writing updated overview...');
    fs.writeFileSync(this.overviewPath, content);
    
    console.log('✅ Overview updated successfully!');
    console.log(`   - Malls: ${stats.mallCount}`);
    console.log(`   - Products: ${stats.productCount}`);
    console.log(`   - Regions: ${stats.regionCount}`);
    console.log(`   - Categories: ${stats.categoryCount}`);
  }

  public watchForChanges(): void {
    console.log('👀 Watching for file changes...');
    
    const watchDirs = [
      path.join(this.projectRoot, 'src'),
      path.join(this.projectRoot, 'public'),
      this.dataPath,
    ];
    
    watchDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.watch(dir, { recursive: true }, (eventType, filename) => {
          if (filename && !filename.includes('node_modules')) {
            const change: FileChange = {
              type: eventType === 'rename' ? 'added' : 'modified',
              path: filename,
              timestamp: new Date().toISOString(),
            };
            
            this.changelog.push(change);
            
            // Debounce updates
            clearTimeout((this as any).updateTimeout);
            (this as any).updateTimeout = setTimeout(() => {
              console.log(`\n🔄 Detected ${this.changelog.length} changes, updating overview...`);
              this.updateOverview();
              this.changelog = [];
            }, 2000);
          }
        });
      }
    });
    
    console.log('   Press Ctrl+C to stop watching');
  }
}

// CLI interface
const args = process.argv.slice(2);
const updater = new OverviewUpdater();

if (args.includes('--watch') || args.includes('-w')) {
  updater.updateOverview().then(() => {
    updater.watchForChanges();
  });
} else {
  updater.updateOverview();
}