'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SimpleSouthKoreaMapChart } from 'react-simple-south-korea-map-chart';
import 'react-simple-south-korea-map-chart/dist/map.css';

interface KoreaMapWrapperProps {
  onClick?: (regionCode: string) => void;
  onMouseEnter?: (regionCode: string) => void;
  onMouseLeave?: () => void;
  fillColor?: string | ((regionCode: string) => string);
  strokeColor?: string;
  strokeWidth?: number;
  hoverColor?: string;
  selectedColor?: string;
  selectedRegion?: string | null;
  width?: number;
  height?: number;
  getMallCount: (regionId: string) => number;
}

const KoreaMapWrapper: React.FC<KoreaMapWrapperProps> = ({
  onClick,
  onMouseEnter,
  onMouseLeave,
  fillColor,
  hoverColor,
  selectedColor,
  selectedRegion,
  getMallCount,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Convert region codes to the format expected by the package
  const regionMapping: { [key: string]: string } = {
    'seoul': '서울특별시',
    'busan': '부산광역시',
    'daegu': '대구광역시',
    'incheon': '인천광역시',
    'gwangju': '광주광역시',
    'daejeon': '대전광역시',
    'ulsan': '울산광역시',
    'sejong': '세종특별자치시',
    'gyeonggi': '경기도',
    'gangwon': '강원도',
    'chungbuk': '충청북도',
    'chungnam': '충청남도',
    'jeonbuk': '전라북도',
    'jeonnam': '전라남도',
    'gyeongbuk': '경상북도',
    'gyeongnam': '경상남도',
    'jeju': '제주특별자치도'
  };

  // SVG ID to our region ID mapping
  const svgIdMapping: { [key: string]: string } = {
    'seoul': 'seoul',
    'busan': 'busan',
    'daegu': 'daegu',
    'incheon': 'incheon',
    'gwangju': 'gwangju',
    'daejeon': 'daejeon',
    'ulsan': 'ulsan',
    'sejong': 'sejong',
    'gyeonggi-do': 'gyeonggi',
    'gyeonggi': 'gyeonggi',
    'gangwon': 'gangwon',
    'gangwon-do': 'gangwon',
    'north-chungcheong': 'chungbuk',
    'chungbuk': 'chungbuk',
    'south-chungcheong': 'chungnam',
    'chungnam': 'chungnam',
    'north-jeolla': 'jeonbuk',
    'jeonbuk': 'jeonbuk',
    'south-jeolla': 'jeonnam',
    'jeonnam': 'jeonnam',
    'north-gyeongsang': 'gyeongbuk',
    'gyeongbuk': 'gyeongbuk',
    'south-gyeongsang': 'gyeongnam',
    'gyeongnam': 'gyeongnam',
    'jeju': 'jeju',
    'jeju-do': 'jeju'
  };

  // Reverse mapping for converting back
  const reverseMapping = useMemo(() => {
    const mapping: { [key: string]: string } = {};
    Object.entries(regionMapping).forEach(([eng, kor]) => {
      mapping[kor] = eng;
    });
    return mapping;
  }, []);

  // Prepare data for the chart
  const data = Object.keys(regionMapping).map(regionId => ({
    locale: regionMapping[regionId],
    count: getMallCount(regionId)
  }));

  // Store original colors for restoration
  const [originalColors, setOriginalColors] = useState<{ [key: string]: string }>({});

  // Color function based on count
  const setColorByCount = (count: number) => {
    // Find which region has this count
    const region = data.find(d => d.count === count);
    if (region) {
      const regionId = reverseMapping[region.locale];
      if (regionId === selectedRegion) {
        return '#f59e0b'; // Selected color
      }
      if (regionId === hoveredRegion) {
        return '#fbbf24'; // Hover color
      }
      if (typeof fillColor === 'function') {
        return fillColor(regionId);
      }
    }
    return typeof fillColor === 'string' ? fillColor : '#dbeafe';
  };

  // Custom tooltip component
  const CustomTooltip = ({ tooltipStyle, children }: any) => {
    // We'll use this to trigger hover events
    React.useEffect(() => {
      if (children) {
        const locale = children.split(':')[0].trim();
        const regionId = reverseMapping[locale];
        if (regionId && regionId !== hoveredRegion) {
          setHoveredRegion(regionId);
          if (onMouseEnter) {
            onMouseEnter(regionId);
          }
        }
      }
    }, [children]);

    // Return null to hide the default tooltip
    return null;
  };

  // Add click and hover handlers via DOM manipulation
  useEffect(() => {
    const handleClick = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as Element;
      
      if (target && target.tagName === 'path') {
        // Get the SVG path ID
        const svgId = target.getAttribute('id');
        
        if (svgId) {
          // Use the SVG ID mapping to get our region ID
          const regionId = svgIdMapping[svgId];
          
          if (regionId && onClick) {
            onClick(regionId);
          }
        }
      }
    };

    const handleMouseOver = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      
      if (target && target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        
        if (svgId) {
          const regionId = svgIdMapping[svgId];
          
          if (regionId) {
            // Store original color if not already stored
            if (!originalColors[svgId]) {
              const currentFill = target.getAttribute('fill') || '';
              setOriginalColors(prev => ({ ...prev, [svgId]: currentFill }));
            }
            
            // Apply hover color directly to the path
            if (regionId !== selectedRegion) {
              const color = hoverColor || '#fbbf24';
              target.setAttribute('fill', color);
            }
            
            setHoveredRegion(regionId);
            if (onMouseEnter) {
              onMouseEnter(regionId);
            }
          }
        }
      }
    };

    const handleMouseOut = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      
      // Only clear hover if we're leaving a path element
      if (target && target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        
        if (svgId && originalColors[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          // Restore original color unless it's selected
          if (regionId !== selectedRegion) {
            target.setAttribute('fill', originalColors[svgId]);
          }
        }
        
        setHoveredRegion(null);
        if (onMouseLeave) {
          onMouseLeave();
        }
      }
    };

    // Add event listeners after a short delay to ensure SVG is rendered
    const timeoutId = setTimeout(() => {
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.addEventListener('click', handleClick);
        svgElement.addEventListener('mouseover', handleMouseOver);
        svgElement.addEventListener('mouseout', handleMouseOut);
        
        // Apply hover styles to paths
        const paths = svgElement.querySelectorAll('path');
        paths.forEach(path => {
          path.style.cursor = 'pointer';
          path.style.transition = 'all 0.2s ease';
        });
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.removeEventListener('click', handleClick);
        svgElement.removeEventListener('mouseover', handleMouseOver);
        svgElement.removeEventListener('mouseout', handleMouseOut);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClick, onMouseEnter, onMouseLeave, reverseMapping, svgIdMapping, selectedRegion, originalColors]);

  // Update selected region color
  useEffect(() => {
    const updateSelectedRegionColor = () => {
      const svgElement = document.querySelector('.svg-map');
      if (!svgElement) return;

      // Reset all paths to their original colors
      Object.entries(svgIdMapping).forEach(([svgId, regionId]) => {
        const path = svgElement.querySelector(`#${svgId}`) as HTMLElement;
        if (path && originalColors[svgId]) {
          if (regionId === selectedRegion) {
            const color = selectedColor || '#f59e0b';
            path.setAttribute('fill', color);
          } else {
            path.setAttribute('fill', originalColors[svgId]);
          }
        }
      });
    };

    const timeoutId = setTimeout(updateSelectedRegionColor, 150);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, originalColors, svgIdMapping]);

  return (
    <div className="korea-map-wrapper w-full">
      <style jsx global>{`
        .korea-map-wrapper .svg-map {
          width: 100%;
          height: auto;
        }
        .korea-map-wrapper .svg-map__location {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .korea-map-wrapper .svg-map__location:hover {
          opacity: 0.8;
        }
      `}</style>
      <SimpleSouthKoreaMapChart
        data={data}
        unit="개"
        setColorByCount={setColorByCount}
        customTooltip={<CustomTooltip />}
      />
    </div>
  );
};

export default KoreaMapWrapper;
