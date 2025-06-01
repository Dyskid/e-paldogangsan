'use client';

import { useState, useEffect, useRef } from 'react';
import { Region, Mall } from '@/types';
import MallCard from './MallCard';

interface InteractiveMapProps {
  regions: Region[];
  malls: Mall[];
}

export default function InteractiveMap({ regions, malls }: InteractiveMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const mallListRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId);
    
    // Auto-scroll on mobile after region selection
    if (isMobile && mallListRef.current) {
      setTimeout(() => {
        mallListRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100); // Small delay to ensure content is rendered
    }
  };

  const getRegionData = (regionId: string) => {
    return regions.find(r => r.id === regionId);
  };

  const getMallsForRegion = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return [];
    return malls.filter(mall => mall.region === region.name_ko);
  };

  const selectedRegionData = selectedRegion ? getRegionData(selectedRegion) : null;
  const selectedMalls = selectedRegion ? getMallsForRegion(selectedRegion) : [];

  // Korea regions SVG paths - accurate geographic representation
  const regionPaths = {
    seoul: "M 312,195 L 318,190 L 325,193 L 328,200 L 325,207 L 318,210 L 312,207 L 310,200 Z",
    incheon: "M 295,198 L 305,195 L 308,205 L 300,210 L 290,205 L 292,198 Z",
    gyeonggi: "M 290,170 L 350,165 L 360,180 L 355,220 L 340,235 L 310,240 L 280,235 L 270,220 L 275,190 L 285,175 Z",
    gangwon: "M 360,120 L 420,115 L 450,125 L 460,160 L 455,200 L 440,240 L 420,260 L 390,250 L 370,230 L 365,190 L 360,160 L 358,130 Z",
    chungbuk: "M 310,245 L 350,240 L 380,250 L 385,280 L 375,310 L 350,320 L 320,315 L 305,290 L 308,260 Z",
    chungnam: "M 250,240 L 300,235 L 305,250 L 300,285 L 285,310 L 260,320 L 230,310 L 220,280 L 225,250 L 245,240 Z",
    daejeon: "M 275,275 L 285,270 L 290,280 L 285,290 L 275,290 L 270,280 Z",
    sejong: "M 290,260 L 300,255 L 305,265 L 300,270 L 290,270 L 285,265 Z",
    jeonbuk: "M 220,315 L 280,310 L 290,330 L 285,360 L 270,380 L 240,385 L 210,375 L 200,350 L 205,325 Z",
    jeonnam: "M 180,380 L 240,375 L 250,390 L 245,420 L 230,450 L 200,470 L 170,460 L 150,430 L 155,400 L 170,385 Z",
    gwangju: "M 215,385 L 225,380 L 230,390 L 225,400 L 215,400 L 210,390 Z",
    gyeongbuk: "M 380,255 L 420,260 L 450,270 L 460,300 L 455,340 L 440,370 L 410,380 L 380,375 L 360,350 L 365,310 L 375,280 Z",
    gyeongnam: "M 310,360 L 370,355 L 390,370 L 395,400 L 380,430 L 350,445 L 320,440 L 300,420 L 295,390 L 305,365 Z",
    daegu: "M 380,340 L 390,335 L 395,345 L 390,355 L 380,355 L 375,345 Z",
    busan: "M 395,410 L 405,405 L 410,415 L 405,425 L 395,425 L 390,415 Z",
    ulsan: "M 420,385 L 430,380 L 435,390 L 430,400 L 420,400 L 415,390 Z",
    jeju: "M 210,530 L 250,525 L 260,540 L 250,555 L 210,560 L 200,545 L 205,535 Z"
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        지역별 쇼핑몰 찾기
      </h2>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map Container - Left Side */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-lg p-4">
          <div className="relative">
            <svg
              viewBox="0 0 600 700"
              className="w-full h-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background - Korean Peninsula outline */}
              <path
                d="M 250,100 L 300,80 L 380,85 L 450,110 L 480,150 L 490,200 L 485,250 L 470,300 L 460,350 L 445,400 L 420,450 L 380,480 L 320,490 L 260,480 L 220,450 L 190,400 L 175,350 L 170,300 L 175,250 L 185,200 L 200,150 L 230,110 Z"
                fill="#f0f4f8"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Render all regions with proper z-index ordering */}
              {(() => {
                // Define rendering order - larger regions first, smaller regions last
                const renderOrder = [
                  'jeju', 'jeonnam', 'gyeongnam', 'gyeongbuk', 'jeonbuk', 
                  'chungnam', 'chungbuk', 'gangwon', 'gyeonggi',
                  'daejeon', 'sejong', 'gwangju', 'daegu', 'busan', 'ulsan',
                  'seoul', 'incheon' // Seoul and Incheon rendered last to be on top
                ];
                
                return renderOrder.map((regionId) => {
                  const path = regionPaths[regionId as keyof typeof regionPaths];
                  if (!path) return null;
                  
                  const region = getRegionData(regionId);
                  const isSelected = selectedRegion === regionId;
                  const isHovered = hoveredRegion === regionId;
                  const mallCount = getMallsForRegion(regionId).length;

                  return (
                    <g key={regionId}>
                      <path
                        d={path}
                        fill={isSelected ? '#1e40af' : isHovered ? '#3b82f6' : '#60a5fa'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredRegion(regionId)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => handleRegionClick(regionId)}
                        opacity={isSelected ? 1 : isHovered ? 0.9 : 0.8}
                        style={{ zIndex: regionId === 'seoul' || regionId === 'incheon' ? 10 : 1 }}
                      />
                      
                      {/* Region label */}
                      <text
                        x={getRegionLabelPosition(regionId).x}
                        y={getRegionLabelPosition(regionId).y}
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                        fill={isSelected || isHovered ? '#ffffff' : '#1f2937'}
                        fontSize="12"
                        fontWeight="600"
                      >
                        {region?.name_ko}
                      </text>
                      
                      {/* Mall count badge */}
                      <text
                        x={getRegionLabelPosition(regionId).x}
                        y={getRegionLabelPosition(regionId).y + 15}
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                        fill={isSelected || isHovered ? '#ffffff' : '#6b7280'}
                        fontSize="10"
                      >
                        {mallCount}개
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Hover tooltip */}
            {hoveredRegion && !selectedRegion && (
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                <h3 className="font-bold text-primary">
                  {getRegionData(hoveredRegion)?.name_ko}
                </h3>
                <p className="text-sm text-gray-600">
                  {getRegionData(hoveredRegion)?.description_ko}
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  {getRegionData(hoveredRegion)?.highlight_text}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              지역을 클릭하여 해당 지역의 쇼핑몰을 확인하세요
            </p>
          </div>
        </div>

        {/* Shopping Mall List - Right Side */}
        <div className="lg:w-1/2" ref={mallListRef}>
          {selectedRegion ? (
            <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-auto max-h-[600px]">
              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedRegionData?.name_ko} 쇼핑몰
                  </h3>
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600">
                  {selectedRegionData?.description_ko}
                </p>
                <p className="text-sm text-primary font-medium mt-1">
                  {selectedRegionData?.highlight_text}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  총 {selectedMalls.length}개의 쇼핑몰
                </div>
              </div>

              {selectedMalls.length > 0 ? (
                <div className="space-y-4">
                  {selectedMalls.map((mall) => (
                    <MallCard
                      key={mall.id}
                      mall={mall}
                      region={selectedRegionData || undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    등록된 쇼핑몰이 없습니다
                  </h3>
                  <p className="text-gray-500">
                    곧 새로운 쇼핑몰이 추가될 예정입니다
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  지역을 선택해주세요
                </h3>
                <p className="text-gray-500">
                  왼쪽 지도에서 원하는 지역을 클릭하면<br />
                  해당 지역의 쇼핑몰 목록을 확인할 수 있습니다
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get label positions for each region
function getRegionLabelPosition(regionId: string): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    seoul: { x: 318, y: 200 },
    incheon: { x: 298, y: 202 },
    gyeonggi: { x: 315, y: 205 },
    gangwon: { x: 410, y: 190 },
    chungbuk: { x: 345, y: 280 },
    chungnam: { x: 260, y: 275 },
    daejeon: { x: 280, y: 280 },
    sejong: { x: 295, y: 262 },
    jeonbuk: { x: 245, y: 345 },
    jeonnam: { x: 200, y: 425 },
    gwangju: { x: 220, y: 390 },
    gyeongbuk: { x: 410, y: 325 },
    gyeongnam: { x: 350, y: 400 },
    daegu: { x: 385, y: 345 },
    busan: { x: 400, y: 415 },
    ulsan: { x: 425, y: 390 },
    jeju: { x: 230, y: 542 }
  };
  
  return positions[regionId] || { x: 0, y: 0 };
}