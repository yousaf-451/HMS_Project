"""Generates CSV / Markdown / HTML board / JSON from sprint_data.py.  Run: python build_sprint_artifacts.py"""
import csv, json, html, os
from collections import defaultdict
import sprint_data as S

HERE = os.path.dirname(os.path.abspath(__file__))
sm = S.story_map()
fmt = lambda d: d.strftime("%d %b %Y") if d else ""
iso = lambda d: d.isoformat() if d else ""
name = lambda k: S.TEAM[k][0]
total_h, burn = S.burndown()
done_h = sum(t[4] for t in S.TASKS if t[10] == "Done")
sprint_pts = sum(p[4] for p in S.PRODUCT_BACKLOG if p[5])
n_days = (S.SPRINT_END - S.SPRINT_START).days + 1

# ---- CSVs (headers chosen to map easily to Jira / Trello / GitHub Projects imports) ----
with open(os.path.join(HERE, "product_backlog.csv"), "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["Backlog ID", "Priority Rank", "User Story", "MoSCoW", "Story Points", "In Sprint 1", "Acceptance Criteria"])
    for pid, story, rank, moscow, pts, ins in sorted(S.PRODUCT_BACKLOG, key=lambda p: p[2]):
        w.writerow([pid, rank, story, moscow, pts, "Yes" if ins else "No", " | ".join(S.ACCEPTANCE.get(pid, []))])

with open(os.path.join(HERE, "sprint_backlog_tasks.csv"), "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["Task ID", "Summary", "Parent Story", "Assignee", "Estimate (hours)", "Priority", "Depends On",
                "Start Date", "Due Date", "Completed Date", "Status", "Sprint"])
    for t in S.TASKS:
        w.writerow([t[0], t[2], t[1], name(t[3]), t[4], t[5], t[6], iso(t[7]), iso(t[8]), iso(t[9]), t[10], S.SPRINT_NAME])

# ---- JSON for slides ----
by_owner = defaultdict(list)
for t in S.TASKS: by_owner[t[3]].append(t)
payload = {
    "project": S.PROJECT, "sprint": S.SPRINT_NAME, "start": fmt(S.SPRINT_START), "end": fmt(S.SPRINT_END),
    "snapshot": fmt(S.SNAPSHOT), "review": fmt(S.REVIEW_DATE), "retro": fmt(S.RETRO_DATE), "goal": S.SPRINT_GOAL,
    "link": S.WORKSPACE_LINK, "objectives": S.OBJECTIVES, "modules": S.MODULES, "dod": S.DEFINITION_OF_DONE,
    "team": {k: dict(name=v[0], role=v[1], resp=v[2], focus=v[3],
                     hours=sum(t[4] for t in by_owner[k]),
                     done=sum(1 for t in by_owner[k] if t[10] == "Done"),
                     done_hours=sum(t[4] for t in by_owner[k] if t[10] == "Done"),
                     tasks=len(by_owner[k])) for k, v in S.TEAM.items()},
    "backlog": [dict(id=p[0], story=p[1], rank=p[2], moscow=p[3], pts=p[4], inSprint=p[5]) for p in sorted(S.PRODUCT_BACKLOG, key=lambda p: p[2])],
    "acceptance": S.ACCEPTANCE,
    "tasks": [dict(id=t[0], story=t[1], title=t[2], owner=t[3], hours=t[4], prio=t[5], deps=t[6], start=fmt(t[7]), due=fmt(t[8]),
                   startIso=iso(t[7]), dueIso=iso(t[8]), done=fmt(t[9]), status=t[10]) for t in S.TASKS],
    "risks": [dict(risk=r[0], prob=r[1], impact=r[2], plan=r[3], owner=r[4]) for r in S.RISKS],
    "increment": S.INCREMENT, "demo": S.DEMO_ORDER,
    "burndown": [dict(day=d.strftime("%d %b"), ideal=i, actual=a) for d, i, a in burn],
    "totals": dict(hours=total_h, doneHours=done_h, tasks=len(S.TASKS), doneTasks=sum(1 for t in S.TASKS if t[10]=="Done"),
                   points=sprint_pts, stories=sum(1 for p in S.PRODUCT_BACKLOG if p[5]), days=n_days),
}
with open(os.path.join(HERE, "sprint_data.json"), "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=1)

# ---- Markdown plan ----
L = []
a = L.append
cnt = {c: sum(1 for t in S.TASKS if t[10] == c) for c in S.COLUMNS}
a(f"# {S.PROJECT}\n## {S.SPRINT_NAME} Planning Document\n")
a("**Course activity:** Agile/Scrum - Sprint Planning and Task Allocation  \n"
  f"**Sprint:** {fmt(S.SPRINT_START)} to {fmt(S.SPRINT_END)} ({n_days} days)  \n"
  f"**Board snapshot:** {fmt(S.SNAPSHOT)}  \n**Workspace link:** {S.WORKSPACE_LINK}\n")
a("> Files in this folder: `Sprint_Planning_Presentation.pptx` (slides), `scrum_board.html` (open in a browser), "
  "`product_backlog.csv` and `sprint_backlog_tasks.csv` (import into Jira / Trello / GitHub Projects), "
  "`WORKSPACE_SETUP.md` (import steps). Everything is generated from `sprint_data.py`.\n")
a("---\n## 1. Project overview\n")
a("HMS is a web-based Hospital Management System: **browser (HMS/) -> Python server (server.py) -> SQLite database (HMS_DB/hms.db)**.\n")
a("**Objectives**\n"); [a(f"- {o}") for o in S.OBJECTIVES]
a("\n**Major functional modules**\n\n| Module | What it does |\n|---|---|"); [a(f"| {m} | {d} |") for m, d in S.MODULES]
a("\n---\n## 2. Scrum team\n\n| Member | Scrum role | Focus area | Responsibilities |\n|---|---|---|---|")
for k, v in S.TEAM.items(): a(f"| {v[0]} | {v[1]} | {v[3]} | {v[2]} |")
a("\n**Scrum events:** Sprint Planning (19 Oct), Daily Scrum 15 min at 10:00, "
  f"Sprint Review ({fmt(S.REVIEW_DATE)}), Retrospective ({fmt(S.RETRO_DATE)}).\n")
a("---\n## 3. Product Backlog (prioritised)\n\n| Rank | ID | User story | MoSCoW | Points | In Sprint 1 |\n|---|---|---|---|---|---|")
for p in sorted(S.PRODUCT_BACKLOG, key=lambda p: p[2]): a(f"| {p[2]} | {p[0]} | {p[1]} | {p[3]} | {p[4]} | {'Yes' if p[5] else 'No'} |")
a(f"\nPriority rule: dependencies first (database), then MUST items users cannot work without, then SHOULD and COULD. Sprint 1 takes {sprint_pts} story points.\n")
a("---\n## 4. Sprint Goal and duration\n")
a(f"**Sprint Goal:** {S.SPRINT_GOAL}\n")
a(f"- **Duration:** {n_days} days, {fmt(S.SPRINT_START)} - {fmt(S.SPRINT_END)}\n- **Capacity:** 5 members x about 35 hours = about 175 hours; committed {total_h} hours ({len(S.TASKS)} tasks, {sprint_pts} story points)\n- **Sprint Review / Retrospective:** {fmt(S.REVIEW_DATE)} / {fmt(S.RETRO_DATE)}\n")
a("**Definition of Done**\n"); [a(f"- {x}") for x in S.DEFINITION_OF_DONE]
a("\n---\n## 5. Sprint Backlog (stories with acceptance criteria)\n")
for p in sorted(S.PRODUCT_BACKLOG, key=lambda p: p[2]):
    if not p[5]: continue
    a(f"### {p[0]} ({p[4]} pts, {p[3]})\n{p[1]}\n\n**Acceptance criteria**"); [a(f"- {c}") for c in S.ACCEPTANCE[p[0]]]
    a("\n**Tasks:** " + ", ".join(f"{t[0]} ({t[3]})" for t in S.TASKS if t[1] == p[0]) + "\n")
a("---\n## 6. Task breakdown and allocation\n")
a("Each story is cut into tasks of 2-7 hours so one person can finish a task in a day or two. Each member owns one area, so work does not collide.\n")
a("| Member | Area | Tasks | Hours | Done tasks |\n|---|---|---|---|---|")
for k, v in S.TEAM.items(): a(f"| {v[0]} | {v[3]} | {len(by_owner[k])} | {sum(t[4] for t in by_owner[k])} | {sum(1 for t in by_owner[k] if t[10]=='Done')} |")
for k, v in S.TEAM.items():
    a(f"\n**{v[0]}** ({v[1]})\n\n| Task | Story | Description | Hours | Status |\n|---|---|---|---|---|")
    for t in by_owner[k]: a(f"| {t[0]} | {t[1]} | {t[2]} | {t[4]} | {t[10]} |")
a("\n---\n## 7. Task estimation and scheduling\n")
a("Estimates are in hours (task level) and story points (story level). Priorities: High = blocks others or a Must story; Medium = Should; Low = Could.\n")
a("| Task | Priority | Hours | Depends on | Start | Due | Completed | Status |\n|---|---|---|---|---|---|---|---|")
for t in S.TASKS: a(f"| {t[0]} | {t[5]} | {t[4]} | {t[6] or '-'} | {fmt(t[7])} | {fmt(t[8])} | {fmt(t[9]) or '-'} | {t[10]} |")
a("\n**Critical path:** T-01 schema -> T-04 server/login -> module tasks -> T-47 browser self-test -> T-48 final regression run.\n")
a("**Burndown (hours remaining)**\n\n| Day | Ideal | Actual |\n|---|---|---|")
for d, i, ac in burn: a(f"| {d.strftime('%d %b')} | {i} | {'' if ac is None else ac} |")
a(f"\n---\n## 8. Scrum Board (snapshot {fmt(S.SNAPSHOT)})\n")
a("| " + " | ".join(f"{c} ({cnt[c]})" for c in S.COLUMNS) + " |\n|" + "---|" * 4)
rows = max(cnt.values())
cols = {c: [f"{t[0]} {t[2][:42]}... ({S.TEAM[t[3]][0].split()[-1]})" for t in S.TASKS if t[10] == c] for c in S.COLUMNS}
for i in range(rows): a("| " + " | ".join(cols[c][i] if i < len(cols[c]) else "" for c in S.COLUMNS) + " |")
a(f"\nSee `scrum_board.html` for the full visual board. Progress: {done_h} of {total_h} hours done ({round(100*done_h/total_h)}%).\n")
a("---\n## 9. Expected Sprint Increment\n"); [a(f"- {x}") for x in S.INCREMENT]
a(f"\nDemonstration: Sprint Review on {fmt(S.REVIEW_DATE)}, following `HMS/PRESENTATION_GUIDE.md`.\n")
a("---\n## 10. Risks and challenges\n\n| Risk | Likelihood | Impact | Mitigation | Owner |\n|---|---|---|---|---|")
for r in S.RISKS: a(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |")
a("\n---\n## Who presents what\n\n| Slides | Topic | Presenter |\n|---|---|---|"); [a(f"| {x[0]} | {x[1]} | {x[2]} |") for x in S.DEMO_ORDER]
with open(os.path.join(HERE, "SPRINT_PLANNING.md"), "w", encoding="utf-8") as f: f.write("\n".join(L) + "\n")

# ---- Scrum board HTML ----
E = html.escape
colors = {"AB": "#0f766e", "UQ": "#7c3aed", "TA": "#c2410c", "WA": "#1d4ed8", "MY": "#be185d"}
cards = {c: [] for c in S.COLUMNS}
for t in S.TASKS:
    k = t[3]
    cards[t[10]].append(f'<div class="card" data-owner="{k}"><div class="top"><b>{t[0]}</b><span class="story">{E(t[1])}</span>'
        f'<span class="pr {t[5]}">{t[5]}</span></div><div class="title">{E(t[2])}</div>'
        f'<div class="meta"><span class="who" style="background:{colors[k]}">{E(S.TEAM[k][0].split()[-1] if k!="AB" else "Abdullah")}</span>'
        f'<span>{t[4]} h</span><span>Due {t[8].strftime("%d %b")}</span>{"<span>Deps: "+E(t[6])+"</span>" if t[6] else ""}</div></div>')
colhtml = "".join(f'<section class="col"><h2>{c} <small id="n-{i}">{len(cards[c])}</small></h2>{"".join(cards[c])}</section>' for i, c in enumerate(S.COLUMNS))
chips = '<button class="chip on" data-f="ALL">All</button>' + "".join(
    f'<button class="chip" data-f="{k}" style="--c:{colors[k]}">{E(v[0])}</button>' for k, v in S.TEAM.items())
# burndown svg
W, H, pl, pb, pt, pr_ = 640, 260, 50, 36, 16, 16
mx = total_h
px = lambda i: pl + i * (W - pl - pr_) / (len(burn) - 1)
py = lambda v: pt + (H - pt - pb) * (1 - v / mx)
ideal = " ".join(f"{px(i):.1f},{py(b[1]):.1f}" for i, b in enumerate(burn))
act = " ".join(f"{px(i):.1f},{py(b[2]):.1f}" for i, b in enumerate(burn) if b[2] is not None)
grid = "".join(f'<line x1="{pl}" x2="{W-pr_}" y1="{py(v):.1f}" y2="{py(v):.1f}" stroke="#e2e8f0"/><text x="{pl-6}" y="{py(v)+4:.1f}" text-anchor="end" font-size="11" fill="#64748b">{v}</text>' for v in range(0, int(mx)+1, 40))
xl = "".join(f'<text x="{px(i):.1f}" y="{H-pb+16}" text-anchor="middle" font-size="10" fill="#64748b">{b[0].day}</text>' for i, b in enumerate(burn) if i % 2 == 0)
team_rows = "".join(f'<tr><td>{E(v[0])}</td><td>{E(v[1])}</td><td>{sum(t[4] for t in by_owner[k])} h</td><td>{sum(1 for t in by_owner[k] if t[10]=="Done")} / {len(by_owner[k])}</td></tr>' for k, v in S.TEAM.items())
page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HMS {S.SPRINT_NAME} - Scrum Board</title><style>
:root{{--bg:#f1f5f9;--card:#fff;--ink:#0f172a;--mut:#64748b;--line:#e2e8f0}}
@media (prefers-color-scheme:dark){{:root{{--bg:#0b1220;--card:#162033;--ink:#e5edf7;--mut:#94a3b8;--line:#26334a}}}}
*{{box-sizing:border-box}}body{{margin:0;font-family:Calibri,Arial,sans-serif;background:var(--bg);color:var(--ink)}}
header{{padding:20px 24px;background:#0f766e;color:#fff}}header h1{{margin:0 0 4px;font-size:22px}}header p{{margin:2px 0;opacity:.95;font-size:14px}}
.wrap{{padding:18px 24px;max-width:1500px;margin:auto}}.stats{{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 16px}}.stat b{{font-size:22px;display:block}}.stat span{{color:var(--mut);font-size:12px}}
.chips{{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}}.chip{{border:1px solid var(--line);background:var(--card);color:var(--ink);padding:6px 12px;border-radius:999px;cursor:pointer;font-size:13px}}
.chip.on{{background:var(--c,#0f172a);color:#fff;border-color:transparent}}
.board{{display:grid;grid-template-columns:repeat(4,minmax(240px,1fr));gap:12px;align-items:start;overflow-x:auto}}
.col{{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:10px;min-height:120px}}.col h2{{font-size:14px;margin:2px 4px 10px;text-transform:uppercase;letter-spacing:.04em}}
.col h2 small{{background:var(--line);padding:1px 8px;border-radius:999px;margin-left:6px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px}}
.top{{display:flex;gap:6px;align-items:center;font-size:12px}}.story{{color:var(--mut)}}.pr{{margin-left:auto;font-size:11px;padding:1px 7px;border-radius:6px}}
.pr.High{{background:#fee2e2;color:#991b1b}}.pr.Medium{{background:#fef3c7;color:#92400e}}.pr.Low{{background:#dcfce7;color:#166534}}
.title{{margin:6px 0;font-size:14px;line-height:1.3}}.meta{{display:flex;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--mut);align-items:center}}
.who{{color:#fff;padding:1px 8px;border-radius:999px}}.grid2{{display:grid;grid-template-columns:minmax(300px,640px) 1fr;gap:16px;margin-top:18px}}
.box{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;overflow-x:auto}}.box h3{{margin:0 0 8px}}
table{{border-collapse:collapse;width:100%;font-size:13px}}td,th{{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}}
@media(max-width:900px){{.grid2{{grid-template-columns:1fr}}}}
</style></head><body>
<header><h1>HMS - {S.SPRINT_NAME} Scrum Board</h1><p><b>Sprint Goal:</b> {E(S.SPRINT_GOAL)}</p>
<p>{fmt(S.SPRINT_START)} - {fmt(S.SPRINT_END)} | Snapshot {fmt(S.SNAPSHOT)} | Workspace: {E(S.WORKSPACE_LINK)}</p></header>
<div class="wrap"><div class="stats">
<div class="stat"><b>{sum(1 for t in S.TASKS if t[10]=="Done")}/{len(S.TASKS)}</b><span>tasks done</span></div>
<div class="stat"><b>{done_h}/{total_h} h</b><span>hours done ({round(100*done_h/total_h)}%)</span></div>
<div class="stat"><b>{sprint_pts}</b><span>story points committed</span></div>
<div class="stat"><b>{len([p for p in S.PRODUCT_BACKLOG if p[5]])}</b><span>user stories in sprint</span></div></div>
<div class="chips">{chips}</div><div class="board">{colhtml}</div>
<div class="grid2"><div class="box"><h3>Burndown (hours remaining)</h3>
<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Burndown chart">{grid}{xl}
<polyline points="{ideal}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4"/>
<polyline points="{act}" fill="none" stroke="#0f766e" stroke-width="3"/>
<text x="{pl+8}" y="{pt+12}" font-size="12" fill="#94a3b8">- - ideal</text><text x="{pl+70}" y="{pt+12}" font-size="12" fill="#0f766e">&#9473; actual</text></svg></div>
<div class="box"><h3>Team and workload</h3><table><tr><th>Member</th><th>Role</th><th>Committed</th><th>Done</th></tr>{team_rows}</table></div></div></div>
<script>
var chips=document.querySelectorAll('.chip');
chips.forEach(function(b){{b.onclick=function(){{chips.forEach(function(c){{c.classList.remove('on')}});b.classList.add('on');var f=b.dataset.f;
document.querySelectorAll('.card').forEach(function(c){{c.style.display=(f==='ALL'||c.dataset.owner===f)?'':'none'}});
document.querySelectorAll('.col').forEach(function(col,i){{document.getElementById('n-'+i).textContent=col.querySelectorAll('.card:not([style*="none"])').length}});}}}});
</script></body></html>"""
with open(os.path.join(HERE, "scrum_board.html"), "w", encoding="utf-8") as f: f.write(page)
print("built", total_h, done_h, cnt)
