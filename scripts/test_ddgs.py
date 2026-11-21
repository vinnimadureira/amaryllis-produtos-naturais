from duckduckgo_search import DDGS

try:
    with DDGS() as ddgs:
        results = list(ddgs.images("Panizza tintura espinheira santa 100ml", max_results=3))
        print(f"DDGS found {len(results)} images:")
        for r in results:
            print(f"  Title: {r.get('title')}")
            print(f"  Image: {r.get('image')}")
except Exception as e:
    print("DDGS error:", e)
