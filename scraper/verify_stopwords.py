import sys
from db import connect
from cluster import STOPWORDS

def verify():
    conn = connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT label FROM clusters;")
            rows = cur.fetchall()
            
            violations = []
            all_labels = []
            for r in rows:
                label = r[0] or ""
                all_labels.append(label)
                # Split label into words
                import re
                words = re.findall(r"[^\W_]+", label.lower())
                for w in words:
                    if w in STOPWORDS:
                        violations.append((label, w))
            
            print(f"Total clusters checked: {len(all_labels)}")
            if violations:
                print("Violations found:")
                for lbl, w in violations:
                    print(f"- Label: '{lbl}' contains stopword '{w}'")
                sys.exit(1)
            else:
                print("All checks passed! No labels contain generic stopwords.")
                print("\nSample Labels:")
                for lbl in sorted(all_labels)[:20]:
                    print(f"  - {lbl}")
    finally:
        conn.close()

if __name__ == "__main__":
    verify()
