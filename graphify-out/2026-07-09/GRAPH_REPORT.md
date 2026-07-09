# Graph Report - /home/ubuntu/sam  (2026-07-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 114 nodes · 162 edges · 8 communities (6 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- _search_csv
- _search_csv
- design_system.py
- DesignSystemGenerator
- design_system.py
- DesignSystemGenerator
- format_output
- format_output

## God Nodes (most connected - your core abstractions)
1. `DesignSystemGenerator` - 11 edges
2. `DesignSystemGenerator` - 11 edges
3. `_search_csv()` - 8 edges
4. `_search_csv()` - 8 edges
5. `BM25` - 7 edges
6. `search()` - 7 edges
7. `generate_design_system()` - 7 edges
8. `BM25` - 7 edges
9. `search()` - 7 edges
10. `generate_design_system()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `_generate_intelligent_overrides()` --calls--> `search()`  [INFERRED]
  .agent/skills/ui-ux-pro-max/scripts/design_system.py → .agent/skills/ui-ux-pro-max/scripts/core.py
- `_generate_intelligent_overrides()` --calls--> `search()`  [INFERRED]
  .agents/skills/uiux-pro-max/scripts/design_system.py → .agents/skills/uiux-pro-max/scripts/core.py

## Import Cycles
- None detected.

## Communities (8 total, 2 thin omitted)

### Community 0 - "_search_csv"
Cohesion: 0.15
Nodes (15): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+7 more)

### Community 1 - "_search_csv"
Cohesion: 0.15
Nodes (15): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+7 more)

### Community 2 - "design_system.py"
Cohesion: 0.17
Nodes (16): _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system() (+8 more)

### Community 3 - "DesignSystemGenerator"
Cohesion: 0.16
Nodes (9): DesignSystemGenerator, Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation., Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Find matching reasoning rule for a category. (+1 more)

### Community 4 - "design_system.py"
Cohesion: 0.17
Nodes (16): _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system() (+8 more)

### Community 5 - "DesignSystemGenerator"
Cohesion: 0.16
Nodes (9): DesignSystemGenerator, Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation., Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Find matching reasoning rule for a category. (+1 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `search()` connect `_search_csv` to `design_system.py`, `DesignSystemGenerator`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `search()` connect `_search_csv` to `design_system.py`, `DesignSystemGenerator`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `BM25 ranking algorithm for text search`, `Lowercase, split, remove punctuation, filter short words`, `Build BM25 index from documents` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `_search_csv` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `_search_csv` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._