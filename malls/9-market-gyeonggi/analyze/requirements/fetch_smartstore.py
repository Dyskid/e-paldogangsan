import requests
import json
import time
from bs4 import BeautifulSoup

def fetch_smartstore_data():
    """Fetch Naver SmartStore data with proper headers"""
    
    # More sophisticated headers to avoid bot detection
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Referer': 'https://shopping.naver.com/'
    }
    
    session = requests.Session()
    
    # First, visit the main shopping page to get cookies
    try:
        print("Getting cookies from main shopping page...")
        shopping_response = session.get('https://shopping.naver.com/', headers=headers)
        time.sleep(2)  # Wait to avoid rate limiting
        
        # Now try to access the smartstore
        print("Accessing SmartStore page...")
        url = 'https://smartstore.naver.com/marketgyeonggi'
        response = session.get(url, headers=headers)
        
        if response.status_code == 200:
            print(f"Successfully fetched page (Status: {response.status_code})")
            
            # Save HTML
            with open('smartstore_full.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract store information
            print("\n=== Analyzing Store Information ===")
            
            # Look for store ID in various places
            store_id_candidates = []
            
            # Check meta tags
            meta_tags = soup.find_all('meta')
            for meta in meta_tags:
                if meta.get('property') in ['og:url', 'naver:smartstore:url']:
                    store_id_candidates.append(meta.get('content'))
            
            # Check script tags for JavaScript variables
            script_tags = soup.find_all('script')
            for script in script_tags:
                if script.string:
                    script_text = script.string
                    if 'channelNo' in script_text or 'storeId' in script_text or 'sellerId' in script_text:
                        # Save scripts with potential data
                        with open('smartstore_scripts.js', 'a', encoding='utf-8') as f:
                            f.write(f"\n\n// Script {script_tags.index(script)}\n")
                            f.write(script_text)
            
            # Check for API endpoints
            print("\n=== Looking for API Endpoints ===")
            api_patterns = [
                'api.', '/api/', 'ajax', 'fetch', 'XMLHttpRequest', 
                'smartstore.naver.com/i/', 'shopping.naver.com/v1/'
            ]
            
            api_endpoints = []
            for script in script_tags:
                if script.string:
                    for pattern in api_patterns:
                        if pattern in script.string:
                            lines = script.string.split('\n')
                            for line in lines:
                                if pattern in line:
                                    api_endpoints.append(line.strip())
            
            # Save findings
            findings = {
                'store_url': url,
                'status_code': response.status_code,
                'store_id_candidates': store_id_candidates,
                'api_endpoints_found': api_endpoints[:10],  # First 10 to avoid too much data
                'cookies': dict(session.cookies)
            }
            
            with open('smartstore_analysis.json', 'w', encoding='utf-8') as f:
                json.dump(findings, f, ensure_ascii=False, indent=2)
            
            print(f"\nAnalysis saved to smartstore_analysis.json")
            
        else:
            print(f"Failed to fetch page. Status code: {response.status_code}")
            with open('smartstore_error.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    fetch_smartstore_data()