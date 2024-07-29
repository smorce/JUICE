#!/bin/bash

# エラーが発生した場合にスクリプトを停止
set -e

# 各ステップの開始を表示する関数
echo_step() {
    echo "==== $1 ===="
}

# 現在のブランチを確認
echo_step "Checking current branch"
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"

# developブランチに切り替えて最新に更新
echo_step "Switching to develop branch and updating"
git checkout develop
git pull origin develop

# 最終的なステータスを表示
echo_step "Final status"
git status

echo "Successfully switched to develop branch and updated."