export interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

export interface Region {
  id: string;
  name_ko: string;
  name_en: string;
  description_ko: string;
  mall_count: number;
  highlight_text: string;
}

export interface Category {
  id: string;
  name_ko: string;
  name_en: string;
  color_theme: string;
}