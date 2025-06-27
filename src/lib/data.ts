import { Mall, Region, Category } from '@/types';
import mallsData from '@/data/malls.json';
import regionsData from '@/data/regions.json';
import categoriesData from '@/data/categories.json';

export function getMalls(): Mall[] {
  // Filter out commented malls (those with _commented: true)
  return (mallsData as Mall[]).filter(mall => !(mall as any)._commented);
}

export function getRegions(): Region[] {
  return regionsData as Region[];
}

export function getCategories(): Category[] {
  return categoriesData as Category[];
}

export function getMallsByRegion(regionId: string): Mall[] {
  const malls = getMalls();
  const regions = getRegions();
  
  // Find the region by ID to get the Korean name
  const region = regions.find(r => r.id === regionId);
  if (!region) return [];
  
  // Filter malls by the Korean region name
  return malls.filter(mall => mall.region === region.name_ko);
}

export function getFeaturedMalls(): Mall[] {
  const malls = getMalls();
  return malls.filter(mall => mall.featured);
}

export function getNewMalls(): Mall[] {
  const malls = getMalls();
  return malls.filter(mall => mall.isNew).slice(0, 6);
}

export function getMallsByTags(tags: string[]): Mall[] {
  if (tags.length === 0) return getMalls();
  
  const malls = getMalls();
  return malls.filter(mall => 
    tags.some(tag => mall.tags.includes(tag))
  );
}

export function getRegionById(regionId: string): Region | undefined {
  const regions = getRegions();
  return regions.find(region => region.id === regionId);
}

export function getCategoryById(categoryId: string): Category | undefined {
  const categories = getCategories();
  return categories.find(category => category.id === categoryId);
}

export function getMallById(mallId: string): Mall | undefined {
  const malls = getMalls();
  return malls.find(mall => mall.id === mallId);
}

