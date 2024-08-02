import argparse
from create_jupyter_notebook import create_jupyter_notebook
import re
import jupytext
import os

def load_markdown(file_path):
    try:
        with open(file_path, encoding="utf8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"エラー: ファイル '{file_path}' が見つかりません。")
        return None
    except IOError:
        print(f"エラー: ファイル '{file_path}' の読み込み中にエラーが発生しました。")
        return None

def get_first_heading(markdown_content):
    match = re.search(r'^#\s*(.*)', markdown_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    else:
        return 'output'

def sanitize_filename(filename):
    # コロン（半角・全角）を空文字に置換
    filename = re.sub(r'[:：]', '', filename)
    # スペース（半角・全角）をアンダースコアに置換
    return re.sub(r'[\s　]+', '_', filename)

def save_file(content, file_path):
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        return True
    except IOError as e:
        print(f"ファイルの保存中にエラーが発生しました: {str(e)}")
        return False

def convert_to_jupyter_notebook(markdown_content, base_filename):
    try:
        output_file = f"{sanitize_filename(base_filename)}.ipynb"
        temp_file = 'temp_markdown.md'
        if save_file(markdown_content, temp_file):
            create_jupyter_notebook(temp_file, output_file)
            os.remove(temp_file)  # 一時ファイルを削除
            print(f'Jupyter Notebookが生成されました: {output_file}')
    except Exception as e:
        print(f"Jupyter Notebookの生成中にエラーが発生しました: {str(e)}")

def convert_to_jupytext(markdown_content, base_filename):
    try:
        notebook = jupytext.reads(markdown_content, fmt='md')
        output_file = f"{sanitize_filename(base_filename)}.py"
        jupytext_content = jupytext.writes(notebook, fmt='py:percent')
        if save_file(jupytext_content, output_file):
            print(f'Jupytext形式のファイルが生成されました: {output_file}')
    except Exception as e:
        print(f"Jupytext形式への変換中にエラーが発生しました: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Markdownファイルを Jupyter Notebook と Jupytext 形式に変換します。')
    parser.add_argument('--input_file', required=True, help='入力するMarkdownファイルのパス')
    args = parser.parse_args()

    markdown_content = load_markdown(args.input_file)
    if markdown_content is None:
        return

    base_filename = get_first_heading(markdown_content)

    convert_to_jupyter_notebook(markdown_content, base_filename)
    convert_to_jupytext(markdown_content, base_filename)

if __name__ == '__main__':
    main()