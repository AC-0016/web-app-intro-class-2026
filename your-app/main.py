"""
TODOアプリ バックエンド - 完成版
第8回: セキュリティの基礎 & 総仕上げ
"""

import sqlite3  # Python標準のデータベース（SQLite）を使うためのライブラリ
import os
import uvicorn  # FastAPIアプリを動かすためのWebサーバー

from dotenv import load_dotenv
from openai import OpenAI
from fastapi import FastAPI, HTTPException  # Webアプリ本体とエラー応答用
from fastapi.middleware.cors import CORSMiddleware  # ブラウザからのアクセスを許可する設定
from fastapi.staticfiles import StaticFiles  # HTML/CSS/JSなどのファイルを配信する機能
from pydantic import BaseModel, Field  # 受け取るデータの形をチェックする道具


# .envファイルから環境変数を読み込む
load_dotenv()

# .envからAPIキーが読み込めているか確認
if os.getenv("OPENAI_API_KEY"):
    print("OPENAI_API_KEYの読み込み成功")
else:
    print("OPENAI_API_KEYが設定されていません")

# OpenAI APIを利用するためのクライアントを作成
client = OpenAI()

# --- FastAPIアプリ ---
# このappが、Webアプリ全体の本体になる
app = FastAPI(title="Logbook")

# CORS設定: 別のアドレスで動くフロント（ブラウザの画面）からの通信を許可する
# allow_origins=["*"] は「どこからのアクセスでもOK」という意味（学習用の設定）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- データベース設定 ---
# データを保存するファイルの名前。アプリと同じフォルダに Logbook.db が作られる
DATABASE = "Logbook.db"


def init_db():
    """データベースとテーブルを初期化する"""
    conn = sqlite3.connect(DATABASE)  # データベースに接続する
    cursor = conn.cursor()  # SQLを実行する係（カーソル）を用意する
    # Logbook:テーブル
    #   id    : 自動で増える番号（主キー）(サロゲートキー)
    #   date  : 日付（空はNG）
    #   type  : 収入or支出（空はNG）
    #   category: カテゴリ（空はNG）（食費、交通費、光熱費 等）
    #   amount: 金額（空はNG）
    #   memo  : メモ（空でもOK）
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Logbook (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount INTEGER NOT NULL,
            memo TEXT
        )
    """)
    conn.commit()  # 変更を確定して保存する
    conn.close()  # 接続を閉じる


# --- Pydanticモデル ---
# APIが受け取るデータの「形」を決めるクラス。
# 形に合わないデータが送られてきたら、FastAPIが自動でエラーを返してくれる。


class LogbookCreate(BaseModel):
    date: str
    type: str
    category: str
    amount: int
    memo: str | None = None


class LogbookUpdate(BaseModel):
    # TODOを更新するときに受け取るデータ
    # done は True / False（完了したかどうか）
    # 家計簿ようにT or Fではなく、それぞれのカラムに合う型に変更。
    # memo: str | None = Noneは記入しなくてもよいためNoneをOK
    date: str
    type: str
    category: str
    amount: int
    memo: str | None = None


# LLM相談で受け取るプロンプト
class ConsultationCreate(BaseModel):
    prompt: str


# --- APIエンドポイント ---
# @app.get / @app.post などの飾り（デコレータ）で、
# 「どのURLに、どの種類のリクエストが来たら、この関数を動かすか」を決める。


@app.get("/logbook")  # GET /todos にアクセスされたら実行
def get_logbook():
    """TODO一覧を取得する"""
    conn = sqlite3.connect(DATABASE)  # 接続する
    cursor = conn.cursor()

    # todos テーブルの全データを id 順に取り出す
    cursor.execute("SELECT id, date, type, category, amount, memo FROM Logbook ORDER BY id")
    logbook = cursor.fetchall()  # 取り出した全行をリストで受け取る

    conn.close()  # 接続を閉じる
    # 1行は (id, title, done) の順のタプルなので、番号で取り出す。
    # 取り出したデータを、ブラウザに返しやすい辞書のリストに作り変える。
    return [
    {
        "id": row[0],
        "date": row[1],
        "type": row[2],
        "category": row[3],
        "amount": row[4],
        "memo": row[5],
    }
    for row in logbook
]


@app.post("/logbook", status_code=201)  # POST /todos で新規作成（201=作成成功）
def create_logbook(logbook:LogbookCreate ):
    """新しいTODOを作成する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # 新しいTODOを1件追加する（done は 0=未完了で登録）
    # ? を使うことで、危険な文字列が混ざってもSQLが壊れない（SQLインジェクション対策）
    cursor.execute(
        "INSERT INTO Logbook (date, type, category, amount, memo) VALUES (?, ?, ?, ?, ?)",
    (
        logbook.date,
        logbook.type,
        logbook.category,
        logbook.amount,
        logbook.memo,
    ),
)
    conn.commit()  # 追加を確定する
    logbook_id = cursor.lastrowid  # たった今追加した行の id を取得する

    conn.close()
    return {
       "id": logbook_id,
       "date": logbook.date,
       "type": logbook.type,
       "category": logbook.category,
       "amount": logbook.amount,
       "memo": logbook.memo,
}


# PUT /todos/5 のように、URLの {todo_id} の部分が引数 todo_id に入る
@app.put("/logbook/{logbook_id}")
def update_logbook(logbook_id: int, logbook: LogbookUpdate):
    """TODOの完了状態を更新する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # まず、その id のTODOが本当にあるか確認する
    cursor.execute("SELECT id FROM Logbook WHERE id = ?", (logbook_id,))
    existing = cursor.fetchone()  # 1件だけ取り出す。無ければ None が返る
    if existing is None:
        conn.close()  # 見つからないときも接続は閉じてから終わる
        # 404エラー（見つからない）を返して処理を中断する
        raise HTTPException(status_code=404, detail="Logbook not found")
    # done（完了状態）を更新する。True/False は int() で 1/0 に変換して保存
    cursor.execute(
        "UPDATE Logbook SET date = ?, type = ?, category = ?, amount = ?, memo = ? WHERE id = ?",
        (logbook.date, logbook.type, logbook.category, logbook.amount, logbook.memo, logbook_id)
    )
    conn.commit()  # 更新を確定する

    conn.close()
    ## 最初は「:」で区切らないで書いていたが、区切らずに書くと1つのキーとして扱われてしまう。
    ## 「:」で区切ることで6つのキーとして扱われる。
    return {
    "id": logbook_id,
    "date": logbook.date,
    "type": logbook.type,
    "category": logbook.category,
    "amount": logbook.amount,
    "memo": logbook.memo
}


@app.delete("/logbook/{logbook_id}")  # DELETE /todos/5 で id=5 のTODOを削除
def delete_logbook(logbook_id: int):
    """TODOを削除する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # 削除する前に、その id のTODOが存在するか確認する
    cursor.execute("SELECT id FROM Logbook WHERE id = ?", (logbook_id,))
    existing = cursor.fetchone()
    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Logbook not found")

    cursor.execute("DELETE FROM Logbook WHERE id = ?", (logbook_id,))  # 削除する
    conn.commit()  # 削除を確定する

    conn.close()
    return {"message": "Logbook deleted", "id": logbook_id}


# ============================================================
# LLM相談API
# ============================================================

@app.post("/consultation")
def consultation(consultation: ConsultationCreate):
    """LLM相談で送られてきたプロンプトをOpenAIに送る"""

    response = client.responses.create(
        model="gpt-5.5",
        input=consultation.prompt
    )

    return {
        "answer": response.output_text
    }


# --- 静的ファイル配信 ---
# static フォルダの中身（index.html など）をそのままブラウザに表示できるようにする
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# --- アプリ起動時にDBを初期化 ---
# プログラムが読み込まれたタイミングで、テーブルが無ければ作っておく
init_db()

# このファイルを直接 `python main.py` で実行したときだけ、サーバーを起動する
if __name__ == "__main__":
    # host="0.0.0.0" で外部からのアクセスも受け付ける。ポート8000で待ち受ける
    uvicorn.run(app, host="0.0.0.0", port=8000)

