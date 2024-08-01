#!/bin/bash

# 最新のタグを取得
latest_tag=$(git describe --tags --abbrev=0)

# タグが存在しない場合は初期値を設定
if [ -z "$latest_tag" ]; then
    latest_tag="v0.0.0"
fi

# バージョン番号を分解
IFS='.' read -ra version_parts <<< "${latest_tag#v}"
major=${version_parts[0]}
minor=${version_parts[1]}
patch=${version_parts[2]}

# マイナーバージョンを増やす
new_minor=$((minor + 1))

# 新しいタグを作成
new_tag="v$major.$new_minor.0"

# 最後のコミットにタグを付ける
git tag -a "$new_tag" -m "Automatically tagged version $new_tag"

echo "新しいタグ $new_tag が作成され、最新のコミットに適用されました。"

# リモートリポジトリにタグをプッシュ
git push origin "$new_tag"

echo "新しいタグ $new_tag がリモートリポジトリにプッシュされました。"