# 投資シミュレーター（GitHub Pages版）

`investment_simulation/financial_simulator` のStreamlitアプリを、HTML・CSS・JavaScriptに移植しました。Pythonサーバー、Node.js、ビルド、外部ライブラリやAPIキーは不要です。

## 手元で使う

このフォルダーの `index.html` をブラウザーで開いてください。ダブルクリックで動きます。インターネット接続も不要です。

HTTPで確認したい場合は、このフォルダーで次を実行し、`http://localhost:8000` を開きます。

```sh
python3 -m http.server 8000
```

終了はターミナルで `Ctrl+C` です。

## GitHubで公開する手順（ブラウザーだけで可能）

1. GitHubにログインし、右上の `+` → **New repository** を選びます。
2. Repository nameを **investment-simulation** にします（別名も可）。**Public** を選択し、**Create repository** を押します。
3. 空のリポジトリに表示される **uploading an existing file** を選びます。すでにファイルがある場合は **Add file → Upload files** です。
4. このフォルダーの次のファイルをアップロードします。フォルダーごと入れず、リポジトリの一番上に `index.html` が置かれるようにしてください。

   ```text
   index.html
   styles.css
   calculations.js
   app.js
   README.md
   .nojekyll
   ```

   `.nojekyll` は隠しファイルです。MacのFinderでは `Command + Shift + .` で表示できます。このサイトは通常の静的ファイルだけなので、このファイルをアップロードできなくても公開できます。

5. **Commit changes** を押して保存します。
6. リポジトリの **Settings → Pages** を開きます。
7. **Build and deployment → Source** を **Deploy from a branch** にします。
8. **Branch** は **main**、フォルダーは **/(root)** を選び、**Save** を押します。初期ブランチが別名なら、そのブランチを選んでください。
9. **Actions** タブで `pages build and deployment` が成功したら、**Settings → Pages** に戻り **Visit site** を押します。反映には数分かかる場合があります。

公開URLの例：

```text
https://あなたのGitHubユーザー名.github.io/investment-simulation/
```

URLを `https://ユーザー名.github.io/` にしたい場合は、リポジトリ名を **ユーザー名.github.io** にします。上の普通のリポジトリ名でも `github.io` で公開できます。

公式手順：[GitHub Pagesの公開元を設定する](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 更新するには

対象ファイルを **Add file → Upload files** で同じ場所に再アップロードして **Commit changes** を押します。同じ公開URLに自動反映されます。

### 表示されないとき

- 404の場合は、公開用ブランチの一番上に小文字の `index.html` があるか、Pagesが `main / (root)` かを確認します。
- CSSや計算が動かない場合は、`styles.css`・`calculations.js`・`app.js` が `index.html` と同じ場所にあるか確認します。
- 古い画面が出る場合は、Actionsの完了後に `Command + Shift + R` で再読み込みします。
- コードが公開されるため、個人情報やAPIキー、元アプリの仮想環境などはアップロードしないでください。この版に必要なのは上記のファイルだけです。

## ターミナルでアップロードする場合（上の方法との選択式）

GitHubで空のPublicリポジトリを作成し、次のURLの `YOUR_USERNAME` を自分のユーザー名に置き換えて実行します。空のリポジトリとして作成し、GitHub側でREADME等は追加しないでください。

```sh
cd /Users/k05uke/private/webapp/investment_simulation_github_io
git init
git add index.html styles.css calculations.js app.js README.md .nojekyll .gitignore tests
git commit -m "Create static investment simulator for GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/investment-simulation.git
git push -u origin main
```

初回はGitHub認証が必要になる場合があります。その後は上の手順6〜9でPagesを設定します。

## 機能と計算上の仮定

- 終価・年金終価・減債基金・現価・資本回収・年金現価の6種類。
- 年利率−20%〜30%、1〜50年、金額0〜1兆円。月次／年次、期首／期末に対応。
- 年利率から月利率への換算は実効月利と年利率÷12を選択可能。
- 残高グラフ、元本または累計受取額との比較、各期の結果表、CSVダウンロード。
- 入力値は計算の種類ごとにページ内で保持します。再読み込みすると初期化します。
- 元アプリの初期値を基本的に維持。最初の画面は積立計算です。年金現価係数の初期単位は元アプリと同じ「毎年」です。「毎月」に変更すると月額として計算します。
- 月次と年次の切り替え時は金額そのものを維持し、選んだ単位ごとの金額として計算します。
- 0%と元本0円にも対応。表示時だけ四捨五入し、内部計算は丸めません。利率は一定、税金・手数料・インフレは対象外です。
- 外部通信・外部CDN・入力データのサーバー保存はありません。

## ファイル

| ファイル | 役割 |
| --- | --- |
| `index.html` | 日本語の画面 |
| `styles.css` | PC・スマートフォン用スタイル |
| `calculations.js` | 6種類の金融計算と残高推移 |
| `app.js` | 画面操作、SVGグラフ、表、CSV |
| `.nojekyll` | Jekyll処理を無効化 |
| `tests/calculations.test.js` | 計算検証（公開時には不要） |

Node.jsがある環境では `node tests/calculations.test.js` で計算テストを実行できます。
