import requests
from github import Github
from datetime import datetime, timedelta
from loguru import logger
import json
from dotenv import load_dotenv
import os
import csv

# .envファイルから環境変数を読み込む
load_dotenv()

# GitHub認証情報
github_token = os.getenv("GITHUB_TOKEN")
repo_name = os.getenv("REPO_NAME", "Sunwood-ai-labs/Yukihiko")
project_number = os.getenv("PROJECT_NUMBER", "9")

# GitHubクライアントの初期化
g = Github(github_token)
repo = g.get_repo(repo_name)

# GraphQL APIエンドポイント
api_url = "https://api.github.com/graphql"

# リクエストヘッダー
headers = {
    "Authorization": f"Bearer {github_token}",
    "Content-Type": "application/json"
}

# loguruの設定
logger.add("github_project_sync.log", rotation="500 MB")

# 処理済みコミットを保存するファイル
PROCESSED_COMMITS_FILE = "processed_commits.csv"

# 処理済みコミットを読み込む関数
def load_processed_commits():
    processed_commits = set()
    if os.path.exists(PROCESSED_COMMITS_FILE):
        with open(PROCESSED_COMMITS_FILE, 'r', newline='') as f:
            reader = csv.reader(f)
            next(reader)  # ヘッダーをスキップ
            for row in reader:
                processed_commits.add(row[0])  # SHA列を読み込む
    return processed_commits

# 処理済みコミットを保存する関数
def save_processed_commit(sha, issue_url):
    file_exists = os.path.exists(PROCESSED_COMMITS_FILE)
    with open(PROCESSED_COMMITS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(['SHA', 'Issue URL', 'Processed At'])  # ヘッダーを書き込む
        writer.writerow([sha, issue_url, datetime.now().isoformat()])

# プロジェクトIDを取得
def get_project_id():
    logger.info("プロジェクトIDを取得しています...")
    query = f"""
    query {{
      user(login: "{repo.owner.login}") {{
        projectV2(number: {project_number}) {{
          id
        }}
      }}
    }}
    """
    response = requests.post(api_url, json={"query": query}, headers=headers)
    project_id = response.json()['data']['user']['projectV2']['id']
    logger.info(f"プロジェクトID: {project_id}")
    return project_id

def escape_string(s):
    """GraphQLクエリ用に文字列をエスケープする"""
    return json.dumps(s)[1:-1]  # json.dumpsでエスケープし、前後のダブルクォートを除去

# Draft Issueを作成してProjectに追加
def create_draft_issue(project_id, title, body):
    logger.info(f"Draft Issue を作成しています: {title}")

    # タイトルと本文をエスケープ
    escaped_title = escape_string(title)
    escaped_body = escape_string(body)

    mutation = f"""
    mutation {{
      addProjectV2DraftIssue(input: {{projectId: "{project_id}", title: "{escaped_title}", body: "{escaped_body}"}}) {{
        projectItem {{
          id
        }}
      }}
    }}
    """
    logger.debug(f"mutation:\n{mutation}")
    response = requests.post(api_url, json={"query": mutation}, headers=headers)
    logger.debug(f"response.json:\n{response.json()}")

    if 'errors' in response.json():
        logger.error(f"GraphQL APIからエラーレスポンスを受け取りました: {response.json()['errors']}")
        return None

    draft_issue_id = response.json()['data']['addProjectV2DraftIssue']['projectItem']['id']
    logger.info(f"Draft Issue を Project に追加しました: {title} (ID: {draft_issue_id})")
    return draft_issue_id

# プロジェクトの各フィールドのIDを取得する関数
def get_project_fields(project_id):
    logger.info("プロジェクトフィールドのIDを取得しています...")
    query = f"""
    query {{
      node(id: "{project_id}") {{
        ... on ProjectV2 {{
          fields(first: 20) {{
            nodes {{
              ... on ProjectV2SingleSelectField {{
                id
                name
                options {{
                  id
                  name
                }}
              }}
              ... on ProjectV2Field {{
                id
                name
              }}
            }}
          }}
        }}
      }}
    }}
    """
    response = requests.post(api_url, json={"query": query}, headers=headers)

    fields = response.json()['data']['node']['fields']['nodes']

    status_field_id = None
    done_value_id = None
    start_date_field_id = None
    end_date_field_id = None

    for field in fields:
        if field['name'] == 'Status':
            status_field_id = field['id']
            for option in field['options']:
                if option['name'] == 'Done':
                    done_value_id = option['id']
        elif field['name'] == 'Start date':
            start_date_field_id = field['id']
        elif field['name'] == 'End date':
            end_date_field_id = field['id']

    logger.info(f"Status フィールド ID: {status_field_id}")
    logger.info(f"Done 値 ID: {done_value_id}")
    logger.info(f"Start date フィールド ID: {start_date_field_id}")
    logger.info(f"End date フィールド ID: {end_date_field_id}")
    return status_field_id, done_value_id, start_date_field_id, end_date_field_id

# Draft IssueをIssueに変換し、Projectに追加
def convert_to_issue(project_id, draft_issue_id, commit_date):
    logger.info(f"Draft Issue (ID: {draft_issue_id}) を Issue に変換しています...")
    # 1. Draft Issueの情報を取得
    query = f"""
    query {{
        node(id: "{draft_issue_id}") {{
            ... on ProjectV2Item {{
                content {{
                    ... on DraftIssue {{
                        title
                        body
                    }}
                }}
            }}
        }}
    }}
    """
    response = requests.post(api_url, json={"query": query}, headers=headers)
    issue_data = response.json()['data']['node']['content']

    # 2. Issueを作成
    issue_title = issue_data['title']
    issue_body = issue_data['body']
    created_issue = repo.create_issue(title=issue_title, body=issue_body)
    logger.debug(f"created_issue: {created_issue}")

    # 3. 作成したIssueのノードIDを取得 (GraphQL を使用)
    query = f"""
    query {{
        repository(owner: "{repo.owner.login}", name: "{repo.name}") {{
            issue(number: {created_issue.number}) {{
                id # node_id は id と同じです 
            }}
        }}
    }}
    """
    response = requests.post(api_url, json={"query": query}, headers=headers)
    issue_node_id = response.json()['data']['repository']['issue']['id']

    # 4. Status フィールドのID、doneの値、Start dateとEnd dateフィールドのIDを取得
    status_field_id, done_value_id, start_date_field_id, end_date_field_id = get_project_fields(project_id)

    if not status_field_id or not done_value_id or not start_date_field_id or not end_date_field_id:
        logger.error("必要なフィールドのIDを取得できませんでした。")
        return

    # 5. Issue を Project に追加
    mutation = f"""
    mutation {{
      addProjectV2ItemById(input: {{
        projectId: "{project_id}",
        contentId: "{issue_node_id}"
      }}) {{
        item {{
          id
        }}
      }}
    }}
    """
    response = requests.post(api_url, json={"query": mutation}, headers=headers)

    # 追加された Issue の ID を取得
    added_item_id = response.json()['data']['addProjectV2ItemById']['item']['id']
    logger.debug(f"addProjectV2ItemById(input: {added_item_id}")

    # 6. Issue の Status を Done に設定
    mutation = f"""
    mutation {{
    updateProjectV2ItemFieldValue(
        input: {{
        projectId: "{project_id}"
        # 追加された Issue の ID を指定
        itemId: "{added_item_id}"
        fieldId: "{status_field_id}"
        value: {{
            singleSelectOptionId: "{done_value_id}"
        }}
        }}
    ) {{
        projectV2Item {{
        id
        fieldValues(first: 10) {{
            nodes {{
            ... on ProjectV2ItemFieldSingleSelectValue {{
                field {{
                ... on ProjectV2FieldCommon {{
                    name
                }}
                }}
                name
            }}
            }}
        }}
        }}
    }}
    }}
    """
    response = requests.post(api_url, json={"query": mutation}, headers=headers)

    # レスポンスの詳細をログ出力
    logger.debug(f"updateProjectV2ItemFieldValue response: {response.json()}")

    # ... (既存のコードはそのまま) ...

    # 6. ProjectからDraft Issueを削除
    mutation = f"""
    mutation {{
      deleteProjectV2Item(input: {{projectId: "{project_id}", itemId: "{draft_issue_id}"}}) {{
        deletedItemId
      }}
    }}
    """
    response = requests.post(api_url, json={"query": mutation}, headers=headers)
    logger.info(f"Project から Draft Issue (ID: {draft_issue_id}) を削除しました")

    # 7. Issue の Start date と End date を設定
    formatted_date = commit_date.strftime("%Y-%m-%d")
    mutation = f"""
    mutation {{
      updateProjectV2ItemFieldValue(
        input: {{
          projectId: "{project_id}"
          itemId: "{added_item_id}"
          fieldId: "{start_date_field_id}"
          value: {{
            date: "{formatted_date}"
          }}
        }}
      ) {{
        projectV2Item {{
          id
        }}
      }}
    }}
    """
    response = requests.post(api_url, json={"query": mutation}, headers=headers)
    logger.debug(f"Set Start date response: {response.json()}")

    mutation = f"""
    mutation {{
      updateProjectV2ItemFieldValue(
        input: {{
          projectId: "{project_id}"
          itemId: "{added_item_id}"
          fieldId: "{end_date_field_id}"
          value: {{
            date: "{formatted_date}"
          }}
        }}
      ) {{
        projectV2Item {{
          id
        }}
      }}
    }}
    """
    response = requests.post(api_url, json={"query": mutation}, headers=headers)
    logger.debug(f"Set End date response: {response.json()}")

    issue_url = created_issue.html_url
    logger.info(f"Issueに変換しました: {issue_url}")
    return issue_url

# Status フィールドのIDとdoneの値を取得する関数
def get_status_field_and_done_value(project_id):
    logger.info("Status フィールドと Done 値のIDを取得しています...")
    query = f"""
    query {{
      node(id: "{project_id}") {{
        ... on ProjectV2 {{
          fields(first: 10) {{
            nodes {{
              ... on ProjectV2SingleSelectField {{
                id
                name
                options {{
                  id
                  name
                }}
              }}
            }}
          }}
        }}
      }}
    }}
    """
    response = requests.post(api_url, json={"query": query}, headers=headers)

    # エラーハンドリング
    if 'errors' in response.json():
        print(response.json()['errors'])
        return None, None

    print(response.json())
    fields = response.json()['data']['node']['fields']['nodes']

    status_field_id = None
    done_value_id = None

    for field in fields:
        # 'name' キーの存在を確認する
        if 'name' in field and field['name'] == 'Status':
            status_field_id = field['id']
            for option in field['options']:
                if option['name'] == 'Done':
                    done_value_id = option['id']
                    break
            break

    logger.info(f"Status フィールド ID: {status_field_id}")
    logger.info(f"Done 値 ID: {done_value_id}")
    return status_field_id, done_value_id

# ------------------------
# メイン処理
#
if __name__ == "__main__":
    logger.info("処理を開始します。")

    # GitHub tokenが設定されていることを確認
    if not github_token:
        logger.error("GITHUB_TOKEN が設定されていません。.env ファイルを確認してください。")
        exit(1)

    # 最近のコミットを取得 (例: 過去30日間)
    commits = repo.get_commits(since=datetime.now() - timedelta(days=30))

    # Issueとして投稿するコミットの開始日時
    since_datetime = datetime(2023, 12, 1)  # 例: 2023年12月1日以降のコミット

    # Project IDを取得
    project_id = get_project_id()

    # 処理済みコミットを読み込む
    processed_commits = load_processed_commits()

    # 各コミットに対して処理
    for commit in commits:
        logger.info(f"コミット {commit.sha} を処理しています...")

        # コミットがすでに処理済みの場合はスキップ
        if commit.sha in processed_commits:
            logger.info(f"コミット {commit.sha} は既に処理済みのためスキップします。")
            continue

        body = "\n".join(commit.commit.message.splitlines()[1:])
        issue_title = f"{commit.commit.message.splitlines()[0]}"
        if ("Merge" in issue_title):
            continue

        # Issueのタイトルと本文を作成
        issue_body = f"""
{body}

# info

- コミットSHA: {commit.sha}
- コミット日時: {commit.commit.author.date}
- コミット作成者: {commit.commit.author.name} <{commit.commit.author.email}>

        """

        # Draft Issueを作成してProjectに追加
        draft_issue_id = create_draft_issue(project_id, issue_title, issue_body)

        # Draft IssueをIssueに変換し、Projectに追加
        issue_url = convert_to_issue(project_id, draft_issue_id, commit.commit.author.date)

        # 処理したコミットを記録
        save_processed_commit(commit.sha, issue_url)

    logger.info("処理が完了しました。")