import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import connect
from cluster import run_full_clustering

def verify():
    print("Connecting to the database...")
    conn = connect()
    try:
        print("Running full re-clustering...")
        metrics = run_full_clustering(conn)
        print("Clustering completed successfully!")
        print(f"Total articles clustered: {metrics['total_clustered']}")
        print(f"New clusters created: {metrics['new_created']}")
        
        # Query the database to analyze cluster sizes and labels
        cur = conn.cursor()
        cur.execute("SELECT id, label, keywords FROM clusters ORDER BY id;")
        clusters = cur.fetchall()
        
        cluster_sizes = []
        single_article_clusters = 0
        total_articles_assigned = 0
        
        print("\n--- Generated Clusters & Members ---")
        for c in clusters:
            cid = c[0]
            label = c[1]
            keywords = c[2]
            
            cur.execute("SELECT title, source FROM articles WHERE cluster_id = %s;", (cid,))
            arts = cur.fetchall()
            size = len(arts)
            cluster_sizes.append(size)
            total_articles_assigned += size
            
            if size == 1:
                single_article_clusters += 1
                
            print(f"\nCluster ID {cid} (Label: '{label}', Size: {size})")
            print(f"  Keywords: {keywords[:8]}")
            for a in arts:
                print(f"    - [{a[1]}] {a[0]}")
                
        print("\n--- Summary Stats ---")
        print(f"Total Clusters: {len(clusters)}")
        print(f"Total Articles: {total_articles_assigned}")
        if clusters:
            print(f"Average Cluster Size: {total_articles_assigned / len(clusters):.2f}")
            print(f"Single-article Clusters (orphans): {single_article_clusters} ({single_article_clusters / len(clusters) * 100:.1f}%)")
        else:
            print("No clusters created.")
            
    finally:
        conn.close()

if __name__ == "__main__":
    verify()
