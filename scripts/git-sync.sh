#!/bin/zsh
# 微网管理端 - 定期 git 同步脚本
# 用法: ./scripts/git-sync.sh [--check]
# --check: 只检查状态，不提交不推送

# 绕开 WorkBuddy 沙箱注入（npm 同款问题），保留代理配置
unset NODE_OPTIONS

REPO_DIR="/Users/xueyili/WorkBuddy/2026-09-03-14-10-37/microgrid-ems"
cd "$REPO_DIR" || exit 1

export GIT_AUTHOR_NAME="ml0716xx"
export GIT_AUTHOR_EMAIL="ml0716xx@users.noreply.github.com"
export GIT_COMMITTER_NAME="ml0716xx"
export GIT_COMMITTER_EMAIL="ml0716xx@users.noreply.github.com"

# 代理环境（沙箱会话外由 automation 运行时继承，此处兜底）
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:65455}"
export HTTP_PROXY="${HTTP_PROXY:-http://127.0.0.1:65455}"

# SSH 远程（走 ssh.github.com:443，见 ~/.ssh/config）
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"

if [ "$1" = "--check" ]; then
  echo "[git-sync] status check"
  git status --short
  git log --oneline -3
  exit 0
fi

echo "[git-sync] $(date '+%F %T') starting"

# 1. 拉取远端（codeload 拉的代码没有远端历史，先 fetch 对齐）
git fetch origin main --quiet 2>/dev/null
if [ $? -eq 0 ] && git rev-parse origin/main >/dev/null 2>&1; then
  # 本地领先且有共同历史时用 rebase 对齐
  git rebase origin/main --quiet 2>/dev/null || echo "[git-sync] rebase skipped (no common history or conflict)"
fi

# 2. 有变更才提交
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  MSG="auto-sync: $(date '+%F %H:%M') 更新"
  git commit -m "$MSG" --quiet
  echo "[git-sync] committed: $MSG"
else
  echo "[git-sync] nothing to commit"
fi

# 3. 推送（凭证就位后自动生效）
if git push origin main 2>&1; then
  echo "[git-sync] pushed to origin/main"
else
  echo "[git-sync] PUSH FAILED - check credentials (run: gh auth login or set PAT)"
  exit 2
fi
