import { NextResponse } from 'next/server';
import { Product } from '@/types';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');

async function getProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const mallId = searchParams.get('mallId');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');

    let products = await getProducts();

    // Filter by category
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    // Filter by mall
    if (mallId) {
      products = products.filter(p => {
        const productMallId = p.mall?.mallId || (p as any).mallId;
        return productMallId === mallId;
      });
    }

    // Search
    if (search) {
      const query = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Limit results
    if (limit) {
      products = products.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      products,
      total: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}