# Setting up the Scrum workspace (Jira / GitHub Projects / Trello / ClickUp)

The activity requires a **live project workspace** with a link for review. This folder gives you ready-made data to fill it in minutes.

| File | Use |
|---|---|
| `product_backlog.csv` | 22 user stories, ranked, with MoSCoW, points, acceptance criteria |
| `sprint_backlog_tasks.csv` | 44 tasks with assignee, hours, dependencies, dates, status |
| `scrum_board.html` | Offline copy of the board (open in a browser) as a backup for the presentation |

## Option A: GitHub Projects (free, quickest)
1. Create a repository, then **Projects > New project > Board**.
2. Add a single-select field **Status** with: To Do, In Progress, In Review, Done.
3. Add number field **Hours**, date fields **Start**, **Due**, text field **Story**, and an **Iteration** field named "Sprint 1" (14 days from 19 Oct 2026).
4. Create the 44 tasks as issues (or draft items) from `sprint_backlog_tasks.csv`; assign the members, set the fields, and place each card in its Status column.
5. Add every teammate as a collaborator; copy the project URL.

## Option B: Jira (Scrum template)
1. **Create project > Scrum**. Settings > Issues > rename statuses to match the board (To Do, In Progress, In Review, Done).
2. **Project settings > Import issues from CSV**: upload `product_backlog.csv` first (map *User Story* to Summary, *Story Points* to Story point estimate, *Acceptance Criteria* to Description), then `sprint_backlog_tasks.csv` (map *Summary*, *Assignee*, *Estimate (hours)* to Original estimate, *Parent Story* to Parent/Epic link).
3. **Backlog > Create sprint** "Sprint 1", dates 19 Oct - 1 Nov 2026, goal = text in `SPRINT_PLANNING.md` section 4, then **Start sprint**.
4. Invite the team and copy the board URL.

## Option C: Trello
Create lists To Do / In Progress / In Review / Done. Use **Import CSV** (Power-Up such as "Import CSV to Trello") or paste the cards; add a label per member.

## Before the presentation
- Paste the workspace link into `WORKSPACE_LINK` in `sprint_data.py`, run `python build_sprint_artifacts.py`, and rebuild the slides (or just type the link on slide 12).
- Make sure every card's status in the tool matches the real status of the work (the statuses in these files are a snapshot dated 25 Oct 2026; edit `sprint_data.py` if reality differs).
- Show the **tool**, not the slides, for slides 3 - 8, as the activity asks.
