#!/bin/bash

# エラーが発生した場合にスクリプトを停止
set -e

# 各ステップの開始を表示する関数
echo_step() {
    echo "==== $1 ===="
}

# mainブランチに切り替えて最新に更新
echo_step "Updating main branch"
git checkout main
git pull origin main

# developブランチに切り替えて最新に更新
echo_step "Updating develop branch"
git checkout develop
git pull origin develop

# mainブランチにdevelopをマージ
echo_step "Merging develop into main"
git checkout main
git merge develop

# 変更をステージングに追加
echo_step "Staging changes"
git add .

# マージコミットを作成
echo_step "Creating merge commit"
git commit -m "Merge develop into main"

# 変更をリモートにプッシュ
echo_step "Pushing changes to remote"
git push origin main

# 最終的なステータスを表示
echo_step "Final status"
git status

echo "Merge process completed successfully."