# Jsoneditsite

SharePoint ポータル向けのカード情報を、HTML を直接編集せずに管理するための静的 Web サイトです。`editor.html` でカードを編集し、ブラウザから `cards.json` をインポート・エクスポートできます。

## 公開ページ

- [カードポータルを開く](https://mr2okama.github.io/Jsoneditsite/)
- [カード管理エディタを開く](https://mr2okama.github.io/Jsoneditsite/editor.html)

## GitHub Pages での公開方法

1. このリポジトリを GitHub に push します。
2. GitHub の **Settings > Pages** を開きます。
3. **Build and deployment** の Source で **Deploy from a branch** を選択します。
4. Branch に公開対象ブランチ（例: `main`）を選択し、フォルダは `/ (root)` を指定して保存します。
5. 公開後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で `index.html`、`https://<ユーザー名>.github.io/<リポジトリ名>/editor.html` で編集画面を利用できます。

## editor.html の使い方

- `editor.html` を開くと、相対パスの `data/cards.json` を読み込んでカード一覧を表示します。
- 画面上部のボタンから JSON 読み込み、エクスポート、新規追加、初期状態へのリセットが行えます。
- 編集内容は一時的に `localStorage` に保存されるため、ページ再読み込み後も復元できます。

## JSON インポート

1. **JSONを読み込む** をクリックします。
2. ローカル PC 上の `cards.json` を選択します。
3. JSON の形式、必須フィールド、カテゴリ、tone、URL、ID 重複を検証します。
4. エラーがある場合は日本語メッセージで画面表示し、不正なデータは反映しません。

## カード追加・編集・削除

- **新しいカードを追加** で空のフォームを開きます。
- カテゴリ、カード名、説明、リンク URL、アイコン、色を入力して **保存** します。
- ID は新規作成時にカード名から自動生成されます。
- 既存カードの **編集** でフォームへ読み込み、保存で更新できます。
- **削除** は確認ダイアログを表示したうえで実行します。
- カード一覧では上下ボタンとドラッグ＆ドロップで表示順を変更できます。

## JSON エクスポート

- **JSONをエクスポート** 実行時に最新データを再バリデーションします。
- 問題がなければ、整形済み UTF-8 の `cards.json` をブラウザのダウンロード機能で保存します。
- 不正なデータがある場合はダウンロードせず、日本語のエラー通知を表示します。

## SharePoint への手動アップロード

1. `editor.html` からダウンロードした `cards.json` を用意します。
2. SharePoint 側で利用中の JSON 配置場所を開きます。
3. 既存の `cards.json` を新しいファイルで手動上書きします。
4. ポータル側を再読み込みして内容を確認します。

> このリポジトリは GitHub や SharePoint への自動アップロード、自動コミット、自動同期を行いません。

## ファイル構成

```text
/
├─ index.html
├─ editor.html
├─ css/
│  ├─ portal.css
│  └─ editor.css
├─ js/
│  ├─ portal.js
│  └─ editor.js
├─ data/
│  └─ cards.json
├─ assets/
│  ├─ icons/
│  └─ images/
├─ README.md
└─ .gitignore
```

## JSON 形式

全体は以下の形式です。

```json
{
  "version": 1,
  "cards": []
}
```

各カードは以下の形式です。

```json
{
  "id": "unique-card-id",
  "category": "central",
  "title": "引継報告書",
  "description": "引継ぎ内容の報告・記録",
  "url": "#",
  "icon": "↔",
  "tone": "purple"
}
```

- `category`: `home`, `central`, `water`, `maintenance`, `electrical`
- `tone`: `blue`, `green`, `purple`, `yellow`, `red`
- `id`: 一意である必要があります

## GitHub Pages から SharePoint の JSON を直接更新できない理由

GitHub Pages は静的ファイル配信のみを行うため、ブラウザから SharePoint 上の JSON を直接上書きするサーバーサイド処理は実装できません。そのため、JSON をダウンロードして SharePoint に手動アップロードする運用にしています。

## 公開リポジトリへ保存しない情報

- 社内 URL、認証情報、秘密鍵、トークンなどの機密情報は公開リポジトリに保存しないでください。
- 実運用の SharePoint URL や組織内部の説明文を含む JSON をコミットする場合は、公開範囲を十分確認してください。
- 公開できないカード情報を扱う場合は、非公開リポジトリまたはローカル運用を検討してください。
