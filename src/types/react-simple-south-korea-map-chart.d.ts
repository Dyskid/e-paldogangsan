declare module 'react-simple-south-korea-map-chart' {
  import { FC } from 'react';

  interface KoreaMapProps {
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
  }

  const KoreaMap: FC<KoreaMapProps>;
  export default KoreaMap;
}