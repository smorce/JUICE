<p align="center">
<img src="https://huggingface.co/datasets/smorce/IconAssets/resolve/main/JUICE.png" width="100%">
<br>
<h1 align="center">JUICE</h1>
<h2 align="center">
  ～ Just Unlimited Intelligent Conversational Engine ～
<br>
  <img alt="PyPI - Version" src="https://img.shields.io/pypi/v/JUICE">
<img alt="PyPI - Format" src="https://img.shields.io/pypi/format/JUICE">
<img alt="PyPI - Implementation" src="https://img.shields.io/pypi/implementation/JUICE">
<img alt="PyPI - Status" src="https://img.shields.io/pypi/status/JUICE">
<img alt="PyPI - Downloads" src="https://img.shields.io/pypi/dd/JUICE">
<img alt="PyPI - Downloads" src="https://img.shields.io/pypi/dw/JUICE">
<a href="https://github.com/smorce/JUICE" title="Go to GitHub repo"><img src="https://img.shields.io/static/v1?label=JUICE&message=smorce&color=blue&logo=github"></a>
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/smorce/JUICE">
<a href="https://github.com/smorce/JUICE"><img alt="forks - smorce" src="https://img.shields.io/github/forks/JUICE/smorce?style=social"></a>
<a href="https://github.com/smorce/JUICE"><img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/smorce/JUICE"></a>
<a href="https://github.com/smorce/JUICE"><img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/smorce/JUICE"></a>
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/smorce/JUICE?color=red">
<img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/smorce/JUICE?sort=semver&color=orange">
<img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/smorce/JUICE/publish-to-pypi.yml">
<br>
<p align="center">
  <a href="https://note.com/smorce/"><b>[🌐 Website]</b></a> •
  <a href="https://github.com/smorce"><b>[🐱 GitHub]</b></a>
  <a href="https://x.com/smorce1"><b>[🐦 Twitter]</b></a> •
  <a href="https://note.com/smorce/"><b>[🍀 Official Blog]</b></a>
</p>

</h2>

</p>

>[!IMPORTANT]
>このリポジトリのリリースノートやREADME、コミットメッセージの9割近くは[claude.ai](https://claude.ai/)や[ChatGPT4](https://chatgpt.com/)を活用した[AIRA](https://github.com/Sunwood-ai-labs/AIRA), [SourceSage](https://github.com/Sunwood-ai-labs/SourceSage), [Gaiah](https://github.com/Sunwood-ai-labs/Gaiah), [HarmonAI_II](https://github.com/Sunwood-ai-labs/HarmonAI_II)で生成しています。

低遅延でリアルタイムなAI会話システムを開発し、音声認識、言語モデル（LLM）、テキスト読み上げ（TTS）、およびアバター生成を活用します。このシステムは、ユーザーがリアルなデジタルアバターと自然に会話を開始できるようにし、シームレスで自然なユーザー体験を提供することを目指しています。

APIキーの読み込み: api.json から D-ID APIキーと OpenAI APIキーを読み込みます。
音声認識: startSpeechRecognition() 関数は、ブラウザのWeb Speech APIを使用して音声認識を開始します。認識されたテキストは getGPTResponse() に渡されます。
GPTによる応答生成: getGPTResponse() 関数は、OpenAI APIを使用して、認識されたテキストに対するGPTの応答を生成します。
音声合成: synthesizeSpeech() 関数は、GPTの応答テキストを音声に変換します。ここではElevenLabsのAPIを利用します。
D-ID APIへの送信: sendScriptToDId() 関数は、音声URLをD-ID APIに送信し、動画生成をリクエストします。
ストリーミング状態の表示: 各ステップの進行状況は statusLabel に表示されます。
アイドル状態の画像表示: ストリーミングされていない間は、playIdleVideo() 関数で設定された画像が表示されます。


# 設定と実行
D-ID、OpenAIのAPIキーを取得し、api.json に設定します。
index.html と script.js を同じディレクトリに配置します。
index.html をブラウザで開きます。
"Connect" ボタンをクリックしてD-IDに接続します。
"Start Streaming" ボタンをクリックすると、音声認識が開始されます。

# 注意点
このコードは、TTS APIとして仮のものを想定しています。実際には、Google Cloud TTS APIなどの音声合成APIを別途用意する必要があります。
各APIの利用方法、エラー処理などは、それぞれの公式ドキュメントを参照してください。
このコードが、あなたが目指すインタラクティブなWebアプリケーション開発の助けになれば幸いです。

# ElevenLabs(TTS)のAPI使い方【Pythonサンプルコード有り】
https://note.com/yuki_tech/n/ndfa3669945ac