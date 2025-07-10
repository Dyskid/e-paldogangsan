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

  // Add click handler via DOM manipulation
  useEffect(() => {
    const handleClick = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as Element;
      
      console.log('Click event:', {
        tagName: target?.tagName,
        attributes: target ? Array.from(target.attributes).map(attr => `${attr.name}="${attr.value}"`) : [],
        className: target?.className,
        id: target?.id
      });
      
      if (target && target.tagName === 'path') {
        // Try different attributes that might contain the region name
        const locationName = target.getAttribute('name') || 
                           target.getAttribute('data-name') || 
                           target.getAttribute('id') ||
                           target.getAttribute('data-region');
                           
        console.log('Location name found:', locationName);
        
        if (locationName) {
          const regionId = reverseMapping[locationName];
          console.log('Region ID mapping:', locationName, '->', regionId);
          
          if (regionId && onClick) {
            console.log('Calling onClick with:', regionId);
            onClick(regionId);
          }
        }
      }
    };

    const handleMouseOut = () => {
      setHoveredRegion(null);
      if (onMouseLeave) {
        onMouseLeave();
      }
    };

    // Add event listeners after a short delay to ensure SVG is rendered
    const timeoutId = setTimeout(() => {
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.addEventListener('click', handleClick);
        svgElement.addEventListener('mouseleave', handleMouseOut);
        
        // Log the SVG structure for debugging
        const paths = svgElement.querySelectorAll('path');
        console.log('Found paths:', paths.length);
        paths.forEach((path, index) => {
          if (index < 3) { // Log first 3 paths only
            console.log(`Path ${index}:`, {
              className: path.className,
              id: path.id,
              attributes: Array.from(path.attributes).map(attr => `${attr.name}="${attr.value.substring(0, 50)}..."`),
            });
          }
        });
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.removeEventListener('click', handleClick);
        svgElement.removeEventListener('mouseleave', handleMouseOut);
      }
    };
  }, [onClick, onMouseLeave, reverseMapping]);

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
