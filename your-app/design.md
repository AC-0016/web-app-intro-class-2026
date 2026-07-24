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