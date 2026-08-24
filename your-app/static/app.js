/**
 * TODO App JavaScript - 完成版
 * 第8回: セキュリティの基礎 & 総仕上げ
 *
 * 【このファイルの役割】
 *  ブラウザの画面（HTML）と、バックエンド（main.py）の橋渡しをする。
 *
 * 【全体の流れ】
 *  1. ページが開かれる → loadTodos() でサーバーからTODO一覧を取得
 *  2. renderTodos() が、取得したデータを画面のリストとして描画する
 *  3. ユーザーが「追加・チェック・削除」を操作する
 *     → 対応する関数がサーバーに変更を送る（fetch）
 *     → 最後にもう一度 loadTodos() して、最新の状態を画面に反映する
 *
 * ※ fetch はサーバーと通信する命令。通信は時間がかかるので、
 *   async / await を使って「結果が返ってくるまで待つ」書き方をしている。
 */

// サーバー側のAPIのアドレス（main.py の @app.get("/todos") などに対応）
const API_URL = "/logbook";

// 円グラフを保持する変数
let incomeChart = null;
let expenseChart = null;

// ============================================================
// TODO操作（CRUD）
// ============================================================

/**
 * TODO一覧を取得して表示する
 */
async function loadLogbooks() {
  // try ... catch: 通信中にエラーが起きても、アプリが止まらないようにする
  try {
    // サーバーに「一覧をください」とお願いし、返事(response)を待つ
    const response = await fetch(API_URL);

    // response.ok が false = サーバーがエラーを返したとき
    if (!response.ok) {
      const error = await response.json(); // エラー内容を取り出す
      showError(error.detail || "TODOの取得に失敗しました");
      return; // ここで処理を終える
    }

    // 返ってきたデータ(JSON)をJavaScriptの配列に変換する
    const logbooks = await response.json();
    renderLogbooks(logbooks); // 画面に描画する
    updateCharts(logbooks); // 円グラフを更新する
  } catch (error) {
    // そもそもサーバーにつながらなかったときなど
    showError("通信エラーが発生しました");
  }
}

/**
 * 新しいTODOを追加する
 */
async function addLogbook() {
  // 入力欄の要素を取得し、入力された文字を読み取る（trimで前後の空白を除去）
const date = document.getElementById("date-input").value;
const type = document.getElementById("type-input").value;
const category = document.getElementById("category-input").value.trim();
const amount = document.getElementById("amount-input").value;
const memo = document.getElementById("memo-input").value.trim();

  // 送信前のチェック（バリデーション）: 空のときは送らずに注意を表示
if (date === "") {
  showError("日付を入力してください");
  return;
}

if (type === "") {
  showError("収入または支出を選択してください");
  return;
}

if (category === "") {
  showError("カテゴリを入力してください");
  return;
}

if (amount === "") {
  showError("金額を入力してください");
  return;
}
  try {
    // サーバーに「このTODOを追加して」と送る
const response = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    date: date,
    type: type,
    category: category,
    amount: Number(amount),
    memo: memo
  }),
});

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "家計簿の追加に失敗しました");
      return;
    }

document.getElementById("date-input").value = ""; //入力欄を空にする処理を変更
document.getElementById("type-input").value = "";
document.getElementById("category-input").value = "";
document.getElementById("amount-input").value = "";
document.getElementById("memo-input").value = "";

await loadLogbooks();
} catch (error) {
  showError("通信エラーが発生しました");
}
}   // ← addLogbook() の終了

// ↓↓↓ この直後に追加 ↓↓↓

async function deleteLogbook(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "家計簿の削除に失敗しました");
      return;
    }

    await loadLogbooks();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// ============================================================
// 円グラフ→138～201まで
// ============================================================

/**
 * 収入と支出の円グラフを更新する
 */
function updateCharts(logbooks) {
  // 収入と支出をカテゴリごとに集計する
  const incomeData = {};
  const expenseData = {};

  logbooks.forEach((logbook) => {
    if (logbook.type === "収入") {
      incomeData[logbook.category] =
        (incomeData[logbook.category] || 0) + logbook.amount;
    }

    if (logbook.type === "支出") {
      expenseData[logbook.category] =
        (expenseData[logbook.category] || 0) + logbook.amount;
    }
  });

  // 以前の円グラフがあれば削除する
  if (incomeChart) {
    incomeChart.destroy();
  }

  if (expenseChart) {
    expenseChart.destroy();
  }

  // 収入の円グラフ
  const incomeCtx = document.getElementById("income-chart");

  incomeChart = new Chart(incomeCtx, {
    type: "pie",
    data: {
      labels: Object.keys(incomeData),
      datasets: [
        {
          data: Object.values(incomeData),
        },
      ],
    },
  });

  // 支出の円グラフ
  const expenseCtx = document.getElementById("expense-chart");

  expenseChart = new Chart(expenseCtx, {
    type: "pie",
    data: {
      labels: Object.keys(expenseData),
      datasets: [
        {
          data: Object.values(expenseData),
        },
      ],
    },
  });
}

/**
 * TODOの完了状態を切り替える
 * id: 対象のTODOの番号 / currentDone: いまの完了状態(true/false)
 */


/**
 * TODOを削除する
 * id: 削除したいTODOの番号
 */


// ============================================================
// 描画
// ============================================================

/**
 * TODOリストを描画する（XSS対策: createElement + textContent）
 *
 * 受け取ったTODOの配列をもとに、画面に並べる<li>を1件ずつ組み立てる。
 *
 * 【XSS対策のポイント】
 *  innerHTML に文字列を直接入れると、入力に紛れ込んだ<script>などが
 *  実行されてしまう危険がある（XSS）。そこで textContent を使い、
 *  入力を「ただの文字」として扱うことで、この攻撃を防いでいる。
 */
function renderLogbooks(logbooks) {
  const list = document.getElementById("todo-list");
  list.innerHTML = ""; // 古い表示を一度すべて消してから描き直す

  // todos配列の1件ずつ(todo)について、リストの行を作る
  logbooks.forEach((logbook) => {
    // <li> 完了済みなら "done" クラスを足して見た目を変える
    const li = document.createElement("li");
    li.className = "todo-item";

    // チェックボックスとタイトルをまとめる<label>
    const label = document.createElement("label");
    label.className = "todo-label";

    // 完了チェックボックス
   

    // TODOのタイトル文字。textContent で安全に入れる（XSS対策）
    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent =
    `${logbook.date} ${logbook.type} ${logbook.category} ${logbook.amount}円 ${logbook.memo ?? ""}`; // カラムの分追加したもの。
    // label の中に[タイトル] を入れる
    label.appendChild(titleSpan);

    // 削除ボタン。押されたら削除する関数を呼ぶ
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => deleteLogbook(logbook.id));

    // <li> の中に [label][削除ボタン] を入れて、リストに追加する
    li.appendChild(label);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

// ============================================================
// メッセージ表示
// ============================================================

// エラーメッセージを画面に表示する（5秒後に自動で消える）
function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message; // メッセージを表示
  errorDiv.style.display = "block"; // 見えるようにする
  // setTimeout: 指定したミリ秒後に処理を実行する。5000ミリ秒 = 5秒
  setTimeout(() => {
    errorDiv.style.display = "none"; // 5秒後に隠す
  }, 5000);
}

// ============================================================
// イベントリスナー
// ============================================================

// フォームが送信された（追加ボタン or Enter）ときの動き
document.getElementById("logbook-form").addEventListener("submit", function (e) {
  e.preventDefault();
  addLogbook();
});

// ページ読み込み時に、まずTODO一覧を取得して表示する（ここがスタート地点）
loadLogbooks();
