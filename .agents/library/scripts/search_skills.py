import json
import sys

def search_skills(query=None, categorize=False):
    try:
        with open('.agent/skills/skills_index.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        skills = data if isinstance(data, list) else data.get('skills', [])
        
        if query:
            skills = [s for s in skills if query.lower() in s['name'].lower() or query.lower() in s['description'].lower()]
            
        if categorize:
            categories = {}
            for s in skills:
                cat = s.get('category', 'Uncategorized')
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(s)
            
            print(json.dumps(categories, indent=2, ensure_ascii=False))
        else:
            print(json.dumps(skills, indent=2, ensure_ascii=False))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else None
    search_skills(query, categorize=True)
