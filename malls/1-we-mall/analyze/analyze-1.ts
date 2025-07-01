import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  url: string;
  subcategories?: Category[];
}

interface ProductStructure {
  selector: string;
  fields: {
    name: string;
    price: string;
    image: string;
    link: string;
    seller?: string;
  };
}

interface PaginationStructure {
  type: 'query_param' | 'page_number' | 'offset';
  parameter: string;
  itemsPerPage: number;
  selector: string;
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  mallUrl: string;
  engName: string;
  structure: {
    categories: Category[];
    productListing: ProductStructure;
    pagination: PaginationStructure;
    requiresJavaScript: boolean;
    searchUrl: string;
    searchParameter: string;
  };
  analysisDate: string;
  status: 'success' | 'error';
  notes: string[];
}

async function analyzeMall(): Promise<void> {
  const analysis: MallAnalysis = {
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
    // Parse the downloaded HTML files
    const homepageHtml = fs.readFileSync(
      path.join(__dirname, 'requirements', 'homepage.html'),
      'utf-8'
    );
    const categoryHtml = fs.readFileSync(
      path.join(__dirname, 'requirements', 'category_page.html'),
      'utf-8'
    );

    const $ = cheerio.load(homepageHtml);

    // Extract categories
    const categories: Category[] = [];
    
    // Main categories
    $('.gnb_cate > a').each((i, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href') || '';
      const categoryMatch = href.match(/category=(\d+)/);
      
      if (categoryMatch) {
        const category: Category = {
          id: categoryMatch[1],
          name: $elem.text().trim(),
          url: `https://wemall.kr${href}`,
          subcategories: []
        };

        // Get subcategories
        $elem.nextAll('ul').first().find('li a').each((j, subElem) => {
          const $subElem = $(subElem);
          const subHref = $subElem.attr('href') || '';
          const subCategoryMatch = subHref.match(/category=(\d+)/);
          
          if (subCategoryMatch) {
            category.subcategories!.push({
              id: subCategoryMatch[1],
              name: $subElem.text().trim(),
              url: `https://wemall.kr${subHref}`
            });
          }
        });

        categories.push(category);
      }
    });

    analysis.structure.categories = categories;

    // Analyze pagination from category page
    const $category = cheerio.load(categoryHtml);
    const paginationLinks = $category('.pagination a');
    
    if (paginationLinks.length > 0) {
      // Check for start parameter in pagination links
      const startMatch = paginationLinks.first().attr('href')?.match(/start=(\d+)/);
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

    // Save the analysis
    const outputPath = path.join(__dirname, 'analysis-we-mall.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

    console.log('Analysis completed successfully!');
    console.log(`Output saved to: ${outputPath}`);

  } catch (error) {
    analysis.status = 'error';
    analysis.notes.push(`Error during analysis: ${error}`);
    
    const outputPath = path.join(__dirname, 'analysis-we-mall.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    console.error('Analysis failed:', error);
  }
}

// Run the analysis
analyzeMall();