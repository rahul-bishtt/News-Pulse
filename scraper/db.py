import psycopg2
from psycopg2.extras import RealDictCursor
import contextlib
import time
from typing import List, Dict, Any, Set, Generator
from config import DATABASE_URL

def connect(max_retries: int = 3, initial_delay: float = 1.0) -> psycopg2.extensions.connection:
    """
    Establishes and returns a connection to the PostgreSQL database.
    Implements retries with exponential backoff on failure.

    Args:
        max_retries (int): Maximum connection attempts. Defaults to 3.
        initial_delay (float): Delay in seconds before first retry. Defaults to 1.0.

    Returns:
        psycopg2.extensions.connection: The database connection object.

    Errors:
        psycopg2.OperationalError: If connection to database fails after all retries.
    """
    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            return psycopg2.connect(DATABASE_URL)
        except psycopg2.OperationalError as e:
            if attempt == max_retries:
                print(f"Error: Final database connection attempt failed: {e}")
                raise e
            print(f"Warning: Database connection attempt {attempt} failed: {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

@contextlib.contextmanager
def transaction(conn: psycopg2.extensions.connection) -> Generator[psycopg2.extensions.cursor, None, None]:
    """
    A context manager to execute database queries within a transaction block.
    Automatically handles COMMIT on success and ROLLBACK on exception.

    Args:
        conn (psycopg2.extensions.connection): Connection object.

    Yields:
        psycopg2.extensions.cursor: Database cursor with RealDictCursor factory.

    Errors:
        psycopg2.Error: If transaction initialization or commit/rollback fails.
    """
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Scraper Transaction failed, rolling back: {e}")
        raise e
    finally:
        cursor.close()

def article_exists(url: str, cursor: psycopg2.extensions.cursor = None) -> bool:
    """
    Checks if an article with the specified URL already exists in the database.

    Args:
        url (str): The unique URL to check.
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Returns:
        bool: True if the article exists, False otherwise.

    Errors:
        psycopg2.Error: On query execution errors.
    """
    sql = "SELECT 1 FROM articles WHERE url = %s;"
    
    if cursor:
        cursor.execute(sql, (url,))
        return cursor.fetchone() is not None

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (url,))
                    return cur.fetchone() is not None
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: article_exists query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def insert_article(article: Dict[str, Any], cursor: psycopg2.extensions.cursor = None, overwrite: bool = False) -> int:
    """
    Inserts a single news article record into the database.
    If overwrite is True, updates the existing row on conflict.
    If overwrite is False, does nothing on conflict.

    Args:
        article (dict): Containing keys 'source', 'title', 'summary', 'body_text', 'url', 'published_at', 'cluster_id'.
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.
        overwrite (bool): If True, reprocesses fields on UNIQUE URL conflict.

    Returns:
        int: The primary key ID of the inserted or updated article. Returns None if skipped.

    Errors:
        psycopg2.IntegrityError: If reference constraints fail.
        psycopg2.Error: On query execution errors.
    """
    if overwrite:
        sql = """
            INSERT INTO articles (source, title, summary, body_text, url, published_at, cluster_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (url) DO UPDATE SET
                source = EXCLUDED.source,
                title = EXCLUDED.title,
                summary = EXCLUDED.summary,
                body_text = EXCLUDED.body_text,
                published_at = EXCLUDED.published_at,
                fetched_at = now()
            RETURNING id;
        """
    else:
        sql = """
            INSERT INTO articles (source, title, summary, body_text, url, published_at, cluster_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (url) DO NOTHING
            RETURNING id;
        """

    params = (
        article.get("source"),
        article.get("title"),
        article.get("summary"),
        article.get("body_text"),
        article.get("url"),
        article.get("published_at"),
        article.get("cluster_id")
    )

    if cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
        return row["id"] if row else None

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with transaction(conn) as cur:
                    cur.execute(sql, params)
                    row = cur.fetchone()
                    return row["id"] if row else None
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: insert_article query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def insert_cluster(label: str, keywords: List[str] = None, cursor: psycopg2.extensions.cursor = None) -> int:
    """
    Inserts a new cluster record with representative keywords and returns its generated ID.

    Args:
        label (str): The cluster label name.
        keywords (List[str], optional): Representative keywords. Defaults to None.
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Returns:
        int: The primary key ID of the inserted cluster.

    Errors:
        psycopg2.Error: On insertion or connection failure.
    """
    if keywords is None:
        keywords = []
    sql = "INSERT INTO clusters (label, keywords) VALUES (%s, %s) RETURNING id;"
    params = (label, keywords)
    
    if cursor:
        cursor.execute(sql, params)
        return cursor.fetchone()["id"]

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with transaction(conn) as cur:
                    cur.execute(sql, params)
                    return cur.fetchone()["id"]
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: insert_cluster query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def update_cluster(cluster_id: int, label: str, keywords: List[str], cursor: psycopg2.extensions.cursor = None) -> None:
    """
    Updates an existing cluster's label and representative keywords.

    Args:
        cluster_id (int): Target cluster ID.
        label (str): New human-readable label.
        keywords (List[str]): Updated list of representative keywords.
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Errors:
        psycopg2.Error: On update or connection failure.
    """
    sql = "UPDATE clusters SET label = %s, keywords = %s, updated_at = now() WHERE id = %s;"
    params = (label, keywords, cluster_id)
    
    if cursor:
        cursor.execute(sql, params)
        return

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with transaction(conn) as cur:
                    cur.execute(sql, params)
                    return
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: update_cluster query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def assign_cluster(article_url: str, cluster_id: int, cursor: psycopg2.extensions.cursor = None) -> bool:
    """
    Assigns an article (identified by URL) to a cluster ID.

    Args:
        article_url (str): The unique URL of the article.
        cluster_id (int): The target cluster ID.
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Returns:
        bool: True if an article was updated, False if no article matched the URL.

    Errors:
        psycopg2.Error: On database execution or constraint failures.
    """
    sql = "UPDATE articles SET cluster_id = %s WHERE url = %s RETURNING id;"
    
    if cursor:
        cursor.execute(sql, (cluster_id, article_url))
        row = cursor.fetchone()
        return row is not None

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with transaction(conn) as cur:
                    cur.execute(sql, (cluster_id, article_url))
                    row = cur.fetchone()
                    return row is not None
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: assign_cluster query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def get_existing_clusters(cursor: psycopg2.extensions.cursor = None) -> List[Dict[str, Any]]:
    """
    Retrieves all cluster records currently stored in the database, including keywords.

    Args:
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Returns:
        List[Dict[str, Any]]: List of dictionary items representing clusters (id, label, and keywords).

    Errors:
        psycopg2.Error: On database select query failure.
    """
    sql = "SELECT id, label, keywords FROM clusters ORDER BY id;"
    
    if cursor:
        cursor.execute(sql)
        return list(cursor.fetchall())

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(sql)
                    return list(cur.fetchall())
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: get_existing_clusters query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def get_all_articles(cursor: psycopg2.extensions.cursor = None) -> List[Dict[str, Any]]:
    """
    Retrieves all article records currently in the database.

    Args:
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Returns:
        List[Dict[str, Any]]: List of article dictionaries.
    """
    sql = "SELECT id, source, title, summary, body_text, url, published_at, cluster_id FROM articles ORDER BY id;"
    
    if cursor:
        cursor.execute(sql)
        return list(cursor.fetchall())

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(sql)
                    return list(cur.fetchall())
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: get_all_articles query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def get_unclustered_articles(cursor: psycopg2.extensions.cursor = None) -> List[Dict[str, Any]]:
    """
    Retrieves all article records currently lacking a cluster ID.

    Args:
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.

    Returns:
        List[Dict[str, Any]]: List of unclustered article dictionaries.
    """
    sql = "SELECT id, source, title, summary, body_text, url, published_at, cluster_id FROM articles WHERE cluster_id IS NULL ORDER BY id;"
    
    if cursor:
        cursor.execute(sql)
        return list(cursor.fetchall())

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(sql)
                    return list(cur.fetchall())
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: get_unclustered_articles query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def clear_all_article_assignments(cursor: psycopg2.extensions.cursor = None) -> None:
    """
    Removes all cluster assignments, setting cluster_id to NULL on all articles.

    Args:
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.
    """
    sql = "UPDATE articles SET cluster_id = NULL;"
    
    if cursor:
        cursor.execute(sql)
        return

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with transaction(conn) as cur:
                    cur.execute(sql)
                    return
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: clear_all_article_assignments query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0

def delete_all_clusters(cursor: psycopg2.extensions.cursor = None) -> None:
    """
    Deletes all clusters from the database.

    Args:
        cursor (psycopg2.extensions.cursor, optional): Active transaction cursor.
    """
    sql = "DELETE FROM clusters;"
    
    if cursor:
        cursor.execute(sql)
        return

    max_retries = 3
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with transaction(conn) as cur:
                    cur.execute(sql)
                    return
        except psycopg2.Error as e:
            if attempt == max_retries:
                raise e
            print(f"Warning: delete_all_clusters query failed (attempt {attempt}): {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0


# --- Backward Compatible API for main.py ---

def get_db_connection() -> psycopg2.extensions.connection:
    """
    Alias of connect() for compatibility.
    """
    return connect()

def fetch_existing_urls() -> Set[str]:
    """
    Retrieves all unique article URLs currently stored in the database.
    """
    urls = set()
    sql = "SELECT url FROM articles;"
    max_retries = 3
    delay = 1.0
    
    for attempt in range(1, max_retries + 1):
        try:
            with connect() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    rows = cur.fetchall()
                    for row in rows:
                        urls.add(row[0])
            return urls
        except Exception as e:
            if attempt == max_retries:
                print(f"Warning: Final attempt failed to fetch existing URLs from database: {e}")
                return urls
            print(f"Warning: Attempt {attempt} failed to fetch existing URLs: {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2.0
    return urls

def save_articles(articles: List[Dict[str, Any]]) -> None:
    """
    Saves a batch of articles (for backward compatibility).
    """
    for art in articles:
        try:
            insert_article(art, overwrite=False)
        except Exception as e:
            print(f"Warning: Failed to save article {art.get('url')}: {e}")

def save_clusters(clusters: List[Dict[str, Any]]) -> None:
    """
    Saves a batch of clusters (for backward compatibility).
    """
    for c in clusters:
        try:
            insert_cluster(c["label"])
        except Exception as e:
            print(f"Warning: Failed to save cluster {c['label']}: {e}")
