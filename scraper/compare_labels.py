import json
import os
import sys
from collections import defaultdict
from psycopg2.extras import RealDictCursor
from db import connect, get_existing_clusters, get_all_articles

def fetch_clusters_state():
    conn = connect()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get all clusters
            cur.execute("SELECT id, label, keywords FROM clusters ORDER BY id;")
            clusters = cur.fetchall()
            
            # Get all articles assigned to clusters
            cur.execute("SELECT id, title, url, cluster_id FROM articles WHERE cluster_id IS NOT NULL;")
            articles = cur.fetchall()
            
            cluster_to_articles = defaultdict(list)
            for art in articles:
                cluster_to_articles[art['cluster_id']].append({
                    "id": art['id'],
                    "title": art['title'],
                    "url": art['url']
                })
                
            state = []
            for c in clusters:
                c_id = c['id']
                state.append({
                    "id": c_id,
                    "label": c['label'],
                    "keywords": c['keywords'],
                    "articles": cluster_to_articles[c_id]
                })
            return state
    finally:
        conn.close()

def save_state(filepath):
    state = fetch_clusters_state()
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2)
    print(f"Saved {len(state)} clusters to {filepath}")

def compare_states(before_path):
    if not os.path.exists(before_path):
        print(f"Error: Before state file {before_path} not found.")
        sys.exit(1)
        
    with open(before_path, 'r', encoding='utf-8') as f:
        before_state = json.load(f)
        
    after_state = fetch_clusters_state()
    
    print("\n==================================================")
    # Match before clusters to after clusters by URL overlap
    print(f"{'BEFORE LABEL':<30} | {'AFTER LABEL':<30} | {'MATCHED BY'}")
    print("-" * 80)
    
    matched_count = 0
    comparisons = []
    
    for b_c in before_state:
        b_urls = set(a['url'] for a in b_c['articles'])
        if not b_urls:
            continue
            
        # Find the after cluster with maximum URL overlap
        best_after = None
        max_overlap = 0
        
        for a_c in after_state:
            a_urls = set(a['url'] for a in a_c['articles'])
            overlap = len(b_urls & a_urls)
            if overlap > max_overlap:
                max_overlap = overlap
                best_after = a_c
                
        if best_after:
            comparisons.append((b_c['label'], best_after['label'], f"{max_overlap} overlapping articles"))
            matched_count += 1
            
    # Print the top 20 matches (at least 15 required)
    for b_lbl, a_lbl, match_desc in comparisons[:25]:
        print(f"{b_lbl[:30]:<30} | {a_lbl[:30]:<30} | {match_desc}")
        
    print(f"\nMatched and compared {matched_count} clusters out of {len(before_state)} original clusters.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["save", "compare"])
    parser.add_argument("--file", default="scraper/before_clusters.json")
    args = parser.parse_args()
    
    if args.action == "save":
        save_state(args.file)
    elif args.action == "compare":
        compare_states(args.file)
