import re
from collections import Counter, defaultdict
from typing import List, Dict, Any, Set
from config import CLUSTER_THRESHOLD
from db import (
    transaction,
    get_existing_clusters,
    get_all_articles,
    get_unclustered_articles,
    clear_all_article_assignments,
    delete_all_clusters,
    insert_cluster,
    update_cluster,
    assign_cluster
)

# Comprehensive list of standard English stopwords + media boilerplate + common generic words + contraction roots
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot",
    "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few",
    "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll",
    "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most",
    "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
    "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
    "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
    "your", "yours", "yourself", "yourselves", "will", "shall", "says", "said", "new", "one", "two", "also",
    "first", "last", "like", "us", "uk", "u", "s", "pm", "today", "yesterday", "world", "news", "people", "year",
    "years", "could", "would", "many", "three", "four", "five", "june", "july", "august", "september",
    "bbc", "npr", "nytimes", "published", "get", "related", "homepage", "collection", "image", "caption",
    "copyright", "external", "link", "share", "read", "more", "click", "page", "content", "media", "video",
    "audio", "play", "original", "report", "reporting", "source", "newsletter", "subscribe", "email",
    "advertising", "advertisement", "support", "app", "download", "follow", "twitter", "facebook", "instagram",
    "youtube", "story", "stories", "time", "date", "day", "days", "week", "weeks", "month", "months", "mr",
    "mrs", "dr", "pm", "am", "ad", "ads", "website", "online", "view", "watch",
    # Additional common generic verbs, adverbs, and adjectives to filter
    "another", "now", "told", "back", "go", "goes", "going", "take", "takes", "taking", "make", "makes", "making",
    "made", "come", "comes", "came", "gets", "getting", "got", "put", "puts", "putting", "look", "looks", "looking",
    "want", "wants", "wanted", "give", "gives", "giving", "gave", "find", "finds", "found", "say", "saying",
    "think", "thinks", "thought", "tell", "tells", "ask", "asks", "asked", "show", "shows", "showed", "call",
    "calls", "called", "keep", "keeps", "kept", "start", "starts", "started", "run", "runs", "running", "write",
    "writes", "wrote", "set", "sets", "use", "uses", "used", "using", "work", "works", "worked", "part", "parts",
    "life", "old", "good", "best", "great", "high", "low", "big", "small", "little", "long", "short", "own",
    "end", "ends", "ended", "begin", "begins", "began", "still", "even", "well", "way", "much", "many", "never",
    "always", "something", "anything", "nothing", "everything", "someone", "anyone", "everyone", "noone",
    "become", "becomes", "became", "seemed", "seems", "seem", "told", "tell", "another", "try", "tries", "tried",
    "put", "need", "needs", "needed", "may", "might", "must",
    # News site navigation keywords to prevent cross-site matching
    "sport", "business", "innovation", "culture", "travel", "earth", "live", "weather", "home", "worklife",
    "future", "opinion", "arts", "television", "politics", "local", "national", "international", "section",
    "topics", "header", "footer", "navigation", "menu", "search", "sign", "register", "top", "just", "place",
    "point", "points", "thing", "things", "front", "left", "right", "side", "sides", "category", "categories",
    # Contraction root fragments
    "don", "doesn", "didn", "haven", "hasn", "isn", "aren", "wasn", "weren", "won", "wouldn", "couldn", "shouldn",
    # Day and month names
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
    # Other highly common non-topic nouns/adverbs/prepositions
    "know", "knows", "knew", "known", "ago", "last", "next", "past", "since", "during", "before", "after", "while", "until",
    "close", "closer", "far", "away", "often", "here", "there", "every", "each", "both", "either", "neither", "some",
    "including", "across", "among", "added", "along", "without", "within", "together", "throughout", "whose", "whom",
    "whoever", "whichever", "family", "staff", "senior",
    # New requested stopwords to expand
    "latest", "reported", "expected", "early", "around", "really", "several", "according", "breaking", "live",
    "update", "updates", "should", "company", "article", "reports"
}

def tokenize(text: str) -> Set[str]:
    """
    Cleans, lowercases, and tokenizes raw strings, removing standard English stopwords.
    Returns a set of unique keywords of length > 2.
    
    Args:
        text (str): Input text string.
        
    Returns:
        Set[str]: Unique keyword tokens.
    """
    if not text:
        return set()
    words = re.findall(r"[a-z]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 2}

def get_representative_keywords(member_articles: List[Dict[str, Any]], limit: int = 20) -> List[str]:
    """
    Computes the top N most frequent keywords across all member articles of a cluster.
    
    Args:
        member_articles (List[Dict[str, Any]]): List of member article dictionaries.
        limit (int): Maximum number of keywords to return.
        
    Returns:
        List[str]: Most frequent representative keywords.
    """
    counter = Counter()
    for art in member_articles:
        combined = f"{art.get('title', '')} {art.get('summary', '')} {art.get('body_text', '')}"
        counter.update(tokenize(combined))
    return [item[0] for item in counter.most_common(limit)]

def generate_cluster_label(member_articles: List[Dict[str, Any]]) -> str:
    """
    Generates a human-readable title-cased label from cased, weighted candidate phrases
    ranging from 2 to 4 words, prioritizing proper nouns and named entities.
    
    Args:
        member_articles (List[Dict[str, Any]]): List of member article dictionaries.
        
    Returns:
        str: Generated human-readable label.
    """
    if not member_articles:
        return "General News"
        
    candidates = defaultdict(lambda: {
        "score": 0.0,
        "cased_counter": Counter(),
        "length": 0
    })
    
    fields = [
        ("title", 5.0),
        ("summary", 2.0),
        ("body_text", 1.0)
    ]
    
    # Common news acronyms to preserve or uppercase
    ACRONYMS = {
        "ai", "wwdc", "fifa", "nasa", "covid", "us", "uk", "eu", "ceo", "gop",
        "cpu", "gpu", "ny", "nyc", "fbi", "cia", "un", "imf", "who", "fda",
        "sec", "ftc", "dns", "ip"
    }

    # Specific casing mappings for entities with mixed case
    CASING_MAP = {
        "openai": "OpenAI",
        "youtube": "YouTube",
        "facebook": "Facebook",
        "twitter": "Twitter",
        "netflix": "Netflix",
        "google": "Google",
        "apple": "Apple",
        "wimbledon": "Wimbledon",
    }
    
    for art in member_articles:
        for field_name, field_weight in fields:
            text = art.get(field_name, "") or ""
            if not text:
                continue
                
            # Split into sentences to avoid phrases crossing sentence boundaries
            sentences = re.split(r"[.!?\n]+", text)
            for sen in sentences:
                # Match words: letters (including unicode), digits
                words = re.findall(r"[^\W_]+", sen)
                if not words:
                    continue
                    
                # Generate phrases of length 1, 2, 3, 4
                for n in (1, 2, 3, 4):
                    for i in range(len(words) - n + 1):
                        phrase_words = words[i : i + n]
                        
                        # Validate words in the phrase
                        valid = True
                        for w in phrase_words:
                            wl = w.lower()
                            if wl in STOPWORDS:
                                valid = False
                                break
                            # Length check: allow digits if length >= 3,
                            # else letters must be length > 2
                            if len(w) <= 2:
                                if not (w.isdigit() and len(w) >= 3):
                                    valid = False
                                    break
                                    
                        if not valid:
                            continue
                            
                        # Build normalized and cased representations
                        norm_words = [w.lower() for w in phrase_words]
                        norm_phrase = " ".join(norm_words)
                        cased_phrase = " ".join(phrase_words)
                        
                        # Prioritize Proper Nouns (casing in original text)
                        capitalized_count = sum(1 for w in phrase_words if w and w[0].isupper())
                        proper_noun_ratio = capitalized_count / len(phrase_words)
                        proper_noun_multiplier = 1.0 + (proper_noun_ratio * 1.5)
                        
                        match_score = field_weight * proper_noun_multiplier
                        
                        candidates[norm_phrase]["score"] += match_score
                        candidates[norm_phrase]["cased_counter"][cased_phrase] += 1
                        candidates[norm_phrase]["length"] = n

    if not candidates:
        return "General News"
        
    # Check if we have multi-word candidates (length >= 2)
    has_multiword = any(c["length"] >= 2 for c in candidates.values())
    
    valid_candidates = []
    for norm_phrase, info in candidates.items():
        if has_multiword and info["length"] < 2:
            continue
            
        score = info["score"]
        # Length bonus: prefer 3 or 4 words over 2
        if info["length"] == 3:
            score *= 1.3
        elif info["length"] == 4:
            score *= 1.5
            
        valid_candidates.append({
            "norm_phrase": norm_phrase,
            "score": score,
            "cased_counter": info["cased_counter"],
            "length": info["length"]
        })
        
    if not valid_candidates:
        return "General News"
        
    # Sort deterministically: highest score first, then alphabetical on norm_phrase
    valid_candidates.sort(key=lambda x: (-x["score"], x["norm_phrase"]))
    
    best_candidate = valid_candidates[0]
    
    # Choose cased version deterministically: highest frequency, then alphabetical
    best_cased_tuple = sorted(
        best_candidate["cased_counter"].items(),
        key=lambda x: (-x[1], x[0])
    )[0]
    best_cased = best_cased_tuple[0]
    
    # Apply acronym and title formatting to each word in the label
    words_formatted = []
    for w in best_cased.split():
        wl = w.lower()
        if wl in CASING_MAP:
            words_formatted.append(CASING_MAP[wl])
        elif wl in ACRONYMS:
            words_formatted.append(w.upper())
        elif w.isupper() and len(w) > 1:
            words_formatted.append(w)
        else:
            words_formatted.append(w.capitalize())
            
    return " ".join(words_formatted)

def refresh_cluster_metadata(cluster_id: int, label: str, cursor: Any) -> None:
    """
    Recomputes and saves a cluster's representative keywords and human-readable label
    based on the current set of assigned articles.
    
    Args:
        cluster_id (int): Target cluster ID.
        label (str): Current label name.
        cursor (Any): Active database transaction cursor.
    """
    # Fetch all articles in this cluster
    cursor.execute(
        "SELECT title, summary, body_text FROM articles WHERE cluster_id = %s;",
        (cluster_id,)
    )
    rows = cursor.fetchall()
    
    if not rows:
        return

    articles_list = [dict(row) for row in rows]
    
    # 1. Recompute label
    new_label = generate_cluster_label(articles_list)
    
    # 2. Recompute representative keywords (top 20)
    new_keywords = get_representative_keywords(articles_list, limit=20)
    
    # 3. Update database
    update_cluster(cluster_id, new_label, new_keywords, cursor=cursor)

def run_incremental_clustering(conn: Any) -> Dict[str, Any]:
    """
    Clusters unclustered articles incrementally.
    Compares articles to active clusters based on their persisted representative keywords.
    Assigns matches to existing clusters or spawns new ones.
    
    Args:
        conn (Any): PostgreSQL connection object.
        
    Returns:
        Dict[str, Any]: Summary metrics of the run.
    """
    metrics = {
        "total_clustered": 0,
        "existing_reused": 0,
        "new_created": 0,
        "decisions": []
    }

    with transaction(conn) as cur:
        # 1. Fetch unclustered articles
        unclustered = get_unclustered_articles(cur)
        if not unclustered:
            return metrics

        # 2. Fetch existing clusters with keywords
        active_clusters = get_existing_clusters(cur)
        # Store as dictionaries with sets for fast overlap checks
        clusters_state = []
        for c in active_clusters:
            clusters_state.append({
                "id": c["id"],
                "label": c["label"],
                "keywords": set(c["keywords"] or [])
            })

        for art in unclustered:
            combined = f"{art.get('title', '')} {art.get('summary', '')} {art.get('body_text', '')}"
            art_tokens = tokenize(combined)
            
            best_match = None
            max_overlap = -1
            
            # Compare overlap against existing active clusters
            for c_state in clusters_state:
                overlap = len(art_tokens & c_state["keywords"])
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_match = c_state
            
            # If overlap matches threshold, assign
            if max_overlap >= CLUSTER_THRESHOLD and best_match:
                cluster_id = best_match["id"]
                assign_cluster(art["url"], cluster_id, cur)
                
                # Recompute representative keywords and label
                refresh_cluster_metadata(cluster_id, best_match["label"], cur)
                
                # Retrieve updated keywords for in-memory comparisons
                cur.execute("SELECT keywords, label FROM clusters WHERE id = %s;", (cluster_id,))
                updated_row = cur.fetchone()
                best_match["keywords"] = set(updated_row["keywords"] or [])
                best_match["label"] = updated_row["label"]

                metrics["total_clustered"] += 1
                metrics["existing_reused"] += 1
                metrics["decisions"].append({
                    "title": art["title"],
                    "cluster_label": best_match["label"],
                    "overlap": max_overlap,
                    "decision": "Existing Cluster"
                })
            else:
                # Create a new cluster
                label_candidates = [{"title": art["title"], "summary": art["summary"], "body_text": art["body_text"]}]
                new_label = generate_cluster_label(label_candidates)
                new_keywords = get_representative_keywords(label_candidates, limit=20)
                
                new_id = insert_cluster(new_label, new_keywords, cur)
                assign_cluster(art["url"], new_id, cur)
                
                # Add to in-memory active list for subsequent articles in the batch
                clusters_state.append({
                    "id": new_id,
                    "label": new_label,
                    "keywords": set(new_keywords)
                })

                metrics["total_clustered"] += 1
                metrics["new_created"] += 1
                metrics["decisions"].append({
                    "title": art["title"],
                    "cluster_label": new_label,
                    "overlap": max_overlap,
                    "decision": "New Cluster"
                })

    return metrics

def run_full_clustering(conn: Any) -> Dict[str, Any]:
    """
    Wipes existing clusters and re-clusters all database articles from scratch.
    
    Args:
        conn (Any): PostgreSQL connection object.
        
    Returns:
        Dict[str, Any]: Summary metrics of the run.
    """
    metrics = {
        "total_clustered": 0,
        "existing_reused": 0,  # Always 0 for full run
        "new_created": 0,
        "decisions": []
    }

    with transaction(conn) as cur:
        # 1. Wipe clusters and reset article assignments
        clear_all_article_assignments(cur)
        delete_all_clusters(cur)

        # 2. Fetch all articles to cluster
        articles = get_all_articles(cur)
        if not articles:
            return metrics

        # In-memory structures to build cluster groups
        # Format: {"label": str, "keywords": set, "articles": list}
        in_memory_clusters = []

        for art in articles:
            combined = f"{art.get('title', '')} {art.get('summary', '')} {art.get('body_text', '')}"
            art_tokens = tokenize(combined)
            
            best_match = None
            max_overlap = -1
            
            for c in in_memory_clusters:
                overlap = len(art_tokens & c["keywords"])
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_match = c
            
            if max_overlap >= CLUSTER_THRESHOLD and best_match:
                best_match["articles"].append(art)
                # Recompute representative keywords (top 20)
                best_match["keywords"] = set(get_representative_keywords(best_match["articles"], limit=20))
                
                metrics["total_clustered"] += 1
                metrics["decisions"].append({
                    "title": art["title"],
                    "cluster_label": best_match["label"], # Placeholder
                    "overlap": max_overlap,
                    "decision": "Existing Cluster"
                })
            else:
                new_keywords = get_representative_keywords([art], limit=20)
                new_c = {
                    "label": "", # Generated dynamically after grouping
                    "keywords": set(new_keywords),
                    "articles": [art]
                }
                in_memory_clusters.append(new_c)
                
                metrics["total_clustered"] += 1
                metrics["new_created"] += 1
                metrics["decisions"].append({
                    "title": art["title"],
                    "cluster_label": "", # Generated later
                    "overlap": max_overlap,
                    "decision": "New Cluster"
                })

        # 3. Persist final clusters and assign IDs
        for c in in_memory_clusters:
            # Generate correct label based on final group members
            c["label"] = generate_cluster_label(c["articles"])
            
            # Save to PostgreSQL
            cluster_id = insert_cluster(c["label"], list(c["keywords"]), cur)
            
            # Update assignments for all member articles
            for art in c["articles"]:
                assign_cluster(art["url"], cluster_id, cur)
                
            # Back-fill label in metrics logging
            for dec in metrics["decisions"]:
                if dec["title"] in [a["title"] for a in c["articles"]]:
                    dec["cluster_label"] = c["label"]

    return metrics
