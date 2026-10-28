import sqlite3, subprocess
schema = open("schema.sql").read().replace("INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
db = sqlite3.connect(":memory:"); db.executescript(schema)
tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
color = {"users":"#e2e8f0","audit_log":"#e2e8f0","notifications":"#e2e8f0","notification_reads":"#e2e8f0",
 "departments":"#dbeafe","doctors":"#dbeafe","doctor_schedules":"#dbeafe","patients":"#ccfbf1","appointments":"#fef3c7",
 "medical_records":"#fce7f3","prescriptions":"#fce7f3","invoices":"#dcfce7","invoice_items":"#dcfce7",
 "medicine_categories":"#ede9fe","medicines":"#ede9fe","dispensing":"#ede9fe"}
dot = ['digraph ER { rankdir=LR; splines=true; nodesep=0.35; ranksep=1.1; fontname="Helvetica";',
       'node [shape=plain fontname="Helvetica" fontsize=10]; edge [fontname="Helvetica" fontsize=8 color="#475569"];']
edges = []
for t in tables:
    cols = db.execute(f"PRAGMA table_info({t})").fetchall()
    fks = {r[3]: (r[2], r[6]) for r in db.execute(f"PRAGMA foreign_key_list({t})")}
    rows = ""
    for _, name, typ, notnull, _, pk in cols:
        tag = ("PK " if pk else "") + ("FK " if name in fks else "")
        uniq = ""
        rows += f'<TR><TD ALIGN="LEFT">{("<B>"+tag.strip()+"</B>") if tag.strip() else " "}</TD><TD ALIGN="LEFT">{name}</TD><TD ALIGN="LEFT"><FONT COLOR="#64748b">{typ}{"" if notnull or pk else " (null)"}</FONT></TD></TR>'
    dot.append(f'"{t}" [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="3" BGCOLOR="white">'
               f'<TR><TD COLSPAN="3" BGCOLOR="{color[t]}"><B>{t}</B></TD></TR>{rows}</TABLE>>];')
    for col, (parent, ondel) in fks.items():
        nullable = not [c for c in cols if c[1] == col][0][3]
        tail = "crowodot" if nullable else "crow"
        edges.append(f'"{t}" -> "{parent}" [dir=both arrowtail={tail} arrowhead=tee label="{col}"];')
dot += edges + ["}"]
open("er_diagram.dot", "w").write("\n".join(dot))
for fmt in ("png", "svg"):
    subprocess.run(["dot", f"-T{fmt}", "-Gdpi=130", "er_diagram.dot", "-o", f"er_diagram.{fmt}"], check=True)
print(len(tables), "tables,", len(edges), "relationships")
