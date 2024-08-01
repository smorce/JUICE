<p align="center">
<img src="https://raw.githubusercontent.com/smorce/JUICE/main/juice/assets/JUICE.png" width="100%">
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

# J.U.I.C.E.: 超高速AIチャットボット

D-ID、OpenAI、ElevenLabs APIを活用した、超高速応答を実現するAIチャットボット。

## プロジェクトの概要

JUICEは、最先端のAI技術を駆使して開発された、超高速応答が可能なAIチャットボットです。ユーザーが入力した音声をリアルタイムで認識し、自然で滑らかな対話を実現します。従来のチャットボットでは課題であった応答速度の遅延を最小限に抑え、ストレスフリーなコミュニケーションを可能にします。

**対象ユーザー:**

- AIチャットボットとの自然な対話を体験したい方
- 従来のチャットボットの応答速度に不満を感じている方
- 最新のAI技術を活用したサービスに興味関心のある方

**開発の背景:**

近年、AI技術の進歩により、人間と自然な対話を行うことができるチャットボットが注目されています。しかし、既存のチャットボットの多くは、応答速度の遅延や不自然な発話などが課題として挙げられていました。JUICEは、これらの課題を解決するために開発されました。D-ID、OpenAI、ElevenLabsのAPIを組み合わせることで、高速かつ自然な対話を実現し、ユーザーにストレスフリーなコミュニケーションを提供します。

## 主な機能

- **リアルタイム音声認識:** ブラウザのWeb Speech APIを使用してユーザーの音声をリアルタイムでテキストに変換します。
- **AIによる自然な対話:** OpenAIのGPTモデル(GPT-4o mini)を活用し、ユーザーの入力内容に基づいて、自然で人間らしい応答を生成します。
- **高速音声合成:** ElevenLabs API(Turbo v2.5)を用いて、高品質な音声を高速に合成し、AIキャラクターに喋らせます。生成した合成音声は一時的に tmpfiles.org にアップロードします。
- **D-IDによる動画生成:** 音声と同期したリアルな動画を生成し、より人間らしい対話を実現します。

## 特徴

- **超高速応答:** 従来のチャットボットと比較して、圧倒的な応答速度を実現しています。
- **自然で滑らかな対話:** 高度なAI技術により、まるで人間と話しているかのような自然な対話を体験できます。
- **高品質な音声と動画:** ElevenLabsとD-IDのAPIにより、高品質な音声と動画を生成し、リアルなコミュニケーションを実現します。

## 技術スタック

- **言語:** JavaScript
- **フレームワーク:** Express.js
- **ライブラリ:** 
    - js-yaml: YAMLファイルの読み込み
    - Web Speech API: 音声認識
    - Fetch API: API通信
- **API:**
    - D-ID API: 動画生成
    - OpenAI API: AIチャットボット
    - ElevenLabs API: 音声合成
- **その他:**
    - HTML5
    - CSS3

## 開発環境

- **OS:** POSIX準拠 (macOS, Linuxなど)
- **Node.js:** 14 以上
- **npm:** 6 以上

**開発環境の構築手順:**

1. Node.js と npm をインストールします。
2. プロジェクトのルートディレクトリに移動し、以下のコマンドを実行して依存関係をインストールします。

```bash
npm install
```

## インストール方法

1. リポジトリをクローンします。

```bash
git clone https://github.com/smorce/JUICE.git
```

2. プロジェクトディレクトリに移動します。

```bash
cd JUICE
```

3. juiceフォルダで `api.yaml` ファイルを作成し、以下の内容で設定します。

```
# D-ID API の設定
dId:
  url: https://api.d-id.com
  service: talks
  key: hogehoge

# OpenAI API の設定
openAI:
  key: hogehoge

# ElevenLabs API の設定
elevenLabs:
  key: hogehoge

```

4. プロジェクトを開発環境で実行します。

```bash
npm run dev
```

5. ブラウザで `http://localhost:3000` にアクセスします。

## 使用方法

1.  "Connect" ボタンをクリックして、D-ID API に接続します。
2.  "Start Streaming" ボタンをクリックして、音声認識を開始します。
3.  準備完了となったらAIチャットボットに話しかけます。
4.  少しの遅延でAIチャットボットが応答します。
5.  "Destroy" ボタンをクリックして、終了します。

## 貢献方法

- Issueの報告、プルリクエストの作成、ドキュメントの改善など、プロジェクトへの貢献を歓迎します。

## ライセンス

MITライセンス

## 謝辞

- このプロジェクトは、D-ID、OpenAI、ElevenLabsのAPIを利用しています。
- 開発にあたり、多くのオープンソースソフトウェアに感謝いたします。