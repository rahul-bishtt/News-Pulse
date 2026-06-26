import sys
import os

# Adjust paths to import from scraper directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import connect, insert_article
from cluster import run_incremental_clustering

def test():
    conn = connect()
    try:
        # 1. Define a test article about Venezuela Earthquakes to trigger match with existing cluster
        art = {
            "source": "Test Source",
            "title": "New tremors hit Venezuela as rescue teams dig through rubble",
            "summary": "Caracas rescue teams are working around the clock after new tremors hit Venezuela.",
            "url": "https://example.com/venezuela-tremors-test",
            "published_at": "2026-06-26T12:00:00Z",
            "body_text": "Caracas, Venezuela - Search and rescue personnel continue to sift through rubble in Caracas after new tremors shook the region, complicating the aftermath of the recent devastating earthquakes. Officials confirmed that additional aid has arrived to support families."
        }
        
        # Clean up any leftover test data
        with conn.cursor() as cur:
            cur.execute("DELETE FROM articles WHERE url = %s;", (art["url"],))
        conn.commit()
        
        # Insert the article (unclustered)
        insert_article(art, overwrite=True)
        print("Inserted unclustered test article.")
        
        # 2. Run incremental clustering
        results = run_incremental_clustering(conn)
        print(f"Incremental Clustering Results: {results}")
        
        # 3. Verify it assigned the article to the correct cluster
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.title, c.label, c.keywords 
                FROM articles a 
                JOIN clusters c ON a.cluster_id = c.id 
                WHERE a.url = %s;
            """, (art["url"],))
            row = cur.fetchone()
            if row:
                print(f"SUCCESS: Assigned test article to cluster: '{row[1]}'")
                print(f"Updated Cluster Keywords: {row[2]}")
            else:
                print("FAILURE: No cluster assigned to the test article.")
                
        # 4. Clean up the test database state
        with conn.cursor() as cur:
            cur.execute("DELETE FROM articles WHERE url = %s;", (art["url"],))
        conn.commit()
        print("Cleaned up test article from database.")
            
    finally:
        conn.close()

if __name__ == "__main__":
    test()
