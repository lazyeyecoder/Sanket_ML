"""
Manual retrieval smoke test: prints the top-3 chunks + scores per query.

    python -m rag.test_retrieve            # English queries
    python -m rag.test_retrieve --lang hi  # once Hindi/Marathi docs exist
"""

import argparse

from rag.retriever import retrieve

QUERIES = [
    "second degree burn treatment",
    "how to stop bleeding from a cut",
    "diabetic wound care",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default="en", choices=["en", "hi", "mr"])
    args = parser.parse_args()

    for q in QUERIES:
        print(f"\n=== {q!r} (lang={args.lang}) ===")
        try:
            results = retrieve(q, k=3, lang=args.lang)
        except TypeError:
            results = retrieve(q, k=3)  # retriever not multilingual yet
        for r in results:
            print(f"  [{r['score']:.3f}] {r['doc']} / {r['heading']}")


if __name__ == "__main__":
    main()
