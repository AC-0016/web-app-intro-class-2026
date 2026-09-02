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
// 日付の並び順
// true = 降順（新しい日付 → 古い日付）
// false = 昇順（古い日付 → 新しい日付）
let sortDescending = true;

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

    // 円グラフ用に、入力順のデータを保存する
    const chartLogbooks = [...logbooks];

    // 日付の並び順を変更する
    if (sortDescending) {
      // 降順（新しい日付 → 古い日付）
      logbooks.sort((a, b) => {
        return b.date.localeCompare(a.date);
      });
    } else {
      // 昇順（古い日付 → 新しい日付）
      logbooks.sort((a, b) => {
        return a.date.localeCompare(b.date);
      });
    }

    renderLogbooks(logbooks); // 画面に描画する
    updateCharts(chartLogbooks); // 円グラフを更新する
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
let category = document.getElementById("category-input").value.trim();

if (category === "追加") {
  category = document.getElementById("custom-category-input").value.trim();
}
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
// 編集ボタンの作成
async function editLogbook(logbook) {
  const date = prompt("日付を入力してください", logbook.date);
  if (date === null) return;

  const type = prompt("収入または支出を入力してください", logbook.type);
  if (type === null) return;

  const category = prompt("カテゴリを入力してください", logbook.category);
  if (category === null) return;

  const amount = prompt("金額を入力してください", logbook.amount);
  if (amount === null) return;

  const memo = prompt("メモを入力してください", logbook.memo ?? "");
  if (memo === null) return;

  if (date.trim() === "") {
    showError("日付を入力してください");
    return;
  }

  if (type !== "収入" && type !== "支出") {
    showError("収入または支出を入力してください");
    return;
  }

  if (category.trim() === "") {
    showError("カテゴリを入力してください");
    return;
  }

  if (amount.trim() === "" || isNaN(Number(amount))) {
    showError("金額を正しく入力してください");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${logbook.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: date.trim(),
        type: type,
        category: category.trim(),
        amount: Number(amount),
        memo: memo.trim()
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "家計簿の編集に失敗しました");
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
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const data = context.dataset.data;
            const total = data.reduce((sum, value) => sum + value, 0);
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);

            return `${context.label}: ${value}円 (${percentage}%)`;
          },
        },
      },
    },
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
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const data = context.dataset.data;
            const total = data.reduce((sum, value) => sum + value, 0);
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);

            return `${context.label}: ${value}円 (${percentage}%)`;
          },
        },
      },
    },
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

const dateObject = new Date(logbook.date);
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const weekday = weekdays[dateObject.getDay()];

titleSpan.textContent =
  `${logbook.date} (${weekday}) ${logbook.type} ${logbook.category} ${logbook.amount}円 ${logbook.memo ?? ""}`;
    // label の中に[タイトル] を入れる
    label.appendChild(titleSpan);

// 編集ボタン
const editBtn = document.createElement("button");
editBtn.className = "edit-button";
editBtn.textContent = "編集";
editBtn.addEventListener("click", () => editLogbook(logbook));

// 削除ボタン
const deleteBtn = document.createElement("button");
deleteBtn.className = "delete-button";
deleteBtn.textContent = "削除";
deleteBtn.addEventListener("click", () => deleteLogbook(logbook.id));

// ボタンをまとめる
const buttonArea = document.createElement("div");
buttonArea.className = "button-area";

buttonArea.appendChild(editBtn);
buttonArea.appendChild(deleteBtn);

// <li> の中に [label][編集][削除] を入れる
li.appendChild(label);
li.appendChild(buttonArea);

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

// 日付入力欄のどこをクリックしてもカレンダーを開く
const dateInput = document.getElementById("date-input");

dateInput.addEventListener("click", () => {
  dateInput.showPicker();
});

// カテゴリで「追加」を選んだときの処理
document.getElementById("category-input").addEventListener("change", function () {
  const customCategoryInput = document.getElementById("custom-category-input");

  if (this.value === "追加") {
    customCategoryInput.style.display = "block";
    customCategoryInput.required = true;
  } else {
    customCategoryInput.style.display = "none";
    customCategoryInput.required = false;
    customCategoryInput.value = "";
  }
});

// 日付の並び順を切り替えるボタン
document.getElementById("sort-button").addEventListener("click", async function () {
  sortDescending = !sortDescending;
  await loadLogbooks();
});

// 月管理ボタン
document.getElementById("month-button").addEventListener("click", function () {
  const monthSelect = document.getElementById("month-select");

  // プルダウンの表示・非表示を切り替える
  if (monthSelect.style.display === "none") {
    monthSelect.style.display = "block";

    // 家計簿データから月の一覧を作成する
    loadMonthOptions();
  } else {
    monthSelect.style.display = "none";
  }
});


// 月の選択肢を作成する
async function loadMonthOptions() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "家計簿の取得に失敗しました");
      return;
    }

    const logbooks = await response.json();

    const monthSelect = document.getElementById("month-select");

    // 現在の選択肢を一度リセットする
    monthSelect.innerHTML = "";

    // 最初の選択肢
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "月を選択";
    monthSelect.appendChild(defaultOption);

    // 家計簿データから年月だけを取り出す
    const months = [];

    logbooks.forEach((logbook) => {
      const month = logbook.date.substring(0, 7);

      if (!months.includes(month)) {
        months.push(month);
      }
    });

    // 新しい月から順番に並べる
    months.sort((a, b) => b.localeCompare(a));

    // プルダウンに月を追加する
    months.forEach((month) => {
      const option = document.createElement("option");

      option.value = month;
      option.textContent = month.replace("-", "/");

      monthSelect.appendChild(option);
    });
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// 月を選択したときの処理
document.getElementById("month-select").addEventListener("change", async function () {
  const selectedMonth = this.value;

  // 月が選択されていない場合は、全件表示する
  if (selectedMonth === "") {
    await loadLogbooks();
    return;
  }

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "家計簿の取得に失敗しました");
      return;
    }

    const logbooks = await response.json();

    // 選択した年月と一致する家計簿だけを残す
    const filteredLogbooks = logbooks.filter((logbook) => {
      return logbook.date.substring(0, 7) === selectedMonth;
    });

    // 日付順に並べる
    if (sortDescending) {
      filteredLogbooks.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      filteredLogbooks.sort((a, b) => a.date.localeCompare(b.date));
    }

    // 選択した月の家計簿だけを表示する
    renderLogbooks(filteredLogbooks);

    // 選択した月の円グラフを表示する
    updateCharts(filteredLogbooks);

  } catch (error) {
    showError("通信エラーが発生しました");
  }
});

// ============================================================
// LLM相談機能
// ============================================================

// 相談ボタンを押したときの処理
document.getElementById("consultation-button").addEventListener("click", function () {
  const promptArea = document.getElementById("prompt-area");
  const promptInput = document.getElementById("prompt-input");

  // プロンプト入力欄を表示する
  promptArea.style.display = "flex";

  // 入力欄にカーソルを移動する
  promptInput.focus();
});

// 完了ボタンを押したときの処理
document.getElementById("prompt-submit-button").addEventListener("click", function () {
  const promptInput = document.getElementById("prompt-input");
  const prompt = promptInput.value.trim();

  // プロンプトが空の場合
  if (prompt === "") {
    showError("相談内容を入力してください");
    return;
  }

  // 現段階ではLLMを呼び出さない
  console.log("入力されたプロンプト:", prompt);
});