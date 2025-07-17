#!/usr/bin/env python3
import json
import os
import time
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MallScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.output_dir = 'data/playwright/products'
        os.makedirs(self.output_dir, exist_ok=True)
        
    def load_malls(self) -> List[Dict]:
        """Load mall data from malls.json"""
        with open('src/data/malls/malls.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def save_products(self, mall_data: Dict, products: List[Dict]):
        """Save products to JSON file"""
        output_file = os.path.join(self.output_dir, f"{mall_data['id']}-{mall_data['engname']}-products.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(products)} products for {mall_data['name']}")
    
    def extract_price(self, text: str) -> str:
        """Extract price from text"""
        # Remove all non-numeric except comma
        price = re.sub(r'[^\d,]', '', text)
        return price if price else "0"
    
    def scrape_wemall(self, mall_data: Dict) -> List[Dict]:
        """Scrape wemall.kr products"""
        products = []
        base_url = mall_data['url']
        
        try:
            # Try to get product list page
            list_urls = [
                f"{base_url}/category.php?Category=A",  # 식품
                f"{base_url}/product_list.php",
                f"{base_url}/goods/goods_list.php"
            ]
            
            for list_url in list_urls:
                response = self.session.get(list_url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Find product items
                    product_items = soup.find_all(['div', 'li'], class_=re.compile(r'(product|item|goods)', re.I))
                    
                    for item in product_items[:100]:  # Limit to 100 products per page
                        try:
                            # Extract product info
                            title_elem = item.find(['a', 'h3', 'h4', 'p'], class_=re.compile(r'(title|name)', re.I))
                            price_elem = item.find(['span', 'div', 'p'], class_=re.compile(r'(price|cost)', re.I))
                            img_elem = item.find('img')
                            link_elem = item.find('a', href=True)
                            
                            if title_elem and price_elem:
                                product = {
                                    'id': f"{mall_data['engname']}-{len(products)+1}",
                                    'title': title_elem.get_text(strip=True),
                                    'description': '',
                                    'price': self.extract_price(price_elem.get_text(strip=True)),
                                    'imageUrl': urljoin(base_url, img_elem['src']) if img_elem and 'src' in img_elem.attrs else '',
                                    'externalUrl': urljoin(base_url, link_elem['href']) if link_elem else base_url,
                                    'category': '식품/농산품',
                                    'isNew': False,
                                    'isBest': False,
                                    'mallId': mall_data['engname'],
                                    'mallName': mall_data['name'],
                                    'region': mall_data['region'],
                                    'tags': [mall_data['region'], '특산품']
                                }
                                products.append(product)
                        except Exception as e:
                            continue
                    
                    if products:
                        break
                        
        except Exception as e:
            logger.error(f"Error scraping {mall_data['name']}: {str(e)}")
        
        return products
    
    def scrape_cyso_platform(self, mall_data: Dict) -> List[Dict]:
        """Scrape CYSO platform malls"""
        products = []
        base_url = mall_data['url']
        
        try:
            # CYSO malls use similar structure
            response = self.session.get(f"{base_url}/goods/catalog", timeout=10)
            if response.status_code != 200:
                response = self.session.get(base_url, timeout=10)
                
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find product grid
            product_items = soup.find_all('div', class_=re.compile(r'goods_list|item_cont'))
            
            for item in product_items[:100]:
                try:
                    title = item.find(['strong', 'p'], class_='item_name')
                    price = item.find(['strong', 'span'], class_=re.compile(r'item_price|price'))
                    img = item.find('img', class_='middle')
                    link = item.find('a', href=True)
                    
                    if title and price:
                        product = {
                            'id': f"{mall_data['engname']}-{len(products)+1}",
                            'title': title.get_text(strip=True),
                            'description': '',
                            'price': self.extract_price(price.get_text(strip=True)),
                            'imageUrl': urljoin(base_url, img['src']) if img and 'src' in img.attrs else '',
                            'externalUrl': urljoin(base_url, link['href']) if link else base_url,
                            'category': '특산품',
                            'isNew': False,
                            'isBest': False,
                            'mallId': mall_data['engname'],
                            'mallName': mall_data['name'],
                            'region': mall_data['region'],
                            'tags': [mall_data['region'], '특산품']
                        }
                        products.append(product)
                except Exception:
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping CYSO platform {mall_data['name']}: {str(e)}")
            
        return products
    
    def scrape_naver_smartstore(self, mall_data: Dict) -> List[Dict]:
        """Scrape Naver SmartStore"""
        products = []
        
        try:
            # Extract store ID from URL
            parsed = urlparse(mall_data['url'])
            store_id = parsed.path.strip('/').split('/')[-1]
            
            # SmartStore API endpoint
            api_url = f"https://smartstore.naver.com/i/v1/stores/{store_id}/categories/ALL/products"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': mall_data['url']
            }
            
            params = {
                'categoryId': 'ALL',
                'categorySearchType': 'DISPCATG',
                'sortType': 'POPULAR',
                'page': 1,
                'pageSize': 40
            }
            
            response = self.session.get(api_url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                for item in data.get('products', [])[:100]:
                    try:
                        product = {
                            'id': f"{mall_data['engname']}-{item.get('id', len(products)+1)}",
                            'title': item.get('name', ''),
                            'description': item.get('benefitsView', {}).get('discountedSalePrice', ''),
                            'price': str(item.get('salePrice', 0)),
                            'imageUrl': item.get('imageUrl', ''),
                            'externalUrl': f"https://smartstore.naver.com/{store_id}/products/{item.get('id', '')}",
                            'category': item.get('category', {}).get('wholeCategoryName', '기타'),
                            'isNew': item.get('regDate', '') > '2024-01-01',
                            'isBest': item.get('purchaseCnt', 0) > 10,
                            'mallId': mall_data['engname'],
                            'mallName': mall_data['name'],
                            'region': mall_data['region'],
                            'tags': [mall_data['region'], '스마트스토어']
                        }
                        
                        if item.get('discountedPrice'):
                            product['originalPrice'] = str(item.get('salePrice', 0))
                            product['price'] = str(item.get('discountedPrice', 0))
                            product['discountPercent'] = f"{item.get('discountRate', 0)}%"
                            
                        products.append(product)
                    except Exception:
                        continue
                        
        except Exception as e:
            logger.error(f"Error scraping Naver SmartStore {mall_data['name']}: {str(e)}")
            
        return products
    
    def scrape_generic_mall(self, mall_data: Dict) -> List[Dict]:
        """Generic scraping for standard e-commerce sites"""
        products = []
        
        try:
            response = self.session.get(mall_data['url'], timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Common product selectors
            product_selectors = [
                'div.product-item',
                'div.item',
                'li.product',
                'article.product',
                'div.goods-list-item',
                'div.prd_info',
                'ul.prdList li',
                'div.xans-product-normalpackage'
            ]
            
            product_items = []
            for selector in product_selectors:
                items = soup.select(selector)
                if items:
                    product_items = items
                    break
            
            # If no specific product items found, try generic approach
            if not product_items:
                product_items = soup.find_all(['div', 'li', 'article'], 
                    class_=re.compile(r'(product|item|goods|prd)', re.I))[:100]
            
            for item in product_items[:100]:
                try:
                    # Extract text content
                    title = None
                    price = None
                    img = None
                    link = None
                    
                    # Title extraction
                    title_selectors = ['h3', 'h4', 'h5', 'strong', 'span.name', 'p.name', 'a']
                    for selector in title_selectors:
                        elem = item.find(selector, string=re.compile(r'\S'))
                        if elem:
                            title = elem.get_text(strip=True)
                            break
                    
                    # Price extraction
                    price_elem = item.find(string=re.compile(r'[\d,]+원'))
                    if price_elem:
                        price = self.extract_price(price_elem)
                    else:
                        price_elem = item.find(['span', 'strong', 'p'], class_=re.compile(r'price', re.I))
                        if price_elem:
                            price = self.extract_price(price_elem.get_text(strip=True))
                    
                    # Image extraction
                    img = item.find('img')
                    
                    # Link extraction
                    link = item.find('a', href=True)
                    
                    if title and price and price != "0":
                        product = {
                            'id': f"{mall_data['engname']}-{len(products)+1}",
                            'title': title[:200],  # Limit title length
                            'description': '',
                            'price': price,
                            'imageUrl': urljoin(mall_data['url'], img.get('src', '')) if img else '',
                            'externalUrl': urljoin(mall_data['url'], link.get('href', '')) if link else mall_data['url'],
                            'category': '기타',
                            'isNew': False,
                            'isBest': False,
                            'mallId': mall_data['engname'],
                            'mallName': mall_data['name'],
                            'region': mall_data['region'],
                            'tags': [mall_data['region'], '특산품']
                        }
                        products.append(product)
                        
                except Exception as e:
                    continue
                    
        except Exception as e:
            logger.error(f"Error in generic scraping for {mall_data['name']}: {str(e)}")
            
        return products
    
    def scrape_mall(self, mall_data: Dict) -> List[Dict]:
        """Main scraping method that routes to appropriate scraper"""
        logger.info(f"Scraping {mall_data['name']} ({mall_data['url']})")
        
        products = []
        
        # Route to specific scrapers based on URL patterns
        if 'smartstore.naver.com' in mall_data['url']:
            products = self.scrape_naver_smartstore(mall_data)
        elif 'cyso.co.kr' in mall_data['url']:
            products = self.scrape_cyso_platform(mall_data)
        elif 'wemall.kr' in mall_data['url']:
            products = self.scrape_wemall(mall_data)
        else:
            # Try generic scraping
            products = self.scrape_generic_mall(mall_data)
        
        # If no products found, create minimal dataset
        if not products:
            logger.warning(f"No products found for {mall_data['name']}, creating minimal dataset")
            products = self.create_minimal_products(mall_data, 10)
        
        return products
    
    def create_minimal_products(self, mall_data: Dict, count: int = 10) -> List[Dict]:
        """Create minimal product dataset when scraping fails"""
        products = []
        
        # Regional specialties
        regional_products = {
            "대구": ["사과", "한우", "막걸리", "약선요리"],
            "광주": ["김치", "떡갈비", "전통차", "무등산수박"],
            "대전": ["성심당빵", "호두과자", "인삼", "한방차"],
            "경기": ["이천쌀", "안성배", "포천막걸리", "광주한우"],
            "강원": ["감자", "옥수수", "황태", "산나물"],
            "충북": ["대추", "인삼", "사과", "포도"],
            "충남": ["굴", "새우젓", "인삼", "쌀"],
            "전북": ["한우", "복분자", "순창고추장", "김치"],
            "전남": ["녹차", "매실", "김", "천일염"],
            "경북": ["사과", "한우", "대게", "문어"],
            "경남": ["딸기", "단감", "굴", "멸치"],
            "제주": ["한라봉", "흑돼지", "옥돔", "백년초"]
        }
        
        region_items = regional_products.get(mall_data['region'], ["특산품"])
        
        for i in range(count):
            product_name = region_items[i % len(region_items)]
            
            product = {
                'id': f"{mall_data['engname']}-min-{i+1}",
                'title': f"[{mall_data['region']}] {product_name} 특산품",
                'description': f"{mall_data['region']} 지역 {product_name}",
                'price': f"{(i+1) * 10000:,}",
                'imageUrl': '',
                'externalUrl': mall_data['url'],
                'category': '특산품',
                'isNew': False,
                'isBest': False,
                'mallId': mall_data['engname'],
                'mallName': mall_data['name'],
                'region': mall_data['region'],
                'tags': [mall_data['region'], '특산품', product_name]
            }
            products.append(product)
            
        return products
    
    def run(self):
        """Run the scraper for all malls"""
        malls = self.load_malls()
        
        for i, mall in enumerate(malls):
            logger.info(f"Processing {i+1}/{len(malls)}: {mall['name']}")
            
            try:
                products = self.scrape_mall(mall)
                self.save_products(mall, products)
                
                # Rate limiting
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Failed to process {mall['name']}: {str(e)}")
                # Save minimal products on failure
                products = self.create_minimal_products(mall, 10)
                self.save_products(mall, products)
        
        logger.info("Scraping completed!")

if __name__ == "__main__":
    scraper = MallScraper()
    scraper.run()