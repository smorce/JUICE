#!/bin/bash

# 最後から2番目のコミットハッシュを取得
SECOND_LAST_COMMIT=$(git rev-parse HEAD~1)

# 最後から2番目のコミットにv0.0.0タグを付ける
git tag -a v0.0.0 $SECOND_LAST_COMMIT -m "Initial version"

# 最新のコミットにv0.1.0タグを付ける
git tag -a v0.1.0 -m "First minor version"

# タグをリモートにプッシュ（オプション）
# git push origin v0.0.0 v0.1.0

echo "タグが正常に作成されました。"