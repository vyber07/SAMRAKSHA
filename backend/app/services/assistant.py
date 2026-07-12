"""
assistant.py — CrimeGPT case intelligence for SAMRAKSHA
Pure statistical + keyword analyser over real case data. No external services.
"""
import re
import structlog
from collections import Counter

logger = structlog.get_logger()


async def get_llm_response(system_prompt: str, context: str, question: str) -> str:
    """Entry point called by the assistant API."""
    return smart_case_analyser(question, context)


def _parse_cases(context: str) -> list:
    """
    Parse case lines of the form:
      FIR BOD/2026/0133: snatching in Bodakdev, status=arrested, date=2026-07-11
    Returns list of dicts with keys: fir, type, ward, status, date
    """
    cases = []
    for line in context.split("\n"):
        line = line.strip().lstrip("- ")
        if not line.startswith("FIR "):
            continue
        c = {}
        m = re.match(
            r"FIR (\S+):\s+(\w+)\s+in\s+(\w+),\s+status=(\w+),\s+date=(\S+)", line
        )
        if m:
            c["fir"]    = m.group(1)
            c["type"]   = m.group(2)
            c["ward"]   = m.group(3) if m.group(3) not in ("None", "null") else "Unknown"
            c["status"] = m.group(4)
            c["date"]   = m.group(5)
        else:
            for key, pat in [
                ("fir",    r"FIR (\S+):"),
                ("type",   r"FIR \S+:\s+(\w+)"),
                ("ward",   r"in (\w+),"),
                ("status", r"status=(\w+)"),
                ("date",   r"date=(\S+)"),
            ]:
                mm = re.search(pat, line)
                c[key] = mm.group(1) if mm else "Unknown"
            if c.get("ward") in ("None", "null"):
                c["ward"] = "Unknown"
        cases.append(c)
    return cases


def _single_case_answer(q: str, context: str) -> str:
    """Answer questions about one case file."""
    lines = context.split("\n")

    field_map = {
        ("victim", "injured"):                              "Victim:",
        ("accused", "suspect", "arrested"):                 "Accused:",
        ("section", "bns", "bnss", "bsa", "law", "charge"):"BNS Sections:",
        ("evidence", "seized", "property", "exhibit"):      "Evidence:",
        ("arrest date",):                                   "Arrest Date:",
        ("location", "where", "place"):                     "Location:",
        ("narrative", "what happened", "description"):      "Narrative:",
        ("status", "progress", "stage"):                    "Status:",
        ("crime type", "offence", "offense"):               "Crime Type:",
        ("witness",):                                       "Witnesses:",
        ("date", "when", "time"):                           "Crime Date:",
    }

    for keywords, label in field_map.items():
        if any(kw in q for kw in keywords):
            for line in lines:
                if line.startswith(label):
                    val = line[len(label):].strip()
                    if val and val not in ("None", "Not identified", ""):
                        return f"**{label}** {val}"
            return f"**{label}** Not recorded in this case file."

    # Fallback: summarise key fields
    summary_fields = [
        "Crime Type:", "Status:", "Victim:", "Accused:",
        "Location:", "BNS Sections:", "Arrest Date:",
    ]
    parts = [l.strip() for l in lines if any(l.startswith(f) for f in summary_fields)]
    if parts:
        return "Case summary:\n" + "\n".join(f"• {p}" for p in parts)

    return "This information is not recorded in the case file."


def _all_cases_answer(q: str, context: str) -> str:
    """Statistical analysis over all loaded cases."""
    cases = _parse_cases(context)
    if not cases:
        return "No case data found."

    total          = len(cases)
    status_count   = Counter(c["status"] for c in cases)
    type_count     = Counter(c["type"]   for c in cases)
    ward_count     = Counter(c["ward"]   for c in cases if c["ward"] != "Unknown")

    open_n     = status_count.get("open", 0)
    arrested_n = status_count.get("arrested", 0)
    charged_n  = status_count.get("chargesheeted", 0)

    # ── How many / count ──────────────────────────────────────────────
    if re.search(r"how many|count|total|number of", q):
        if re.search(r"open|pending|active|unresolved", q):
            return f"There are **{open_n}** open/pending cases out of {total} total ({round(open_n/total*100)}%)."
        if re.search(r"arrest", q):
            return f"**{arrested_n}** cases have the accused in custody ({round(arrested_n/total*100)}% of total)."
        if re.search(r"charg", q):
            return f"**{charged_n}** cases have been chargesheeted ({round(charged_n/total*100)}%)."
        if re.search(r"clos|solve|resolv", q):
            closed = arrested_n + charged_n + status_count.get("closed", 0)
            return f"**{closed}** cases are resolved/closed ({round(closed/total*100)}%)."

        # Match a specific crime type
        for ct, cnt in type_count.items():
            if ct in q or ct.replace("_", " ") in q:
                return (f"There are **{cnt}** {ct.replace('_',' ')} cases "
                        f"({round(cnt/total*100)}% of total {total}).")

        return f"There are **{total}** total cases in the current dataset."

    # ── Breakdown / distribution ──────────────────────────────────────
    if re.search(r"breakdown|distribution|by type|types?|categor|split|percent", q):
        rows = [
            f"• **{k.replace('_',' ')}**: {v} ({round(v/total*100)}%)"
            for k, v in type_count.most_common()
        ]
        return f"Crime type breakdown ({total} total cases):\n" + "\n".join(rows)

    # ── Ward / area / hotspot ─────────────────────────────────────────
    if re.search(r"ward|area|zone|location|where|hotspot|most crime|highest", q):
        if not ward_count:
            return "No ward data available."
        top5 = ward_count.most_common(5)
        rows = [f"• **{w}**: {n} cases" for w, n in top5]
        return (f"Top crime areas (hotspots):\n" + "\n".join(rows) +
                f"\n\n**{top5[0][0]}** has the highest concentration.")

    # ── Status overview / summary ─────────────────────────────────────
    if re.search(r"status|summary|overview|progress|report|brief|update", q):
        top_crime = type_count.most_common(1)[0][0].replace("_", " ")
        top_area  = ward_count.most_common(1)[0][0] if ward_count else "N/A"
        rows = [
            f"• **Open/Pending**:   {open_n}  ({round(open_n/total*100)}%)",
            f"• **Arrested**:       {arrested_n}  ({round(arrested_n/total*100)}%)",
            f"• **Chargesheeted**:  {charged_n}  ({round(charged_n/total*100)}%)",
            f"",
            f"Most common crime:  **{top_crime}**",
            f"Highest crime area: **{top_area}**",
        ]
        return f"Case status overview — {total} total:\n" + "\n".join(rows)

    # ── Recent cases ──────────────────────────────────────────────────
    if re.search(r"recent|latest|last|new|today|week|newest", q):
        rows = [
            f"• FIR {c['fir']}: {c['type'].replace('_',' ')} in {c['ward']} — {c['status']}"
            for c in cases[:6]
        ]
        return "Most recent cases:\n" + "\n".join(rows)

    # ── Specific crime type query ─────────────────────────────────────
    for ct, cnt in type_count.most_common():
        if ct in q or ct.replace("_", " ") in q:
            ct_cases = [c for c in cases if c["type"] == ct]
            ct_open  = sum(1 for c in ct_cases if c["status"] == "open")
            ct_wards = Counter(c["ward"] for c in ct_cases if c["ward"] != "Unknown")
            top_ward = ct_wards.most_common(1)[0][0] if ct_wards else "Unknown"
            return (
                f"**{ct.replace('_',' ').title()}** — {cnt} cases total\n"
                f"• Open: {ct_open}\n"
                f"• Arrested: {sum(1 for c in ct_cases if c['status']=='arrested')}\n"
                f"• Most affected area: **{top_ward}** ({ct_wards.get(top_ward,0)} cases)"
            )

    # ── Default useful summary ────────────────────────────────────────
    top_crime = type_count.most_common(1)[0][0].replace("_", " ")
    top_area  = ward_count.most_common(1)[0][0] if ward_count else "N/A"
    return (
        f"**{total} cases** in dataset — {open_n} open, "
        f"{arrested_n} arrested, {charged_n} chargesheeted.\n"
        f"Most common crime: **{top_crime}** | "
        f"Highest crime area: **{top_area}**\n\n"
        "You can ask: crime type breakdown, ward hotspots, "
        "arrest status, recent cases, or about a specific crime type."
    )


def smart_case_analyser(question: str, context: str) -> str:
    q = question.lower().strip()
    if "CASE FILE DATA" in context:
        return _single_case_answer(q, context)
    if "CASES DATA" in context:
        return _all_cases_answer(q, context)
    return "No case data available to answer this question."
