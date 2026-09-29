# Using this repository with GitHub Desktop

A step-by-step guide for developers who know Git concepts but have not used
GitHub Desktop before. The app is just a GUI over `git`, so nothing here
changes how Git works — it only changes where you click.

---

## 1. Install and sign in

1. Download GitHub Desktop from <https://desktop.github.com> and install it.
2. On first launch, choose **Sign in to GitHub.com** and complete the browser
   login. Use the same account that owns the repository (`Shine0078` in this
   project).
3. In **File → Options → Git**, confirm your name and email. This identity is
   attached to commits you create here.

---

## 2. Add the project to GitHub Desktop

If you already have the folder locally (it has a hidden `.git` directory):

1. **File → Add local repository…**
2. **Repository path** → select the `barcode-studio` folder.
3. Click **Add repository**. If Desktop says it is not a Git repository, you
   picked the wrong folder — choose the one containing `package.json`.

If you are starting from the GitHub website instead:

1. **File → Clone repository…**
2. Pick the repository from the list (or paste its URL) and choose a local path.
3. Click **Clone**.

You now have the repository selected in the left sidebar with its current
branch shown at the top.

---

## 3. Read the history (see the commits)

1. Click the **History** tab in the main pane.
2. Every commit is a row: summary, author and time. The full 100+ commit
   history of this project is here.
3. Click a commit to see **what changed** on the right — file list and a
   coloured diff. This is the fastest way to review the project's development.
4. Use the **branch selector** (top bar) to view a different branch's history.

Right-click a commit for actions such as *Copy commit SHA* or *Create branch
from commit*.

---

## 4. Make a change (the normal loop)

1. Open the repository in an editor from Desktop: **Repository → Open in
   Visual Studio Code** (or use your own editor).
2. Edit files and save.
3. Return to Desktop. The **Changes** tab lists modified files with checkboxes.
   - Leave a file unchecked to keep it out of the commit (it stays modified).
   - Right-click a file to **Discard changes** (throws the edit away — careful).
   - Expand a file to review or stage individual lines.
4. Write a commit message in the **Summary** box, following the project's
   Conventional Commits style, e.g.
   `feat(print): add A5 landscape preset`.
   Add detail in the **Description** box if useful.
5. Click **Commit to <branch>**.
6. Click **Push origin** (top bar) to send commits to GitHub.

> Tip: run `npm run lint && npm test` in a terminal before committing. Desktop
> has **Repository → Open in Command Prompt / Terminal** for this.

---

## 5. Branches

- **Create:** Branch menu → **New branch…** → name it `feat/<topic>`, based on
  `main`.
- **Switch:** click the **Current branch** button and pick another branch.
  Desktop stashes nothing — commit or discard your edits before switching.
- **Publish:** the first push of a new branch shows **Publish branch** instead
  of *Push origin*.
- **Delete:** Branch menu → **Delete…** after it has been merged.

### Recommended flow for a feature

1. **Branch → New branch** `feat/my-change` from `main`.
2. Edit, commit (several small commits are better than one big one).
3. **Publish branch** → **Create Pull Request** (Desktop opens the browser).
4. On GitHub, review the diff, then **Merge pull request**.
5. Back in Desktop: switch to `main`, click **Fetch origin**, then **Pull
   origin** to get the merge.
6. Delete the feature branch locally.

---

## 6. Keeping up to date

- **Fetch origin** — check for new commits on GitHub without changing files.
- **Pull origin** — download and merge them into your local branch.
- If the button says **Pull origin** with a count, you have incoming commits.

---

## 7. Resolving conflicts (short version)

1. Desktop warns there are conflicts and lists the files.
2. Open the files; Git marks the conflicting regions with `<<<<<<<`, `=======`,
   `>>>>>>>`.
3. Edit to keep the correct result and delete the markers.
4. Save, return to Desktop, and commit the resolution.

When in doubt, ask before force-pushing. Never force-push `main`.

---

## 8. Useful extras

- **Repository → Repository settings** → **Ignored files** edits `.gitignore`
  from the UI.
- **History → right-click a commit → Revert changes in commit** creates a new
  commit that undoes it (safe; it does not rewrite history).
- **Ctrl/Cmd + Z** in the Changes list discards the last change to the commit
  message, not to files — do not rely on it to undo edits.
- Tags and releases are easiest from the GitHub website: **Releases → Draft a
  new release**, tagging `main` (e.g. `v1.0.0`).

---

## 9. Common questions

**"Is my code on GitHub?"**
Only after you **Push origin** / **Publish branch**. Committing is local.

**"Where do the 100+ commits come from?"**
They are the project's development history. Open the **History** tab to browse
them; each commit message explains one change.

**"Can I see the history without Desktop?"**
Yes — `git log --oneline --graph --decorate`, or the **Commits** page of the
repository on GitHub.

**"Which branch should I work on?"**
Never commit directly to `main` for anything non-trivial; create a branch, open
a pull request, then merge.
