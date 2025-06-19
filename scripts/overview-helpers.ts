import fs from 'fs';
import path from 'path';

interface ComponentInfo {
  name: string;
  path: string;
  description: string;
  props?: string[];
}

interface APIEndpointInfo {
  path: string;
  method: string;
  description: string;
  parameters?: string[];
  response?: string;
}

export class OverviewHelpers {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Scans the components directory and extracts component information
   */
  public scanComponents(): ComponentInfo[] {
    const componentsDir = path.join(this.projectRoot, 'src', 'components');
    const components: ComponentInfo[] = [];

    if (!fs.existsSync(componentsDir)) return components;

    const files = fs.readdirSync(componentsDir);
    
    files.forEach(file => {
      if (file.endsWith('.tsx')) {
        const filePath = path.join(componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract component name
        const name = file.replace('.tsx', '');
        
        // Extract description from comments
        const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
        const description = descMatch ? descMatch[1] : this.inferDescription(name);
        
        // Extract props (basic extraction)
        const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/);
        const props = propsMatch ? this.extractProps(propsMatch[1]) : undefined;
        
        components.push({
          name,
          path: file,
          description,
          props,
        });
      }
    });

    return components;
  }

  /**
   * Scans API routes and extracts endpoint information
   */
  public scanAPIEndpoints(): APIEndpointInfo[] {
    const apiDir = path.join(this.projectRoot, 'src', 'app', 'api');
    const endpoints: APIEndpointInfo[] = [];

    if (!fs.existsSync(apiDir)) return endpoints;

    const scanDir = (dir: string, basePath = '/api'): void => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const itemPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          const newBasePath = `${basePath}/${item.name}`;
          scanDir(itemPath, newBasePath);
        } else if (item.name === 'route.ts' || item.name === 'route.js') {
          const content = fs.readFileSync(itemPath, 'utf-8');
          const methods = this.extractAPIMethods(content);
          
          methods.forEach(method => {
            endpoints.push({
              path: basePath,
              method,
              description: this.inferAPIDescription(basePath),
              parameters: this.extractAPIParams(content, method),
              response: this.extractAPIResponse(content, method),
            });
          });
        }
      });
    };

    scanDir(apiDir);
    return endpoints;
  }

  /**
   * Generates a changelog from git history
   */
  public async generateChangelog(days: number = 7): Promise<string> {
    const { execSync } = require('child_process');
    
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];
      
      const log = execSync(
        `git log --since="${sinceStr}" --pretty=format:"- %s (%h)" --no-merges`,
        { cwd: this.projectRoot }
      ).toString();
      
      return log || 'No changes in the last ' + days + ' days';
    } catch (e) {
      return 'Unable to generate changelog';
    }
  }

  /**
   * Analyzes project dependencies
   */
  public analyzeDependencies(): { production: string[]; development: string[] } {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    return {
      production: Object.keys(packageJson.dependencies || {}),
      development: Object.keys(packageJson.devDependencies || {}),
    };
  }

  /**
   * Counts lines of code by file type
   */
  public countLinesOfCode(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    const countInDir = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const itemPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.includes('node_modules') && !item.name.startsWith('.')) {
          countInDir(itemPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          if (['.ts', '.tsx', '.js', '.jsx', '.css', '.json'].includes(ext)) {
            const content = fs.readFileSync(itemPath, 'utf-8');
            const lines = content.split('\n').length;
            counts[ext] = (counts[ext] || 0) + lines;
          }
        }
      });
    };
    
    countInDir(this.projectRoot);
    return counts;
  }

  // Helper methods
  private inferDescription(componentName: string): string {
    const descriptions: Record<string, string> = {
      'InteractiveMap': 'SVG-based interactive map of South Korea regions',
      'SearchBar': 'Real-time search with Fuse.js and autocomplete',
      'ProductCard': 'Product display with image, price, and category',
      'MallCard': 'Shopping mall information display card',
      'QuickFilters': 'Category-based filtering component',
      'FeaturedMalls': 'Carousel for featured shopping malls',
      'ProductSearchBar': 'Advanced product search with filters',
    };
    
    return descriptions[componentName] || `${componentName} component`;
  }

  private extractProps(propsContent: string): string[] {
    const props: string[] = [];
    const lines = propsContent.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/\s*(\w+)\s*[?:]?\s*:/);
      if (match) {
        props.push(match[1]);
      }
    });
    
    return props;
  }

  private extractAPIMethods(content: string): string[] {
    const methods: string[] = [];
    const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }
    
    return methods;
  }

  private inferAPIDescription(path: string): string {
    const descriptions: Record<string, string> = {
      '/api/products': 'Fetch product data with filtering',
      '/api/sync-products': 'Synchronize products from mall websites',
      '/api/track-click': 'Track mall click events for analytics',
    };
    
    return descriptions[path] || `API endpoint at ${path}`;
  }

  private extractAPIParams(content: string, method: string): string[] {
    // Basic parameter extraction - can be enhanced
    const params: string[] = [];
    
    if (method === 'GET') {
      const searchParamsMatch = content.match(/searchParams\.get\(['"](\w+)['"]\)/g);
      if (searchParamsMatch) {
        searchParamsMatch.forEach(match => {
          const param = match.match(/get\(['"](\w+)['"]\)/);
          if (param) params.push(param[1]);
        });
      }
    }
    
    return params;
  }

  private extractAPIResponse(content: string, method: string): string {
    // Basic response extraction - can be enhanced
    const jsonMatch = content.match(/Response\.json\(([^)]+)\)/);
    if (jsonMatch) {
      return 'JSON response';
    }
    
    return 'Response';
  }
}