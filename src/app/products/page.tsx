'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import ProductSearchBar from '@/components/ProductSearchBar';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([
    { id: 'all', name: '전체' }
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const mallName = p.mall?.mallName || (p as any).mallName || '';
        return (
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          mallName.toLowerCase().includes(query)
        );
      });
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      const productsData = data.products || [];
      setProducts(productsData);
      
      // Extract unique categories from products
      const uniqueCategories = new Set<string>();
      productsData.forEach((product: Product) => {
        if (product.category) {
          uniqueCategories.add(product.category);
        }
      });
      
      // Convert to array and sort
      const categoryList = Array.from(uniqueCategories).sort().map(cat => ({
        id: cat,
        name: cat
      }));
      
      setCategories([
        { id: 'all', name: '전체' },
        ...categoryList
      ]);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (query: string, results: Product[], category?: string) => {
    setSearchQuery(query);
    if (category) {
      setSelectedCategory(category);
    }
    setFilteredProducts(results);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">전체 상품</h1>
          <div className="max-w-4xl mx-auto">
            <ProductSearchBar 
              products={products}
              onSearch={handleSearch}
              placeholder="상품명, 쇼핑몰, 설명으로 검색..."
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-gray-600">
          {filteredProducts.length}개의 상품을 찾았습니다
          {selectedCategory !== 'all' && ` (${categories.find(c => c.id === selectedCategory)?.name})`}
          {searchQuery && ` - "${searchQuery}" 검색 결과`}
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}