'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  hoverColor = '#fbbf24',
  selectedColor = '#f59e0b',
  selectedRegion,
  getMallCount,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const pathColorsRef = useRef<{ [key: string]: string }>({});

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

  // Get original color for a region
  const getOriginalColor = (regionId: string) => {
    if (typeof fillColor === 'function') {
      return fillColor(regionId);
    }
    return fillColor || '#dbeafe';
  };

  // Color function based on count
  const setColorByCount = (count: number) => {
    const region = data.find(d => d.count === count);
    if (region) {
      const regionId = reverseMapping[region.locale];
      return getOriginalColor(regionId);
    }
    return '#dbeafe';
  };

  // Custom tooltip component (disabled to avoid conflicts)
  const CustomTooltip = () => null;

  // Initialize colors and set up event handlers
  useEffect(() => {
    const initializeAndSetupEvents = () => {
      const svgElement = document.querySelector('.svg-map');
      if (!svgElement) return;

      // Store initial colors
      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => {
        const id = path.getAttribute('id');
        if (id) {
          const regionId = svgIdMapping[id];
          if (regionId) {
            const originalColor = getOriginalColor(regionId);
            pathColorsRef.current[id] = originalColor;
            path.setAttribute('fill', originalColor);
            
            // Set cursor style
            path.style.cursor = 'pointer';
          }
        }
      });
    };

    const timeoutId = setTimeout(initializeAndSetupEvents, 200);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillColor]);

  // Handle all mouse and click events
  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          if (onClick) {
            onClick(regionId);
          }
        }
      }
    };

    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          // Update hover state
          setHoveredRegion(regionId);
          
          // Apply hover color if not selected
          if (regionId !== selectedRegion) {
            target.setAttribute('fill', hoverColor);
          }
          
          // Call callback
          if (onMouseEnter) {
            onMouseEnter(regionId);
          }
        }
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          // Clear hover state
          setHoveredRegion(null);
          
          // Restore color based on selection state
          if (regionId === selectedRegion) {
            target.setAttribute('fill', selectedColor);
          } else {
            const originalColor = pathColorsRef.current[svgId] || getOriginalColor(regionId);
            target.setAttribute('fill', originalColor);
          }
          
          // Call callback
          if (onMouseLeave) {
            onMouseLeave();
          }
        }
      }
    };

    // Attach event listeners
    const attachEvents = () => {
      const svgElement = document.querySelector('.svg-map');
      if (!svgElement) return;

      // Remove any existing listeners first
      svgElement.removeEventListener('click', handleClick);
      svgElement.removeEventListener('mouseenter', handleMouseEnter, true);
      svgElement.removeEventListener('mouseleave', handleMouseLeave, true);

      // Add new listeners with capture phase for better event handling
      svgElement.addEventListener('click', handleClick);
      svgElement.addEventListener('mouseenter', handleMouseEnter, true);
      svgElement.addEventListener('mouseleave', handleMouseLeave, true);
    };

    const timeoutId = setTimeout(attachEvents, 300);

    return () => {
      clearTimeout(timeoutId);
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.removeEventListener('click', handleClick);
        svgElement.removeEventListener('mouseenter', handleMouseEnter, true);
        svgElement.removeEventListener('mouseleave', handleMouseLeave, true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClick, onMouseEnter, onMouseLeave, selectedRegion, hoverColor, selectedColor]);

  // Update colors when selection changes
  useEffect(() => {
    const updateColors = () => {
      const svgElement = document.querySelector('.svg-map');
      if (!svgElement) return;

      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => {
        const svgId = path.getAttribute('id');
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          if (regionId === selectedRegion) {
            path.setAttribute('fill', selectedColor);
          } else if (regionId !== hoveredRegion) {
            const originalColor = pathColorsRef.current[svgId] || getOriginalColor(regionId);
            path.setAttribute('fill', originalColor);
          }
        }
      });
    };

    const timeoutId = setTimeout(updateColors, 100);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, selectedColor]);

  return (
    <div className="korea-map-wrapper w-full">
      <style jsx global>{`
        .korea-map-wrapper .svg-map {
          width: 100%;
          height: auto;
        }
        .korea-map-wrapper .svg-map path {
          transition: fill 0.2s ease;
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