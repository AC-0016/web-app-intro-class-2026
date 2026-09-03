# 私のアプリ設計

## 1. 家計簿アプリ
例：　家計簿のアプリ

## 2. テーブル設計
テーブル名：　Logbook
カラム:　id(項目){主キー(サロゲートキーを使用)} / date(日付) / type(収入 or 支出) / category(カテゴリー) / amount(金額) / memo(メモ)


## 3. 変換表
def init_db():の変換
DATABASE = "Todo.db" → DATABASE = "Logbook.db"
CREATE TABLE IF NOT EXISTS Todo ( → CREATE TABLE IF NOT EXISTS Logbook )
title TEXT NOT NULL, → date TEXT NOT NULL,
done INTEGER DEFAULT 0 → type TEXT NOT NULL,
ここからは新たに追加するカラム
category TEXT NOT NULL,
amount INTEGER NOT NULL,
memo TEXT

class Create(BaseModel):の変換
class Create(BaseModel):
    # 新しいTODOを作るときに受け取るデータ
    # title は1文字以上100文字以下の文字列でなければならない
    title: str = Field(min_length=1, max_length=100)
                        ↓
class LogbookCreate(BaseModel):
    date: str
    type: str
    category: str
    amount: int
    memo: str | None = None

## 4.進捗状況
7月10日行ったこと
・データベースのテーブル名をLogbookに変更
・テーブル内に新たなカラムの追加
・クラスの定義をデータベースに合わせて変更
・# todos テーブルの全データを id 順に取り出す
    cursor.execute("SELECT id, title, done FROM todos ORDER BY id")
    todos = cursor.fetchall()  # 取り出した全行をリストで受け取る

7月24日行ったこと
・設計データの作成
・API設計の作成
・変換表の作成
・design.mdの修正
・app.jsのtodoをlogbookに変更
・app.jsのtodosをlogbooksに変更
・app.jsのTodoをLogbookに変更
・app.jsのTodosをLogbooksに変更

7月31日に行ったこと
・main.pyのtodoをlogbookに変更
・main.pyのtodosをlogbooksに変更
・main.pyのTodoをLogbookに変更
・main.pyのTodosをLogbooksに変更
・何度も変えてもエラーになるのでchatGPTに相談
　→誤字が見つかった

8月7日に行ったこと
・前期最終提出フォームの下書き
・7月10日～7月31までの修正で正常に動かなかったのでChatGPTに質問
　→todoリスト用で家計簿アプリには不要なもの、逆に必要な物が存在して
　　いないことがわかった。私の知識では書き換え不可のためChatGPTに
　　お願いしました

8月8日に行ったこと
・main.pyのTodosをLogbooksに変更
・書き方が間違っていたところをChataGPTに修正依頼
・main.py修正後の動作確認

8月9日に行ったこと
・index.htmlをLogbook用に編集(カラムの追加)
・index.htmlのコメントアウト修正
・収入、支出の選択をプルダウン方式に変更

8月10日
・app.jsの修正(カラムの追加)
・家計簿アプリの基本的なもの完成

8月12日
・日にちの入力でカレンダーを追加

8月15日
・全体を中央によせる寄せる(style.css)

8月20日
・円グラフの追加

8月25日
・編集ボタンの追加

8月28日
・円グラフに%を追加

8月29日
・カテゴリ選択肢をプルダウン方式に変更
・追加した時点で自動的に降順に並ぶような機能に変更
・切り替えボタンを追加し、昇順/降順に切り替え可能に変更
・昇順、降順を切り替えると円グラフの色まで変化してしまう仕様に
　なってしまったため、入力順を保存する変数を作成→app.js


9月1日
・月ごとに管理できるように変更

9月3日
・LLMを実装しようとしたがAPIキーの管理者と連絡がつかず、APIキーが不明なため断念
　しかし、APIキーを入力すれば、すぐに動く状態まで作成した
