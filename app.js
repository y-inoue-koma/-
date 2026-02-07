/* ===== Simple Club Manager (static) =====
   - No backend
   - Data stored in localStorage
   - Pages: dashboard / schedules / menus / members / records / absences
*/

const STORAGE_KEYS = {
  members: "cm_members",
  schedules: "cm_schedules",
  menus: "cm_menus",
  records: "cm_records",
  absences: "cm_absences",
};

const EVENT_TYPES = [
  { value: "practice", label: "練習" },
  { value: "game", label: "試合" },
  { value: "meeting", label: "ミーティング" },
  { value: "other", label: "その他" },
];

function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeed() {
  const members = load(STORAGE_KEYS.members, null);
  const schedules = load(STORAGE_KEYS.schedules, null);
  const menus = load(STORAGE_KEYS.menus, null);
  const records = load(STORAGE_KEYS.records, null);
  const absences = load(STORAGE_KEYS.absences, null);

  if (!members) {
    save(STORAGE_KEYS.members, [
      { id: uid("m"), name: "裕貴 井上", role: "部員", grade: "2", position: "内野", throws: "右", bats: "右" },
    ]);
  }
  if (!schedules) save(STORAGE_KEYS.schedules, []);
  if (!menus) save(STORAGE_KEYS.menus, []);
  if (!records) save(STORAGE_KEYS.records, []);
  if (!absences) save(STORAGE_KEYS.absences, []);
}

function $(sel, root=document) { return root.querySelector(sel); }
function $all(sel, root=document) { return [...root.querySelectorAll(sel)]; }

function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1 - day); // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}
function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23,59,59,999);
  return e;
}

function typeLabel(type) {
  return EVENT_TYPES.find(t=>t.value===type)?.label ?? "その他";
}

function setActiveNav() {
  const page = document.body.getAttribute("data-page");
  $all(".nav__item").forEach(a=>{
    const p = a.getAttribute("data-nav");
    a.classList.toggle("is-active", p === page);
  });
}

/* ===== UI helpers ===== */
function openDialog(id) {
  const dlg = document.getElementById(id);
  if (dlg && dlg.showModal) dlg.showModal();
}
function closeDialog(id) {
  const dlg = document.getElementById(id);
  if (dlg && dlg.close) dlg.close();
}
function bindDialogCloseButtons() {
  $all("[data-close-dialog]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-close-dialog");
      closeDialog(id);
    });
  });
}

/* ===== Dashboard ===== */
function renderDashboard() {
  const members = load(STORAGE_KEYS.members, []);
  const schedules = load(STORAGE_KEYS.schedules, []);
  const menus = load(STORAGE_KEYS.menus, []);

  $("#stat-members").textContent = String(members.length);
  $("#stat-week").textContent = String(getThisWeekSchedules().length);
  $("#stat-menus").textContent = String(menus.length);

  const box = $("#week-box");
  const items = getThisWeekSchedules().sort((a,b)=> (a.date+a.startTime).localeCompare(b.date+b.startTime));
  if (items.length === 0) {
    box.innerHTML = `<p class="muted">今週の予定はありません</p>`;
    return;
  }
  box.innerHTML = `
    <div class="list">
      ${items.map(it=>`
        <div class="list__row">
          <div class="list__left">
            <div class="badge">${typeLabel(it.type)}</div>
            <div>
              <div class="list__title">${escapeHtml(it.title)}</div>
              <div class="list__sub">${escapeHtml(it.date)} ${escapeHtml(it.startTime || "")}${it.endTime ? " - "+escapeHtml(it.endTime) : ""}</div>
            </div>
          </div>
          <div class="list__right">
            <button class="btn btn--ghost" data-del-schedule="${it.id}">削除</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  $all("[data-del-schedule]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-schedule");
      const next = schedules.filter(s=>s.id !== id);
      save(STORAGE_KEYS.schedules, next);
      renderDashboard();
    });
  });
}

function getThisWeekSchedules() {
  const schedules = load(STORAGE_KEYS.schedules, []);
  const now = new Date();
  const s = startOfWeek(now);
  const e = endOfWeek(now);
  return schedules.filter(it=>{
    const d = new Date(it.date + "T00:00:00");
    return d >= s && d <= e;
  });
}

/* ===== Members ===== */
function renderMembers() {
  const members = load(STORAGE_KEYS.members, []);
  const wrap = $("#members-list");
  wrap.innerHTML = `
    <div class="list">
      ${members.map(m=>`
        <div class="list__row">
          <div class="list__left">
            <div class="avatar">${escapeHtml((m.name||"").slice(0,1))}</div>
            <div>
              <div class="list__title">${escapeHtml(m.name)}</div>
              <div class="list__sub">学年: ${escapeHtml(m.grade||"-")} / 役割: ${escapeHtml(m.role||"-")} / ${escapeHtml(m.position||"-")}</div>
            </div>
          </div>
          <div class="list__right">
            <button class="btn btn--ghost" data-edit-member="${m.id}">編集</button>
            <button class="btn btn--ghost" data-del-member="${m.id}">削除</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  $("#member-count").textContent = String(members.length);

  $all("[data-del-member]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-member");
      const next = members.filter(m=>m.id !== id);
      save(STORAGE_KEYS.members, next);
      // records/absences remain (簡易)
      renderMembers();
      fillMemberSelects();
    });
  });

  $all("[data-edit-member]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-edit-member");
      const m = members.find(x=>x.id===id);
      if (!m) return;
      $("#memberFormMode").value = "edit";
      $("#memberId").value = m.id;
      $("#memberName").value = m.name || "";
      $("#memberRole").value = m.role || "";
      $("#memberGrade").value = m.grade || "";
      $("#memberPos").value = m.position || "";
      $("#memberThrows").value = m.throws || "";
      $("#memberBats").value = m.bats || "";
      openDialog("dlg-member");
    });
  });
}

function submitMemberForm(e) {
  e.preventDefault();
  const members = load(STORAGE_KEYS.members, []);
  const mode = $("#memberFormMode").value;
  const id = $("#memberId").value || uid("m");
  const payload = {
    id,
    name: $("#memberName").value.trim(),
    role: $("#memberRole").value.trim(),
    grade: $("#memberGrade").value.trim(),
    position: $("#memberPos").value.trim(),
    throws: $("#memberThrows").value.trim(),
    bats: $("#memberBats").value.trim(),
  };

  if (!payload.name) { alert("氏名を入力してください"); return; }

  let next;
  if (mode === "edit") next = members.map(m=> m.id===id ? payload : m);
  else next = [payload, ...members];

  save(STORAGE_KEYS.members, next);
  closeDialog("dlg-member");
  e.target.reset();
  $("#memberFormMode").value = "create";
  $("#memberId").value = "";
  renderMembers();
  fillMemberSelects();
}

/* ===== Schedules ===== */
function renderSchedules() {
  const schedules = load(STORAGE_KEYS.schedules, []).sort((a,b)=> (a.date+a.startTime).localeCompare(b.date+b.startTime));
  $("#schedule-count").textContent = String(schedules.length);

  const wrap = $("#schedules-list");
  if (schedules.length === 0) {
    wrap.innerHTML = `<div class="empty-box"><p>予定がありません</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="list">
      ${schedules.map(it=>`
        <div class="list__row">
          <div class="list__left">
            <div class="badge">${typeLabel(it.type)}</div>
            <div>
              <div class="list__title">${escapeHtml(it.title)}</div>
              <div class="list__sub">${escapeHtml(it.date)} ${escapeHtml(it.startTime || "")}${it.endTime ? " - "+escapeHtml(it.endTime) : ""}</div>
              ${it.note ? `<div class="list__note">${escapeHtml(it.note)}</div>` : ""}
            </div>
          </div>
          <div class="list__right">
            <button class="btn btn--ghost" data-del-schedule="${it.id}">削除</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  $all("[data-del-schedule]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-schedule");
      const next = schedules.filter(s=>s.id !== id);
      save(STORAGE_KEYS.schedules, next);
      renderSchedules();
      // dashboard stats update on next visit
    });
  });
}

function submitScheduleForm(e) {
  e.preventDefault();
  const schedules = load(STORAGE_KEYS.schedules, []);
  const payload = {
    id: uid("sch"),
    date: $("#schDate").value,
    type: $("#schType").value,
    title: $("#schTitle").value.trim(),
    startTime: $("#schStart").value,
    endTime: $("#schEnd").value,
    note: $("#schNote").value.trim(),
  };
  if (!payload.date || !payload.title) { alert("日付とタイトルは必須です"); return; }
  save(STORAGE_KEYS.schedules, [payload, ...schedules]);
  closeDialog("dlg-schedule");
  e.target.reset();
  renderSchedules();
}

/* ===== Menus ===== */
function renderMenus() {
  const menus = load(STORAGE_KEYS.menus, []);
  $("#menu-count").textContent = String(menus.length);
  const wrap = $("#menus-list");
  if (menus.length === 0) {
    wrap.innerHTML = `<div class="empty-box"><p>練習メニューがありません</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="list">
      ${menus.map(it=>`
        <div class="list__row">
          <div class="list__left">
            <div>
              <div class="list__title">${escapeHtml(it.title)}</div>
              <div class="list__sub">カテゴリ: ${escapeHtml(it.category || "-")}</div>
              ${it.note ? `<div class="list__note">${escapeHtml(it.note)}</div>` : ""}
            </div>
          </div>
          <div class="list__right">
            <button class="btn btn--ghost" data-del-menu="${it.id}">削除</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  $all("[data-del-menu]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-menu");
      save(STORAGE_KEYS.menus, menus.filter(m=>m.id!==id));
      renderMenus();
    });
  });
}

function submitMenuForm(e) {
  e.preventDefault();
  const menus = load(STORAGE_KEYS.menus, []);
  const payload = {
    id: uid("menu"),
    title: $("#menuTitle").value.trim(),
    category: $("#menuCategory").value.trim(),
    note: $("#menuNote").value.trim(),
  };
  if (!payload.title) { alert("タイトルは必須です"); return; }
  save(STORAGE_KEYS.menus, [payload, ...menus]);
  closeDialog("dlg-menu");
  e.target.reset();
  renderMenus();
}

/* ===== Records ===== */
function renderRecords() {
  const records = load(STORAGE_KEYS.records, []);
  $("#record-count").textContent = String(records.length);

  const memberId = $("#recordMemberFilter").value;
  const list = memberId ? records.filter(r=>r.memberId===memberId) : records;

  const wrap = $("#records-list");
  if (list.length === 0) {
    wrap.innerHTML = `<div class="empty-box"><p>成績データがありません</p></div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>日付</th>
            <th>部員</th>
            <th>指標</th>
            <th>値</th>
            <th>メモ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${list.sort((a,b)=> (b.date||"").localeCompare(a.date||"")).map(r=>{
            const m = findMember(r.memberId);
            return `
              <tr>
                <td>${escapeHtml(r.date)}</td>
                <td>${escapeHtml(m?.name || "不明")}</td>
                <td>${escapeHtml(r.metric)}</td>
                <td class="num">${escapeHtml(String(r.value))}</td>
                <td>${escapeHtml(r.note||"")}</td>
                <td class="actions"><button class="btn btn--ghost" data-del-record="${r.id}">削除</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  $all("[data-del-record]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-record");
      save(STORAGE_KEYS.records, records.filter(r=>r.id!==id));
      renderRecords();
    });
  });
}

function submitRecordForm(e) {
  e.preventDefault();
  const records = load(STORAGE_KEYS.records, []);
  const payload = {
    id: uid("rec"),
    date: $("#recDate").value,
    memberId: $("#recMember").value,
    metric: $("#recMetric").value.trim(),
    value: Number($("#recValue").value),
    note: $("#recNote").value.trim(),
  };
  if (!payload.date || !payload.memberId || !payload.metric || Number.isNaN(payload.value)) {
    alert("日付 / 部員 / 指標 / 値 は必須です");
    return;
  }
  save(STORAGE_KEYS.records, [payload, ...records]);
  closeDialog("dlg-record");
  e.target.reset();
  renderRecords();
}

/* ===== Absences ===== */
function renderAbsences() {
  const abs = load(STORAGE_KEYS.absences, []);
  $("#absence-count").textContent = String(abs.length);
  const wrap = $("#absences-list");
  if (abs.length === 0) {
    wrap.innerHTML = `<div class="empty-box"><p>欠席連絡はありません</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="list">
      ${abs.sort((a,b)=> (b.date||"").localeCompare(a.date||"")).map(a=>{
        const m = findMember(a.memberId);
        return `
          <div class="list__row">
            <div class="list__left">
              <div class="badge">欠席</div>
              <div>
                <div class="list__title">${escapeHtml(m?.name || "不明")}（${escapeHtml(a.date)}）</div>
                <div class="list__sub">理由: ${escapeHtml(a.reason || "-")}</div>
                ${a.note ? `<div class="list__note">${escapeHtml(a.note)}</div>` : ""}
              </div>
            </div>
            <div class="list__right">
              <button class="btn btn--ghost" data-del-absence="${a.id}">削除</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  $all("[data-del-absence]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-absence");
      save(STORAGE_KEYS.absences, abs.filter(x=>x.id!==id));
      renderAbsences();
    });
  });
}

function submitAbsenceForm(e) {
  e.preventDefault();
  const abs = load(STORAGE_KEYS.absences, []);
  const payload = {
    id: uid("abs"),
    date: $("#absDate").value,
    memberId: $("#absMember").value,
    reason: $("#absReason").value.trim(),
    note: $("#absNote").value.trim(),
  };
  if (!payload.date || !payload.memberId) { alert("日付と部員は必須です"); return; }
  save(STORAGE_KEYS.absences, [payload, ...abs]);
  closeDialog("dlg-absence");
  e.target.reset();
  renderAbsences();
}

/* ===== Shared ===== */
function findMember(id) {
  const members = load(STORAGE_KEYS.members, []);
  return members.find(m=>m.id===id) || null;
}

function fillMemberSelects() {
  const members = load(STORAGE_KEYS.members, []);
  const selects = ["#recMember", "#recordMemberFilter", "#absMember"].map(s=>$(s)).filter(Boolean);
  selects.forEach(sel=>{
    const current = sel.value;
    sel.innerHTML = `
      ${sel.id === "recordMemberFilter" ? `<option value="">（全員）</option>` : ``}
      ${members.map(m=>`<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("")}
    `;
    if ([...sel.options].some(o=>o.value===current)) sel.value = current;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ===== Page bootstrap ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  ensureSeed();
  setActiveNav();
  bindDialogCloseButtons();
  fillMemberSelects();

  const page = document.body.getAttribute("data-page");

  if (page === "dashboard") renderDashboard();
  if (page === "members") renderMembers();
if (page === "schedules") {
  // （ログインを使ってるならここで必須化）
  // if (!requireLogin()) return;

  // 初期：当月 & 今日を選択
  const now = new Date();
  calCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  calSelectedYMD = todayYMD();

  // 月移動
  $("#cal-prev")?.addEventListener("click", ()=>{
    calCurrent = new Date(calCurrent.getFullYear(), calCurrent.getMonth()-1, 1);
    setMonthTitle();
    renderCalendar();
  });
  $("#cal-next")?.addEventListener("click", ()=>{
    calCurrent = new Date(calCurrent.getFullYear(), calCurrent.getMonth()+1, 1);
    setMonthTitle();
    renderCalendar();
  });

  // 追加ボタン：選択日をデフォルトに
  $("#btn-open-schedule")?.addEventListener("click", ()=>{
    editingScheduleId = null;
    $("#dlg-schedule-title").textContent = "予定を追加";
    $("#btn-schedule-save").textContent = "保存";

    $("#schDate").value = calSelectedYMD || todayYMD();
    $("#schType").value = "practice";
    $("#schTitle").value = "";
    $("#schStart").value = "";
    $("#schEnd").value = "";
    $("#schNote").value = "";

    openDialog("dlg-schedule");
  });

  setMonthTitle();
  renderCalendar();
  renderSelectedDay();
}

  if (page === "menus") renderMenus();
  if (page === "records") renderRecords();
  if (page === "absences") renderAbsences();

  // Bind forms if present
  $("#form-member")?.addEventListener("submit", submitMemberForm);
  $("#form-schedule")?.addEventListener("submit", (e)=>{
  submitScheduleForm(e); // 既存の保存処理を使う

  // schedulesページのときだけ、カレンダー再描画
  if (document.body.getAttribute("data-page") === "schedules") {
    // 保存した日付へ選択を合わせる
    const savedDate = $("#schDate")?.value;
    if (savedDate) calSelectedYMD = savedDate;

    // 表示月も合わせる
    if (calSelectedYMD) {
      const dd = dateFromYMD(calSelectedYMD);
      calCurrent = new Date(dd.getFullYear(), dd.getMonth(), 1);
    }

    setMonthTitle();
    renderCalendar();
    renderSelectedDay();
  }
});

  $("#form-menu")?.addEventListener("submit", submitMenuForm);
  $("#form-record")?.addEventListener("submit", submitRecordForm);
  $("#form-absence")?.addEventListener("submit", submitAbsenceForm);

  // Filter for records
  $("#recordMemberFilter")?.addEventListener("change", renderRecords);

  // Open dialog buttons
  $all("[data-open-dialog]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      openDialog(btn.getAttribute("data-open-dialog"));
    });
  });
});

/* ===== Calendar UI for schedules ===== */
let calCurrent = null;     // Date (first day of current month)
let calSelectedYMD = null; // "YYYY-MM-DD"

function ymdFromDate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function dateFromYMD(ymd){
  return new Date(ymd + "T00:00:00");
}
function jpDayName(d){
  return ["日","月","火","水","木","金","土"][d.getDay()];
}
function setMonthTitle(){
  const el = document.getElementById("cal-title");
  if (!el || !calCurrent) return;
  el.textContent = `${calCurrent.getFullYear()}年${calCurrent.getMonth()+1}月`;
}

function schedulesByDateMap(){
  const schedules = load(STORAGE_KEYS.schedules, []);
  const map = new Map();
  for (const s of schedules){
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date).push(s);
  }
  // sort per day
  for (const [k, arr] of map){
    arr.sort((a,b)=> (a.startTime||"").localeCompare(b.startTime||""));
  }
  return map;
}

function renderCalendar(){
  const grid = document.getElementById("cal-grid");
  if (!grid || !calCurrent) return;

  const map = schedulesByDateMap();

  const first = new Date(calCurrent.getFullYear(), calCurrent.getMonth(), 1);
  const last  = new Date(calCurrent.getFullYear(), calCurrent.getMonth()+1, 0);

  // start from Sunday of the week containing the 1st
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // Sun start
  // end at Saturday of the week containing the last day
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const today = todayYMD();
  const cells = [];
  const curMonth = calCurrent.getMonth();

  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    const ymd = ymdFromDate(d);
    const inMonth = d.getMonth() === curMonth;
    const isToday = ymd === today;
    const isSel = ymd === calSelectedYMD;

    const items = map.get(ymd) || [];
    const dotCount = Math.min(items.length, 3);

    cells.push(`
      <button class="cal-cell ${inMonth ? "" : "is-out"} ${isToday ? "is-today" : ""} ${isSel ? "is-selected" : ""}"
              type="button" data-ymd="${ymd}">
        <div class="cal-day ${d.getDay()===0 ? "sun" : ""}">${d.getDate()}</div>
        <div class="cal-dots">
          ${Array.from({length: dotCount}).map(()=>`<span class="dot"></span>`).join("")}
          ${items.length > 3 ? `<span class="more">+${items.length-3}</span>` : ""}
        </div>
      </button>
    `);
  }

  grid.innerHTML = cells.join("");

  // bind click
  $all(".cal-cell", grid).forEach(btn=>{
    btn.addEventListener("click", ()=>{
      calSelectedYMD = btn.getAttribute("data-ymd");
      renderCalendar();
      renderSelectedDay();
    });
  });
}

function renderSelectedDay(){
  const title = document.getElementById("day-title");
  const list = document.getElementById("day-list");
  if (!title || !list || !calSelectedYMD) return;

  const d = dateFromYMD(calSelectedYMD);
  title.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日(${jpDayName(d)})`;

  const schedules = load(STORAGE_KEYS.schedules, []).filter(s=>s.date===calSelectedYMD)
    .sort((a,b)=> (a.startTime||"").localeCompare(b.startTime||""));

  if (schedules.length === 0){
    list.innerHTML = `<div class="empty-box"><p>この日の予定はありません</p></div>`;
    return;
  }

  list.innerHTML = `
    <div class="list">
      ${schedules.map(it=>`
        <div class="list__row ${calSelectedYMD===todayYMD() ? "is-today" : ""}">
          <div class="list__left">
            <div class="badge">${typeLabel(it.type)}</div>
            <div>
              <div class="list__title">${escapeHtml(it.title)}</div>
              <div class="list__sub">
                ${escapeHtml(it.startTime||"")}${it.endTime ? " - "+escapeHtml(it.endTime) : ""}
              </div>
              ${it.note ? `<div class="list__note">${escapeHtml(it.note)}</div>` : ""}
            </div>
          </div>
          <div class="list__right">
            <button class="btn" data-edit-schedule="${it.id}">編集</button>
            <button class="btn btn--ghost" data-del-schedule="${it.id}">削除</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // reuse handlers（既存の編集/削除の関数がある前提で同様に実装）
  const allSchedules = load(STORAGE_KEYS.schedules, []);

  $all("[data-del-schedule]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del-schedule");
      if (!confirm("この予定を削除しますか？")) return;
      save(STORAGE_KEYS.schedules, allSchedules.filter(s=>s.id!==id));
      renderCalendar();
      renderSelectedDay();
    });
  });

  $all("[data-edit-schedule]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-edit-schedule");
      const it = allSchedules.find(s=>s.id===id);
      if (!it) return;

      // 既存の編集UIに合わせてフォームへ反映
      window.editingScheduleId = id; // 既存変数があれば上書きされてもOK
      document.getElementById("dlg-schedule-title").textContent = "予定を編集";
      document.getElementById("btn-schedule-save").textContent = "更新";

      document.getElementById("schDate").value = it.date || "";
      document.getElementById("schType").value = it.type || "practice";
      document.getElementById("schTitle").value = it.title || "";
      document.getElementById("schStart").value = it.startTime || "";
      document.getElementById("schEnd").value = it.endTime || "";
      document.getElementById("schNote").value = it.note || "";

      openDialog("dlg-schedule");
    });
  });
}
