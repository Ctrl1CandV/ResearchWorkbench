#!/bin/sh
# update-deploy-branch.sh —— 从当前 main HEAD 重新派生 deploy 分支（服务器部署精简分支）。
#
# deploy 分支约定：目录树 = main 去掉 docs/ 与 tests/ 的追踪，另在分支内 .gitignore
# 追加 docs/ tests/ 两条目（仅存在于 deploy，勿回移 main）。每次 main 有新的部署提交后
# 重新运行本脚本，deploy 始终是「main 减 docs/tests」的单提交分支，永不积累合并历史。
#
# 安全性：只操作临时索引与对象库，不切换分支、不动工作树文件——docs/ tests/ 的本地
# 文件（含其他任务正在写的文档）保持原样。
#
# 用法（在 main 工作树、HEAD 已是要部署的提交时）：
#   sh scripts/update-deploy-branch.sh
# 然后推送（deploy 为重建分支，需强推；main 正常推送）：
#   git push origin main
#   git push --force-with-lease=deploy origin deploy
# 服务器端更新（shallow clone）：
#   cd /root/apps/ResearchWorkbench
#   git fetch --depth 1 origin deploy && git reset --hard FETCH_HEAD
#   systemctl restart workbench
set -eu

BASE=$(git rev-parse HEAD)
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "main" ]; then
  echo "请在 main 分支上运行（当前：${CURRENT:-未知}）" >&2
  exit 1
fi

GITDIR=$(git rev-parse --git-dir)
IDX="$GITDIR/deploy-index-tmp"
GI="$GITDIR/deploy-gitignore-tmp"
trap 'rm -f "$IDX" "$GI"' EXIT
rm -f "$IDX" "$GI"

export GIT_INDEX_FILE="$IDX"
git read-tree "$BASE"
# 只从临时索引移除追踪；--cached 保证任何情况下都不碰磁盘文件。
git rm -r -q --cached docs tests
git cat-file blob "$BASE:.gitignore" > "$GI"
printf '\n# deploy 分支专用：docs/tests 不入部署树（勿回移 main）\ndocs/\ntests/\n' >> "$GI"
GISHA=$(git hash-object -w "$GI")
git update-index --cacheinfo 100644,"$GISHA",.gitignore
TREE=$(git write-tree)

CMT=$(git commit-tree "$TREE" -p "$BASE" -m "deploy: 服务器部署精简分支（update-deploy-branch.sh 自动派生自 main $BASE）

deploy 分支约定：目录树 = main 去掉 docs/ 与 tests/ 追踪；private/、.grad/ 一直不入库。
每次 main 有新部署提交后在 main 上重新运行 scripts/update-deploy-branch.sh 派生，
然后强推 deploy；服务器端 git fetch --depth 1 origin deploy 后 reset --hard 更新。")
git branch -f deploy "$CMT"

echo "deploy 已重新派生：$CMT（基于 main $BASE）"
echo "自检：git diff --stat main deploy   # 应只含 docs/ tests/ 删除与 .gitignore 追加"
