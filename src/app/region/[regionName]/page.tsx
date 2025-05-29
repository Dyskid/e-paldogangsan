import { notFound } from 'next/navigation';
import { getMalls, getRegions, getCategories, getMallsByRegion, getRegionById } from '@/lib/data';
import RegionPageClient from './RegionPageClient';

interface RegionPageProps {
  params: {
    regionName: string;
  };
}

export default function RegionPage({ params }: RegionPageProps) {
  const { regionName } = params;
  
  const regions = getRegions();
  const categories = getCategories();
  const region = getRegionById(regionName);
  
  if (!region) {
    notFound();
  }

  const allRegionMalls = getMallsByRegion(regionName);

  return (
    <RegionPageClient 
      region={region}
      malls={allRegionMalls}
      regions={regions}
      categories={categories}
    />
  );
}

// Generate static paths for all regions
export async function generateStaticParams() {
  const regions = getRegions();
  return regions.map((region) => ({
    regionName: region.id,
  }));
}