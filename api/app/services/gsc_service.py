import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False

SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
SITE_URL = 'sc-domain:aadikarta.org'

def get_gsc_service():
    if not GOOGLE_API_AVAILABLE:
        return None
        
    creds = None
    # Try from env var
    gsc_json_str = os.getenv('GSC_CREDENTIALS_JSON')
    if gsc_json_str:
        try:
            creds_info = json.loads(gsc_json_str)
            creds = service_account.Credentials.from_service_account_info(
                creds_info, scopes=SCOPES
            )
        except Exception as e:
            logger.error(f"Failed to parse GSC_CREDENTIALS_JSON: {e}")
            
    # Try from file
    if not creds and os.path.exists('service_account.json'):
        try:
            creds = service_account.Credentials.from_service_account_file(
                'service_account.json', scopes=SCOPES
            )
        except Exception as e:
            logger.error(f"Failed to load service_account.json: {e}")
            
    if not creds:
        return None
        
    try:
        return build('searchconsole', 'v1', credentials=creds)
    except Exception as e:
        logger.error(f"Failed to build searchconsole service: {e}")
        return None

def fetch_seo_analytics() -> Dict[str, Any]:
    """Fetches clicks, impressions, ctr, position over the last 30 days and top queries/pages"""
    service = get_gsc_service()
    if not service:
        return {
            "configured": False,
            "error": "Google Search Console credentials not found or invalid."
        }
        
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    end_date_str = end_date.strftime('%Y-%m-%d')
    start_date_str = start_date.strftime('%Y-%m-%d')
    
    try:
        # 1. Fetch daily metrics for the chart
        request = {
            'startDate': start_date_str,
            'endDate': end_date_str,
            'dimensions': ['date'],
            'rowLimit': 30
        }
        response_date = service.searchanalytics().query(siteUrl=SITE_URL, body=request).execute()
        daily_rows = response_date.get('rows', [])
        
        # 2. Fetch top queries
        request_queries = {
            'startDate': start_date_str,
            'endDate': end_date_str,
            'dimensions': ['query'],
            'rowLimit': 10
        }
        response_queries = service.searchanalytics().query(siteUrl=SITE_URL, body=request_queries).execute()
        top_queries = response_queries.get('rows', [])
        
        # 3. Fetch top pages
        request_pages = {
            'startDate': start_date_str,
            'endDate': end_date_str,
            'dimensions': ['page'],
            'rowLimit': 10
        }
        response_pages = service.searchanalytics().query(siteUrl=SITE_URL, body=request_pages).execute()
        top_pages = response_pages.get('rows', [])
        
        # Calculate totals
        total_clicks = sum(row.get('clicks', 0) for row in daily_rows)
        total_impressions = sum(row.get('impressions', 0) for row in daily_rows)
        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        avg_position = sum(row.get('position', 0) * row.get('impressions', 0) for row in daily_rows) / total_impressions if total_impressions > 0 else 0
        
        return {
            "configured": True,
            "summary": {
                "clicks": total_clicks,
                "impressions": total_impressions,
                "ctr": round(avg_ctr, 2),
                "position": round(avg_position, 1)
            },
            "daily": [{"date": r['keys'][0], "clicks": r['clicks'], "impressions": r['impressions']} for r in daily_rows],
            "top_queries": [{"query": r['keys'][0], "clicks": r['clicks'], "impressions": r['impressions']} for r in top_queries],
            "top_pages": [{"page": r['keys'][0].replace('https://aadikarta.org', '') or '/', "clicks": r['clicks'], "impressions": r['impressions']} for r in top_pages]
        }
    except Exception as e:
        logger.error(f"Error querying GSC API: {e}")
        return {
            "configured": False,
            "error": f"API Error: {str(e)}"
        }
