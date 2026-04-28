---
name: "git-mcp-server"
description: "Git version control MCP server. Invoke when user needs to commit, push, pull, merge branches, or manage GitHub repositories."
---

# Git / GitHub MCP Server

Git version control skill for M-A System enterprise management platform.

## Configuration

```json
{
  "git": {
    "command": "npx",
    "args": ["-y", "git-mcp-server@latest"],
    "env": {
      "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

## Git Configuration

```bash
git config --global user.name "fujinqing"
git config --global user.email "fjinqing@163.com"
```

## Common Operations

### Repository Operations
```bash
git init                    # Initialize repository
git clone <url>            # Clone repository
git remote add origin <url> # Add remote
git fetch                  # Fetch updates
git pull                   # Pull changes
git push                   # Push changes
```

### Branch Operations
```bash
git branch                  # List branches
git branch -a               # List all branches
git checkout -b <branch>    # Create and switch
git checkout <branch>      # Switch branch
git merge <branch>         # Merge branch
git rebase <branch>        # Rebase branch
```

### Commit Operations
```bash
git add .                  # Stage all changes
git commit -m "message"    # Commit with message
git commit -am "message"   # Add and commit tracked files
git reset --soft HEAD~1    # Undo last commit
git revert <hash>          # Create revert commit
```

### Status & History
```bash
git status                 # Show working status
git log --oneline         # Show commit history
git log -n 5             # Show last 5 commits
git diff                  # Show unstaged changes
git diff --staged         # Show staged changes
```

### GitHub Specific
```bash
git push -u origin <branch>  # Push with upstream
git push --force           # Force push (use carefully)
git pull --rebase         # Pull with rebase
```

## GitHub Operations

| Operation | Command |
|-----------|---------|
| Create PR | gh pr create |
| List PRs | gh pr list |
| Merge PR | gh pr merge |
| Create Issue | gh issue create |
| List Releases | gh release list |

## Usage

Invoke this skill when:
- User asks to commit code
- User needs to create/merge branches
- User wants to push to GitHub
- User needs GitHub operations (PR, issues)