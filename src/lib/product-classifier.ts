import categoryMapping from '@/data/category-mapping.json';

export interface CategoryMatch {
  mainCategory: string;
  subcategory: string;
  confidence: number;
}

export function classifyProduct(productName: string, description: string = ''): CategoryMatch | null {
  const searchText = `${productName} ${description}`.toLowerCase();
  let bestMatch: CategoryMatch | null = null;
  let highestConfidence = 0;

  // Iterate through all categories
  Object.entries(categoryMapping).forEach(([categoryId, category]) => {
    Object.entries(category.subcategories).forEach(([subcategoryId, subcategory]) => {
      let matchCount = 0;
      let totalKeywords = subcategory.keywords.length;

      // Check how many keywords match
      subcategory.keywords.forEach(keyword => {
        if (searchText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });

      // Calculate confidence score
      if (matchCount > 0) {
        const confidence = matchCount / totalKeywords;
        
        // Special boost for exact matches in product name
        const exactMatchBoost = subcategory.keywords.some(keyword => 
          productName.toLowerCase().includes(keyword.toLowerCase())
        ) ? 0.3 : 0;

        const totalConfidence = Math.min(confidence + exactMatchBoost, 1);

        if (totalConfidence > highestConfidence) {
          highestConfidence = totalConfidence;
          bestMatch = {
            mainCategory: categoryId,
            subcategory: subcategoryId,
            confidence: totalConfidence
          };
        }
      }
    });
  });

  // Only return matches with confidence > 0.1
  return highestConfidence > 0.1 ? bestMatch : null;
}

export function getCategoryInfo(categoryId: string) {
  return categoryMapping[categoryId as keyof typeof categoryMapping] || null;
}

export function getSubcategoryInfo(categoryId: string, subcategoryId: string) {
  const category = getCategoryInfo(categoryId);
  if (!category) return null;
  
  return category.subcategories[subcategoryId as keyof typeof category.subcategories] || null;
}

export function getAllCategories() {
  return Object.entries(categoryMapping).map(([id, category]) => ({
    id,
    name: category.name,
    subcategoryCount: Object.keys(category.subcategories).length
  }));
}

export function searchProductsByCategory(products: any[], categoryId: string, subcategoryId?: string) {
  return products.filter(product => {
    const classification = classifyProduct(product.name, product.description);
    if (!classification) return false;
    
    if (subcategoryId) {
      return classification.mainCategory === categoryId && classification.subcategory === subcategoryId;
    }
    
    return classification.mainCategory === categoryId;
  });
}