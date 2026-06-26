import argparse
import time
from db import connect
from cluster import run_incremental_clustering, run_full_clustering

def run_clustering_cli(mode: str):
    start_time = time.time()
    print(f"==================================================")
    print(f"Starting Topic Clustering CLI Runner")
    print(f"Mode: {mode.upper()}")
    print(f"==================================================")

    # 1. Establish database connection
    conn = connect()

    try:
        # 2. Run clustering process
        if mode == "full":
            results = run_full_clustering(conn)
        else:
            results = run_incremental_clustering(conn)

        # 3. Log detailed clustering decisions
        print("\n--- Clustering Decisions ---")
        for dec in results["decisions"]:
            overlap_str = f"Overlap: {dec['overlap']}" if dec['overlap'] >= 0 else "N/A"
            print(f"- Article:  '{dec['title'][:70]}...'")
            print(f"  Decision: {dec['decision']} -> '{dec['cluster_label']}' ({overlap_str})")
            print("-" * 40)

        # 4. Fetch database statistics for summary reporting
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.label, COUNT(a.id) as article_count
                FROM clusters c
                JOIN articles a ON a.cluster_id = c.id
                GROUP BY c.id, c.label
                ORDER BY article_count DESC;
            """)
            cluster_stats = cur.fetchall()

        total_articles = sum(c[1] for c in cluster_stats)
        num_clusters = len(cluster_stats)
        
        avg_size = total_articles / num_clusters if num_clusters > 0 else 0
        largest_size = cluster_stats[0][1] if num_clusters > 0 else 0
        largest_label = cluster_stats[0][0] if num_clusters > 0 else "None"
        smallest_size = cluster_stats[-1][1] if num_clusters > 0 else 0
        smallest_label = cluster_stats[-1][0] if num_clusters > 0 else "None"
        
        sample_labels = [c[0] for c in cluster_stats[:5]]

        # 5. Output summary statistics
        duration = time.time() - start_time
        print(f"\n==================================================")
        print(f"Topic Clustering Engine Run Summary")
        print(f"==================================================")
        print(f"Running Mode:           {mode.upper()}")
        print(f"Total Articles Grouped: {results['total_clustered']}")
        print(f"Existing Clusters Reused: {results['existing_reused']}")
        print(f"New Clusters Created:   {results['new_created']}")
        print(f"Total Clusters in DB:   {num_clusters}")
        print(f"Average Cluster Size:   {avg_size:.2f} articles")
        print(f"Largest Cluster:        {largest_size} articles ('{largest_label}')")
        print(f"Smallest Cluster:       {smallest_size} articles ('{smallest_label}')")
        print(f"Sample Cluster Labels:  {', '.join(sample_labels)}")
        print(f"Total Execution Time:   {duration:.2f} seconds")
        print(f"==================================================")

    except Exception as e:
        print(f"Error: Clustering run failed: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="News Pulse Topic Clustering Runner")
    parser.add_argument(
        "--mode",
        choices=["full", "incremental"],
        default="incremental",
        help="Clustering run mode: full or incremental (default: incremental)"
    )
    args = parser.parse_args()
    run_clustering_cli(args.mode)
