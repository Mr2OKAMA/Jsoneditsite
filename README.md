# Jsoneditsite

SharePoint 向けのカード情報を、HTML を直接編集せずに管理するための静的 Web サイトです。`editor.html` でカードを編集し、ブラウザから `cards.js`（または `cards.json`）をインポート・エクスポートできます。

## 公開ページ

- [オフィスポータルを開く](https://mr2okama.github.io/Jsoneditsite/index.html)
- [カード管理エディタを開く](https://mr2okama.github.io/Jsoneditsite/editor.html)

## GitHub Pages での公開方法

1. このリポジトリを GitHub に push します。
2. GitHub の **Settings > Pages** を開きます。
3. **Build and deployment** の Source で **Deploy from a branch** を選択します。
4. Branch に公開対象ブランチ（例: `main`）を選択し、フォルダは `/ (root)` を指定して保存します。
5. 公開後、`https://<ユーザー名>.github.io/<リポジトリ名>/editor.html` で編集画面を利用できます。

## editor.html の使い方

- `editor.html` を開くと、同じフォルダの `data/cards.js` を読み込んでカード一覧を表示します（`cards.js` がない場合は `data/cards.json` を読み込みます）。
- 画面上部のボタンから ファイル読み込み、エクスポート、新規追加、初期状態へのリセットが行えます。
- 編集内容は一時的に `localStorage` に保存されるため、ページ再読み込み後も復元できます。

## オフィスポータルの使い方

- `index.html` を開くと、`data/cards.js` を読み込んでポータルを表示します。GitHub Pages / SharePoint / ローカルの `file://` のいずれでも同じ方法で動作します。
- 左サイドバーからホーム、中央、水処理、保守、電気を切り替えられます。
- ポータル本体にはカード編集機能はありません。カードを変更する場合は `editor.html` で編集し、`cards.js` をエクスポートして `data/cards.js` を置き換えてください。
- ポータルをSharePointへ配置する場合は、`index.html`、`css/portal.css`、`js/portal.js`、`data/cards.js` を相対関係を保ったままアップロードしてください。

## カテゴリ管理

- 画面上部の **カテゴリ管理** パネルで、カテゴリ（ホーム・中央・水処理など）の追加・名称変更・アイコン変更・並べ替え・削除ができます。
- ここで追加したカテゴリは、カード編集フォームのカテゴリ選択肢と、オフィスポータルの左サイドバーへ自動的に反映されます（コードの修正は不要です）。
- **カテゴリを追加** をクリックし、表示名を入力すると新しいカテゴリが追加されます。IDは表示名から自動生成されます。
- 既にカードで使用されているカテゴリは、そのカードを削除するかカテゴリを変更するまで削除できません。
- **categories.js をエクスポート** で `window.PORTAL_CATEGORIES = [...];` 形式の `categories.js` をダウンロードできます。SharePoint側の `data/categories.js` をこのファイルで置き換えてください。

## ファイルの読み込み（インポート）

1. **cards.js / categories.js を読み込む** をクリックします。
2. ローカル PC 上の `cards.js`・`cards.json`・`categories.js` のいずれかを選択します。
3. ファイル名や中身の `window.PORTAL_CARDS` / `window.PORTAL_CATEGORIES` を見て自動判定します。
4. 形式、必須フィールド、カテゴリ、tone、URL、ID 重複を検証します。
5. エラーがある場合は日本語メッセージで画面表示し、不正なデータは反映しません。

## カード追加・編集・削除

- **新しいカードを追加** で空のフォームを開きます。
- カテゴリ、カード名、説明、リンク URL、アイコン、色を入力して **保存** します。
- ID は新規作成時にカード名から自動生成されます。
- 既存カードの **編集** でフォームへ読み込み、保存で更新できます。
- **削除** は確認ダイアログを表示したうえで実行します。
- カード一覧では上下ボタンとドラッグ＆ドロップで表示順を変更できます。

## ファイルのエクスポート

- **cards.js をエクスポート** 実行時に最新データを再バリデーションします。
- 問題がなければ、`window.PORTAL_CARDS = {...};` 形式の `cards.js` をブラウザのダウンロード機能で保存します。
- 不正なデータがある場合はダウンロードせず、日本語のエラー通知を表示します。

## SharePoint への手動アップロード

1. `editor.html` からダウンロードした `cards.js`（カテゴリを変更した場合は `categories.js` も）を用意します。
2. SharePoint 側で利用中の `data/cards.js`（および `data/categories.js`）の配置場所を開きます。
3. 既存のファイルを新しいファイルで手動上書きします。
4. ポータル画面を再読み込みして内容を確認します。

> このリポジトリは GitHub や SharePoint への自動アップロード、自動コミット、自動同期を行いません。

## ファイル構成

```text
/
├─ index.html
├─ editor.html
├─ css/
│  ├─ editor.css
│  └─ portal.css
├─ js/
│  ├─ editor.js
│  └─ portal.js
├─ data/
│  ├─ cards.json
│  ├─ cards.js
│  └─ categories.js
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

- `category`: `data/categories.js` に定義したカテゴリのIDのいずれか（初期値: `home`, `central`, `water`, `maintenance`, `electrical`）
- `tone`: `blue`, `green`, `purple`, `yellow`, `red`
- `id`: 一意である必要があります

## カテゴリ定義の形式

`data/categories.js` は以下の形式です。

```js
window.PORTAL_CATEGORIES = [
  { "id": "central", "label": "中央", "icon": "⌘" }
];
```

- `id`: 一意である必要があります（カードの `category` から参照されます）
- `label`: サイドバーやプルダウンに表示される名前
- `icon`: サイドバーに表示する1〜2文字程度の記号

## GitHub Pages から SharePoint の JSON を直接更新できない理由

GitHub Pages は静的ファイル配信のみを行うため、ブラウザから SharePoint 上の JSON を直接上書きするサーバーサイド処理は実装できません。そのため、JSON をダウンロードして SharePoint に手動アップロードする運用にしています。

## 公開リポジトリへ保存しない情報

- 社内 URL、認証情報、秘密鍵、トークンなどの機密情報は公開リポジトリに保存しないでください。
- 実運用の SharePoint URL や組織内部の説明文を含む JSON をコミットする場合は、公開範囲を十分確認してください。
- 公開できないカード情報を扱う場合は、非公開リポジトリまたはローカル運用を検討してください。
