const stages = [
  {
    id: 1,
    meta: "Stage 1 / choose 5",
    title: "從牌庫拖 5 張到選擇區",
    hint: "請選出能連回具體故事或經驗的卡。選滿 5 張後，在選擇區拖曳排序。",
    selectedLimit: 5,
    removedLimit: 0,
    prompts: [
      "每一張卡背後，分別讓你想到哪個工作、生活或選擇經驗？",
      "哪一張卡最能連回一個具體故事，而不是抽象偏好？",
      "如果只能留下五張，你會怎麼排第一名到第五名？排序理由是什麼？"
    ]
  },
  {
    id: 2,
    meta: "Stage 2 / keep 3",
    title: "從 5 張中移除 2 張，留下 3 張重新排序",
    hint: "第二階段是取捨題：從 5 張裡淘汰 2 張。留下的 3 張請重新排序為目前前三名。",
    selectedLimit: 5,
    removedLimit: 2,
    prompts: [
      "如果一定要淘汰兩張，你會先放下哪兩張？為什麼？",
      "留下的三張裡，哪一張最像底線？",
      "前三名重新排序後，第一名和第二名的差異變清楚了嗎？"
    ]
  }
];

const values = [
  { name: "利他主義", hint: "重視幫助他人與共同福祉", image: "assets/cards/v1.png" },
  { name: "獨立性", hint: "能自主決定方向與做法", image: "assets/cards/v2.png" },
  { name: "創造力", hint: "做出新的想法、作品或方法", image: "assets/cards/v3.png" },
  { name: "美的追求", hint: "重視美感、品質與體驗", image: "assets/cards/v4.png" },
  { name: "智性的刺激", hint: "被思考、學習與解題激發", image: "assets/cards/v5.png" },
  { name: "成就感", hint: "看見努力產生結果", image: "assets/cards/v7.png" },
  { name: "聲望", hint: "被肯定、看見與尊重", image: "assets/cards/v8.png" },
  { name: "管理的權力", hint: "能帶領、決策與配置資源", image: "assets/cards/v9.png" },
  { name: "經濟的報酬", hint: "收入、交換與資源回饋", image: "assets/cards/v10.png" },
  { name: "安全感", hint: "風險可控、不被迫失衡", image: "assets/cards/v11.png" },
  { name: "工作環境", hint: "重視工作場域、氛圍與條件", image: "assets/cards/v12.png" },
  { name: "與上司的關係", hint: "支持、信任與良好指導", image: "assets/cards/v13.png" },
  { name: "與同事的關係", hint: "合作、信任與團隊歸屬", image: "assets/cards/v14.png" },
  { name: "生活方式的選擇", hint: "工作服務於想要的生活", image: "assets/cards/v15.png" },
  { name: "變異性", hint: "接受變化、探索多種可能", image: "assets/cards/v16.png" }
];

const noteTypeLabels = {
  expression: "個案明確表達",
  observation: "主持人觀察",
  hypothesis: "主持人推測",
  insight: "共同洞察"
};

const storageKey = "career-values-card-table-v3";
let state = loadState();
let draggedCard = null;

function defaultState() {
  return {
    stage: 1,
    sidebarOpen: true,
    sessionTitle: "",
    participantAlias: "",
    sessionGoal: "",
    selectedValues: [],
    removedValues: [],
    notes: []
  };
}

function loadState() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function byId(id) {
  return document.getElementById(id);
}

function currentStage() {
  return stages.find((stage) => stage.id === state.stage) || stages[0];
}

function render() {
  renderStage();
  renderSessionFields();
  renderCardBank();
  renderSelectedTrack();
  renderRemovedTrack();
  renderNotes();
  renderSummary();
  byId("sideDrawer").classList.toggle("collapsed", !state.sidebarOpen);
  document.querySelector(".table-layout").classList.toggle("drawer-closed", !state.sidebarOpen);
  saveState();
}

function renderStage() {
  const stage = currentStage();
  byId("stageMeta").textContent = stage.meta;
  byId("stageTitle").textContent = stage.title;
  byId("stageHint").textContent = stage.hint;
  byId("promptStageLabel").textContent = `Stage ${stage.id}`;
  byId("promptList").innerHTML = stage.prompts.map((prompt) => `<div class="prompt-card">${escapeHtml(prompt)}</div>`).join("");
  byId("stageOneButton").classList.toggle("active", state.stage === 1);
  byId("stageTwoButton").classList.toggle("active", state.stage === 2);
  byId("removedZone").classList.toggle("locked", state.stage === 1);
  byId("selectedZoneTitle").textContent = state.stage === 1 ? "選擇區" : "保留排序區";
}

function renderSessionFields() {
  byId("sessionTitle").value = state.sessionTitle;
  byId("participantAlias").value = state.participantAlias;
  byId("sessionGoal").value = state.sessionGoal;
}

function renderCardBank() {
  const bank = byId("cardBank");
  bank.innerHTML = "";
  values.forEach((value) => {
    bank.append(createCard(value, "deck"));
  });
  byId("deckCount").textContent = `${values.length} 張`;
}

function renderSelectedTrack() {
  const track = byId("selectedTrack");
  track.innerHTML = "";
  const activeSelected = state.selectedValues.filter((name) => !state.removedValues.includes(name));
  const slotCount = state.stage === 1 ? 5 : Math.max(3, activeSelected.length);

  for (let index = 0; index < slotCount; index += 1) {
    const name = activeSelected[index];
    const slot = document.createElement("div");
    slot.className = "rank-slot";
    slot.innerHTML = `<div class="slot-label">${index + 1}</div>`;
    const drop = document.createElement("div");
    drop.className = "slot-drop";
    drop.dataset.zone = "selected";
    drop.dataset.index = String(index);
    wireDropZone(drop);
    if (name) {
      drop.append(createCard(findValue(name), "selected"));
    } else {
      drop.innerHTML = `<span class="slot-empty">拖到這裡</span>`;
    }
    slot.append(drop);
    track.append(slot);
  }

  byId("selectedCount").textContent = state.stage === 1
    ? `${state.selectedValues.length} / 5`
    : `保留 ${activeSelected.length} / 3`;
}

function renderRemovedTrack() {
  const track = byId("removedTrack");
  track.innerHTML = "";
  for (let index = 0; index < 2; index += 1) {
    const name = state.removedValues[index];
    const drop = document.createElement("div");
    drop.className = "slot-drop";
    drop.dataset.zone = "removed";
    drop.dataset.index = String(index);
    wireDropZone(drop);
    if (name) {
      drop.append(createCard(findValue(name), "removed"));
    } else {
      drop.innerHTML = `<span class="slot-empty">${state.stage === 1 ? "第二階段使用" : "拖入淘汰卡"}</span>`;
    }
    track.append(drop);
  }
  byId("removedCount").textContent = `${state.removedValues.length} / 2`;
}

function createCard(value, origin) {
  const button = document.createElement("button");
  const isSelected = state.selectedValues.includes(value.name);
  const isRemoved = state.removedValues.includes(value.name);
  button.type = "button";
  button.className = `value-card${isSelected && origin === "deck" ? " is-selected" : ""}${isRemoved ? " is-removed" : ""}`;
  button.draggable = true;
  button.dataset.value = value.name;
  button.dataset.origin = origin;
  button.innerHTML = `
    <img class="card-image" src="${escapeHtml(value.image)}" alt="${escapeHtml(value.name)}" draggable="false" />
    <span class="card-fallback">${escapeHtml(value.name)}</span>
  `;
  button.addEventListener("dragstart", (event) => {
    draggedCard = value.name;
    event.dataTransfer.setData("text/plain", value.name);
    event.dataTransfer.effectAllowed = "move";
    button.classList.add("dragging");
  });
  button.addEventListener("dragend", () => {
    draggedCard = null;
    button.classList.remove("dragging");
  });
  button.addEventListener("click", () => handleCardClick(value.name, origin));
  return button;
}

function wireDropZone(element) {
  element.addEventListener("dragover", (event) => {
    if (!draggedCard) return;
    event.preventDefault();
    element.classList.add("drag-over");
  });
  element.addEventListener("dragleave", () => element.classList.remove("drag-over"));
  element.addEventListener("drop", (event) => {
    event.preventDefault();
    element.classList.remove("drag-over");
    const name = event.dataTransfer.getData("text/plain");
    moveCardToZone(name, element.dataset.zone, Number(element.dataset.index));
  });
}

function handleCardClick(name, origin) {
  if (origin === "deck") {
    moveCardToZone(name, "selected", state.selectedValues.length);
    return;
  }
  if (origin === "selected" && state.stage === 1) {
    returnCardToDeck(name);
    return;
  }
  if (origin === "selected" && state.stage === 2) {
    moveCardToZone(name, "removed", state.removedValues.length);
    return;
  }
  if (origin === "removed") {
    moveCardToZone(name, "selected", state.selectedValues.length);
  }
}

function returnCardToDeck(name) {
  state.selectedValues = state.selectedValues.filter((value) => value !== name);
  state.removedValues = state.removedValues.filter((value) => value !== name);
  normalizeStageState();
  render();
}

function moveCardToZone(name, zone, index) {
  if (!findValue(name)) return;

  if (zone === "selected") {
    state.removedValues = state.removedValues.filter((value) => value !== name);
    const next = state.selectedValues.filter((value) => value !== name);
    const max = currentStage().selectedLimit;
    if (next.length >= max) return;
    next.splice(Math.max(0, Math.min(index, next.length)), 0, name);
    state.selectedValues = next;
  }

  if (zone === "removed") {
    if (state.stage === 1) return;
    if (!state.selectedValues.includes(name)) return;
    const next = state.removedValues.filter((value) => value !== name);
    if (next.length >= currentStage().removedLimit) return;
    next.splice(Math.max(0, Math.min(index, next.length)), 0, name);
    state.removedValues = next;
  }

  normalizeStageState();
  render();
}

function normalizeStageState() {
  const validNames = new Set(values.map((value) => value.name));
  state.selectedValues = state.selectedValues.filter((name) => validNames.has(name));
  state.removedValues = state.removedValues.filter((name) => validNames.has(name));

  if (state.stage === 1) {
    state.removedValues = [];
    state.selectedValues = state.selectedValues.slice(0, 5);
  }
  if (state.stage === 2) {
    state.selectedValues = state.selectedValues.slice(0, 5);
    state.removedValues = state.removedValues.filter((name) => state.selectedValues.includes(name)).slice(0, 2);
  }
}

function findValue(name) {
  return values.find((value) => value.name === name);
}

function setStage(stage) {
  state.stage = stage;
  normalizeStageState();
  render();
}

function renderNotes() {
  const board = byId("noteBoard");
  if (state.notes.length === 0) {
    board.innerHTML = `<p class="empty-state">把原話、觀察、推測和共同洞察分開記。</p>`;
    return;
  }

  board.innerHTML = "";
  state.notes.forEach((note, index) => {
    const article = document.createElement("article");
    article.className = "note-card";
    article.innerHTML = `
      <header>
        <strong>${escapeHtml(noteTypeLabels[note.type])}</strong>
        <button class="delete-note" type="button">刪除</button>
      </header>
      <p>${escapeHtml(note.text)}</p>
    `;
    article.querySelector("button").addEventListener("click", () => deleteNote(index));
    board.append(article);
  });
}

function renderSummary() {
  const kept = state.selectedValues.filter((name) => !state.removedValues.includes(name));
  const ranked = kept.length ? kept.map((name, index) => `${index + 1}. ${name}`).join("\n") : "尚未完成排序";
  const removed = state.removedValues.length ? state.removedValues.map((name) => `- ${name}`).join("\n") : "- 尚未淘汰";
  const groupedNotes = Object.entries(noteTypeLabels).map(([type, label]) => {
    const notes = state.notes.filter((note) => note.type === type);
    const body = notes.length ? notes.map((note) => `- ${note.text}`).join("\n") : "- 尚未記錄";
    return `## ${label}\n${body}`;
  }).join("\n\n");

  byId("summaryOutput").value = `# ${state.sessionTitle || "職涯價值觀工作坊紀錄"}

參與者代稱：${state.participantAlias || "未填"}
本次目標：${state.sessionGoal || "未填"}
目前階段：第 ${state.stage} 階段

## 前三名排序
${ranked}

## 第二階段淘汰
${removed}

${groupedNotes}`;
}

function addNote() {
  const text = byId("noteText").value.trim();
  if (!text) return;
  state.notes = [{ type: byId("noteType").value, text, createdAt: new Date().toISOString() }, ...state.notes];
  byId("noteText").value = "";
  render();
}

function deleteNote(index) {
  state.notes.splice(index, 1);
  render();
}

function downloadSession() {
  const payload = {
    exportedAt: new Date().toISOString(),
    state,
    markdown: byId("summaryOutput").value
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `career-values-card-table-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function copySummary() {
  await navigator.clipboard.writeText(byId("summaryOutput").value);
  byId("copySummaryButton").textContent = "已複製";
  window.setTimeout(() => {
    byId("copySummaryButton").textContent = "複製摘要";
  }, 1200);
}

function resetSession() {
  const ok = window.confirm("確定要清除目前這場工作坊的本機紀錄嗎？");
  if (!ok) return;
  state = defaultState();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

byId("stageOneButton").addEventListener("click", () => setStage(1));
byId("stageTwoButton").addEventListener("click", () => setStage(2));
byId("sidebarToggle").addEventListener("click", () => {
  state.sidebarOpen = !state.sidebarOpen;
  render();
});
byId("sessionTitle").addEventListener("input", (event) => {
  state.sessionTitle = event.target.value;
  renderSummary();
  saveState();
});
byId("participantAlias").addEventListener("input", (event) => {
  state.participantAlias = event.target.value;
  renderSummary();
  saveState();
});
byId("sessionGoal").addEventListener("input", (event) => {
  state.sessionGoal = event.target.value;
  renderSummary();
  saveState();
});
byId("addNoteButton").addEventListener("click", addNote);
byId("refreshSummaryButton").addEventListener("click", renderSummary);
byId("downloadButton").addEventListener("click", downloadSession);
byId("copySummaryButton").addEventListener("click", copySummary);
byId("resetButton").addEventListener("click", resetSession);

normalizeStageState();
render();
