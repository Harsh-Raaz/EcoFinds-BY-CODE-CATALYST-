"""
Smart Search & Recommendations with API Endpoints

Features:
- Similar Listings Recommendation (TF-IDF or Sentence-BERT)
- Personalized Feed (content-based; categories, price, and embedding similarity)
- Trending Items (weighted events + time decay)
- REST API layer with FastAPI

Dependencies (install as needed):
    pip install scikit-learn pandas numpy sentence-transformers faiss-cpu fastapi uvicorn

Run API server:
    uvicorn smart_search_recommendations:app --reload --port 8000
"""
from __future__ import annotations

import math
import time
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity

from fastapi import FastAPI, Query
from pydantic import BaseModel

try:
    import faiss  # type: ignore
    _HAS_FAISS = True
except Exception:
    _HAS_FAISS = False

try:
    from sentence_transformers import SentenceTransformer
    _HAS_SBERT = True
except Exception:
    _HAS_SBERT = False


# ----------------------------- Utilities ----------------------------- #

def _normalize_text(s: str) -> str:
    return (s or "").strip().lower()


def _concat_text(row: pd.Series, fields: List[str]) -> str:
    return " \n".join(_normalize_text(str(row.get(f, ""))) for f in fields)


def _cosine_topk(query_vec: np.ndarray, item_matrix: np.ndarray, k: int) -> Tuple[np.ndarray, np.ndarray]:
    sims = cosine_similarity(query_vec.reshape(1, -1), item_matrix).ravel()
    idx = np.argpartition(-sims, kth=min(k, len(sims)-1))[:k]
    idx = idx[np.argsort(-sims[idx])]
    return idx, sims[idx]


# ----------------------------- Similarity Engine ----------------------------- #
@dataclass
class SimilarityConfig:
    text_fields: List[str] = None  # e.g., ["title", "description"]
    method: str = "tfidf"  # "tfidf" | "sbert"
    sbert_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    use_faiss: bool = True

    def __post_init__(self):
        if self.text_fields is None:
            self.text_fields = ["title", "description"]


class SimilarityEngine:
    """Builds item-item and query-item similarity using TF-IDF or SBERT."""

    def __init__(self, cfg: SimilarityConfig):
        self.cfg = cfg
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix: Optional[np.ndarray] = None
        self.model: Optional[SentenceTransformer] = None
        self.embed_matrix: Optional[np.ndarray] = None
        self.faiss_index = None
        self.item_ids: List[str] = []

    def fit(self, items_df: pd.DataFrame, id_col: str = "id"):
        self.item_ids = items_df[id_col].astype(str).tolist()
        texts = items_df.apply(lambda r: _concat_text(r, self.cfg.text_fields), axis=1).tolist()

        if self.cfg.method == "tfidf":
            self.vectorizer = TfidfVectorizer(max_features=100_000, ngram_range=(1,2))
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)
        elif self.cfg.method == "sbert":
            if not _HAS_SBERT:
                raise ImportError("sentence-transformers not installed. pip install sentence-transformers")
            self.model = SentenceTransformer(self.cfg.sbert_model_name)
            emb = self.model.encode(texts, batch_size=64, convert_to_numpy=True, show_progress_bar=False, normalize_embeddings=True)
            self.embed_matrix = emb.astype(np.float32)
            if self.cfg.use_faiss and _HAS_FAISS:
                d = self.embed_matrix.shape[1]
                index = faiss.IndexFlatIP(d)  # cosine with normalized vectors
                index.add(self.embed_matrix)
                self.faiss_index = index
        else:
            raise ValueError("Unknown method: %s" % self.cfg.method)
        return self

    def encode(self, texts: List[str]) -> np.ndarray:
        texts = [_normalize_text(t) for t in texts]
        if self.cfg.method == "tfidf":
            assert self.vectorizer is not None, "Call fit() first"
            return self.vectorizer.transform(texts)
        else:
            assert self.model is not None, "Call fit() first"
            emb = self.model.encode(texts, batch_size=64, convert_to_numpy=True, show_progress_bar=False, normalize_embeddings=True)
            return emb.astype(np.float32)

    def similar_items(self, item_ids: List[str], k: int = 10) -> Dict[str, List[Tuple[str, float]]]:
        id_to_idx = {iid: i for i, iid in enumerate(self.item_ids)}
        out: Dict[str, List[Tuple[str, float]]] = {}

        for iid in item_ids:
            i = id_to_idx[iid]
            if self.cfg.method == "tfidf":
                assert self.tfidf_matrix is not None
                vec = self.tfidf_matrix[i]
                sims = cosine_similarity(vec, self.tfidf_matrix).ravel()
            else:
                if self.faiss_index is not None:
                    sims, idx = self.faiss_index.search(self.embed_matrix[i:i+1], k+1)
                    sims, idx = sims.ravel(), idx.ravel()
                else:
                    assert self.embed_matrix is not None
                    idx, sims = _cosine_topk(self.embed_matrix[i], self.embed_matrix, k+1)
                full = np.zeros(len(self.item_ids), dtype=np.float32)
                full[idx] = sims
                sims = full

            sims[i] = -1  # exclude self
            topk = np.argpartition(-sims, kth=min(k, len(sims)-1))[:k]
            topk = topk[np.argsort(-sims[topk])]
            out[iid] = [(self.item_ids[j], float(sims[j])) for j in topk]
        return out

    def search(self, query: str, k: int = 10) -> List[Tuple[str, float]]:
        if self.cfg.method == "tfidf":
            assert self.vectorizer is not None and self.tfidf_matrix is not None
            qv = self.vectorizer.transform([_normalize_text(query)])
            sims = cosine_similarity(qv, self.tfidf_matrix).ravel()
        else:
            qv = self.encode([query])
            if self.faiss_index is not None:
                sims, idx = self.faiss_index.search(qv, k)
                idx, sims = idx.ravel(), sims.ravel()
                return [(self.item_ids[i], float(sims[j])) for j, i in enumerate(idx)]
            else:
                assert self.embed_matrix is not None
                idx, sims = _cosine_topk(qv[0], self.embed_matrix, k)
        idx = np.argpartition(-sims, kth=min(k, len(sims)-1))[:k]
        idx = idx[np.argsort(-sims[idx])]
        return [(self.item_ids[i], float(sims[i])) for i in idx]


# ----------------------------- Personalized Feed ----------------------------- #
@dataclass
class PersonalizeConfig:
    cat_weight: float = 0.4
    price_weight: float = 0.2
    text_weight: float = 0.4
    price_col: str = "price"
    cat_col: str = "category"
    id_col: str = "id"


class PersonalizedFeed:
    def __init__(self, cfg: PersonalizeConfig, sim_engine: SimilarityEngine):
        self.cfg = cfg
        self.sim_engine = sim_engine
        self.scaler = MinMaxScaler()

    def fit(self, items_df: pd.DataFrame):
        if self.cfg.price_col in items_df:
            prices = items_df[[self.cfg.price_col]].fillna(0.0)
            self.scaler.fit(prices)
        return self

    def _category_score(self, user_history: pd.DataFrame, candidate_cats: pd.Series) -> np.ndarray:
        hist = user_history[self.cfg.cat_col].dropna().astype(str)
        if hist.empty:
            return np.zeros(len(candidate_cats))
        freq = hist.value_counts(normalize=True)
        return candidate_cats.astype(str).map(freq).fillna(0.0).to_numpy()

    def _price_score(self, user_history: pd.DataFrame, candidate_prices: pd.Series) -> np.ndarray:
        if self.cfg.price_col not in user_history or self.cfg.price_col not in candidate_prices:
            return np.zeros(len(candidate_prices))
        target = float(user_history[self.cfg.price_col].median()) if not user_history.empty else float(candidate_prices.median())
        cand = self.scaler.transform(candidate_prices.to_numpy().reshape(-1,1)).ravel()
        tgt = self.scaler.transform(np.array([[target]])).ravel()[0]
        scores = 1.0 - np.minimum(1.0, np.abs(cand - tgt))
        return scores

    def _text_score(self, user_history: pd.DataFrame, items_df: pd.DataFrame, text_fields: List[str]) -> np.ndarray:
        if user_history.empty:
            return np.zeros(len(items_df))
        profile_text = " \n".join(user_history.apply(lambda r: _concat_text(r, text_fields), axis=1).tolist())
        if self.sim_engine.cfg.method == "tfidf":
            qv = self.sim_engine.encode([profile_text])
            sims = cosine_similarity(qv, self.sim_engine.tfidf_matrix).ravel()
        else:
            qv = self.sim_engine.encode([profile_text])
            if self.sim_engine.faiss_index is not None:
                sims, idx = self.sim_engine.faiss_index.search(qv, len(items_df))
                full = np.zeros(len(items_df), dtype=np.float32)
                full[idx.ravel()] = sims.ravel()
                sims = full
            else:
                idx, scores = _cosine_topk(qv[0], self.sim_engine.embed_matrix, len(items_df))
                full = np.zeros(len(items_df), dtype=np.float32)
                full[idx] = scores
                sims = full
        return sims

    def recommend(self, user_history: pd.DataFrame, items_df: pd.DataFrame, k: int = 20, exclude_seen: bool = True) -> pd.DataFrame:
        id_col = self.cfg.id_col
        mask = ~items_df[id_col].isin(user_history[id_col]) if exclude_seen else np.array([True]*len(items_df))
        candidates = items_df[mask].reset_index(drop=True)

        cat_scores = self._category_score(user_history, candidates[self.cfg.cat_col])
        price_scores = self._price_score(user_history, candidates[self.cfg.price_col])
        text_scores = self._text_score(user_history, items_df, ["title", "description"])[mask]

        total = (
            self.cfg.cat_weight * cat_scores +
            self.cfg.price_weight * price_scores +
            self.cfg.text_weight * text_scores
        )
        candidates = candidates.assign(score=total)
        return candidates.sort_values("score", ascending=False).head(k)


# ----------------------------- Trending Items ----------------------------- #
@dataclass
class TrendingConfig:
    click_w: float = 1.0
    save_w: float = 2.0
    purchase_w: float = 5.0
    half_life_hours: float = 24.0
    id_col: str = "item_id"
    ts_col: str = "timestamp"
    type_col: str = "event_type"


class TrendingRanker:
    def __init__(self, cfg: TrendingConfig):
        self.cfg = cfg

    def _decay(self, ages_hours: np.ndarray) -> np.ndarray:
        return 0.5 ** (ages_hours / self.cfg.half_life_hours)

    def score(self, events_df: pd.DataFrame, as_of_ts: Optional[float] = None) -> pd.DataFrame:
        if as_of_ts is None:
            as_of_ts = time.time()
        df = events_df.copy()
        df[self.cfg.ts_col] = df[self.cfg.ts_col].astype(float)
        hours = (as_of_ts - df[self.cfg.ts_col]) / 3600.0
        decay = self._decay(hours.to_numpy())
        w_map = {"click": self.cfg.click_w, "save": self.cfg.save_w, "purchase": self.cfg.purchase_w}
        base_w = df[self.cfg.type_col].map(w_map).fillna(0.0).to_numpy()
        df["decayed_weight"] = base_w * decay
        scores = df.groupby(self.cfg.id_col)["decayed_weight"].sum().reset_index().rename(columns={"decayed_weight":"trend_score"})
        return scores.sort_values("trend_score", ascending=False).reset_index(drop=True)


# ----------------------------- FastAPI Layer ----------------------------- #
app = FastAPI(title="Smart Search & Recommendations API")

# Dummy items
items_df = pd.DataFrame([
    {"id":"1", "title":"Modern Gray Sofa", "description":"3-seater couch with linen fabric", "category":"furniture", "price":499},
    {"id":"2", "title":"Leather Couch", "description":"Spacious brown sofa, premium leather", "category":"furniture", "price":899},
    {"id":"3", "title":"Office Chair", "description":"Ergonomic mesh chair with lumbar support", "category":"furniture", "price":199},
    {"id":"4", "title":"iPhone 14", "description":"128GB, midnight, excellent condition", "category":"electronics", "price":699},
    {"id":"5", "title":"Samsung Galaxy S23", "description":"256GB, black, near-mint", "category":"electronics", "price":749},
])

# Build engines
sim_engine = SimilarityEngine(SimilarityConfig(method="tfidf")).fit(items_df)
feed_engine = PersonalizedFeed(PersonalizeConfig(), sim_engine).fit(items_df)
trend_ranker = TrendingRanker(TrendingConfig())

class SearchRequest(BaseModel):
    query: str
    k: int = 5

class SimilarRequest(BaseModel):
    item_id: str
    k: int = 5

class FeedRequest(BaseModel):
    history_ids: List[str]
    k: int = 5

class TrendRequest(BaseModel):
    events: List[Dict]

@app.post("/search")
def search(req: SearchRequest):
    results = sim_engine.search(req.query, k=req.k)
    return {"results": results}

@app.post("/similar")
def similar(req: SimilarRequest):
    results = sim_engine.similar_items([req.item_id], k=req.k)
    return {"item_id": req.item_id, "results": results.get(req.item_id, [])}

@app.post("/feed")
def feed(req: FeedRequest):
    user_hist = items_df[items_df["id"].isin(req.history_ids)]
    recs = feed_engine.recommend(user_hist, items_df, k=req.k)
    return recs.to_dict(orient="records")

@app.post("/trending")
def trending(req: TrendRequest):
    events_df = pd.DataFrame(req.events)
    scores = trend_ranker.score(events_df)
    return scores.to_dict(orient="records")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
