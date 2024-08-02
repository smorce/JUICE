import json
import re

def create_jupyter_notebook(markdown_file, output_file):
    with open(markdown_file, 'r', encoding="utf-8") as file:
        markdown_content = file.read()

    cells = []
    chunks = re.split(r'(```.*?```)', markdown_content, flags=re.DOTALL)

    for i in range(len(chunks)):
        chunk = chunks[i].strip()
        if chunk:
            if chunk.startswith('```') and chunk.endswith('```'):
                language = chunk[3:chunk.find('\n')]
                code_lines = chunk[chunk.find('\n')+1:-3].split('\n')
                code_lines = [line + '\n' for line in code_lines[:-1]] + [code_lines[-1]]
                cells.append({
                    'cell_type': 'code',
                    'execution_count': None,
                    'metadata': {},
                    'outputs': [],
                    'source': code_lines
                })
            else:
                markdown_lines = chunk.split('\n')
                markdown_lines = [line + '\n' for line in markdown_lines[:-1]] + [markdown_lines[-1]]
                cell = {
                    'cell_type': 'markdown',
                    'metadata': {},
                    'source': markdown_lines
                }
                cells.append(cell)

    notebook = {
        'nbformat': 4,
        'nbformat_minor': 0,
        'metadata': {
            'colab': {
                'provenance': []
            },
            'kernelspec': {
                'name': 'python3',
                'display_name': 'Python 3'
            },
            'language_info': {
                'name': 'python'
            }
        },
        'cells': cells
    }

    with open(output_file.replace(".ipynb", ".json"), 'w', encoding='utf-8') as file:
        json.dump(notebook, file, indent=2, ensure_ascii=False)

    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(notebook, file, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    # 使用例
    markdown_file = 'example/example03.md'
    output_file = 'example/example03.ipynb'
    create_jupyter_notebook(markdown_file, output_file)