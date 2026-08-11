const PHASE = {
  SETUP: "setup",
  FACEOFF: "faceoff",
  PLAY: "play",
  STEAL: "steal",
  ROUND_DONE: "round_done",
};

const state = {
  rounds: [],
  roundIndex: 0,
  phase: PHASE.SETUP,
  scores: { A: 0, B: 0 },
  names: { A: "TIM A", B: "TIM B" },
  control: null,
  strikes: 0,
  boardPoints: 0,
  revealed: [],
  stealTeam: null,
};

const els = {
  questionText: document.getElementById("questionText"),
  answerBoard: document.getElementById("answerBoard"),
  strikes: document.getElementById("strikes"),
  phaseBadge: document.getElementById("phaseBadge"),
  roundLabel: document.getElementById("roundLabel"),
  boardPoints: document.getElementById("boardPoints"),
  controlTeam: document.getElementById("controlTeam"),
  wrongBtn: document.getElementById("wrongBtn"),
  faceOffA: document.getElementById("faceOffA"),
  faceOffB: document.getElementById("faceOffB"),
  stealBtn: document.getElementById("stealBtn"),
  passStealBtn: document.getElementById("passStealBtn"),
  revealBtn: document.getElementById("revealBtn"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  startBtn: document.getElementById("startBtn"),
  setupBox: document.getElementById("setupBox"),
  statusText: document.getElementById("statusText"),
  scoreA: document.getElementById("scoreA"),
  scoreB: document.getElementById("scoreB"),
  teamA: document.getElementById("teamA"),
  teamB: document.getElementById("teamB"),
  nameA: document.getElementById("nameA"),
  nameB: document.getElementById("nameB"),
  toast: document.getElementById("toast"),
};

function currentRound() {
  return state.rounds[state.roundIndex];
}

function canHostAct() {
  return [PHASE.FACEOFF, PHASE.PLAY, PHASE.STEAL].includes(state.phase);
}

function phaseLabel(phase) {
  return {
    [PHASE.SETUP]: "Setup",
    [PHASE.FACEOFF]: "Face-off",
    [PHASE.PLAY]: "Main",
    [PHASE.STEAL]: "Steal",
    [PHASE.ROUND_DONE]: "Selesai",
  }[phase];
}

function showToast(message) {
  clearTimeout(showToast._hide);
  clearTimeout(showToast._remove);

  els.toast.hidden = false;
  els.toast.textContent = message;

  // Restart animation even if toast already visible
  els.toast.classList.remove("show");
  void els.toast.offsetWidth;
  els.toast.classList.add("show");

  showToast._hide = setTimeout(() => {
    els.toast.classList.remove("show");
    showToast._remove = setTimeout(() => {
      els.toast.hidden = true;
      els.toast.textContent = "";
    }, 280);
  }, 1500);
}

function defaultStatus() {
  if (state.phase === PHASE.SETUP) {
    return "Klik nama tim di atas untuk edit, lalu tekan Mulai.";
  }
  if (state.phase === PHASE.FACEOFF) {
    return "Face-off: klik nomor 1–5 jika benar, atau Salah.";
  }
  if (state.phase === PHASE.PLAY) {
    return `${state.names[state.control]} main. Klik baris atau Salah.`;
  }
  if (state.phase === PHASE.STEAL) {
    return `${state.names[state.stealTeam]} steal: klik jawaban atau Salah.`;
  }
  if (state.phase === PHASE.ROUND_DONE) {
    return "Ronde selesai. Lanjut lewat Ronde+.";
  }
  return "";
}

function setStatus(message, { sticky = false } = {}) {
  els.statusText.textContent = message;
  clearTimeout(setStatus._t);
  if (sticky) return;
  setStatus._t = setTimeout(() => {
    els.statusText.textContent = defaultStatus();
  }, 2500);
}

function syncNamesFromInputs() {
  state.names.A = (els.nameA.value || "TIM A").trim().toUpperCase() || "TIM A";
  state.names.B = (els.nameB.value || "TIM B").trim().toUpperCase() || "TIM B";
}

function renderScores() {
  els.scoreA.textContent = String(state.scores.A);
  els.scoreB.textContent = String(state.scores.B);
  // Jangan overwrite input saat user sedang mengetik
  if (document.activeElement !== els.nameA) els.nameA.value = state.names.A;
  if (document.activeElement !== els.nameB) els.nameB.value = state.names.B;
  els.teamA.classList.toggle("active", state.control === "A");
  els.teamB.classList.toggle("active", state.control === "B");
}

function renderStrikes() {
  els.strikes.querySelectorAll(".strike").forEach((node) => {
    const n = Number(node.dataset.n);
    node.classList.toggle("on", n <= state.strikes);
  });
}

function renderBoard() {
  const round = currentRound();
  if (!round) return;

  els.questionText.textContent = round.question;
  els.roundLabel.textContent = `Ronde ${state.roundIndex + 1}/${state.rounds.length}`;
  els.boardPoints.textContent = String(state.boardPoints);
  els.phaseBadge.textContent = phaseLabel(state.phase);
  els.controlTeam.textContent = state.control
    ? state.names[state.control]
    : "—";

  const active = canHostAct();
  els.answerBoard.innerHTML = "";

  round.answers.forEach((answer, index) => {
    const revealed = state.revealed[index];
    const clickable = !revealed && active;
    const row = document.createElement("div");
    row.className = `row ${revealed ? "is-revealed" : clickable ? "is-clickable" : ""}`;
    if (clickable) {
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Buka jawaban nomor ${index + 1}`);
      row.addEventListener("click", () => hostReveal(index));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          hostReveal(index);
        }
      });
    }
    row.innerHTML = `
      <div class="cell rank">${index + 1}</div>
      <div class="cell answer ${revealed ? "revealed" : ""}">
        <span class="slot">${revealed ? answer.text : "••••••••"}</span>
      </div>
      <div class="cell points">${answer.points}</div>
    `;

    els.answerBoard.appendChild(row);
  });

  renderStrikes();
  renderScores();
  updateControls();
}

function updateControls() {
  const playing =
    state.phase === PHASE.PLAY ||
    state.phase === PHASE.STEAL ||
    state.phase === PHASE.FACEOFF;
  const roundDone = state.phase === PHASE.ROUND_DONE;
  const hasMore = state.roundIndex < state.rounds.length - 1;

  els.setupBox.classList.toggle("hidden", state.phase !== PHASE.SETUP);
  els.wrongBtn.disabled = !canHostAct();
  els.faceOffA.disabled = state.phase !== PHASE.FACEOFF;
  els.faceOffB.disabled = state.phase !== PHASE.FACEOFF;
  const canStealChoice = state.phase === PHASE.PLAY && state.strikes >= 3;
  els.stealBtn.disabled = !canStealChoice;
  els.passStealBtn.disabled = !canStealChoice;
  els.revealBtn.disabled = !(playing || roundDone);
  els.nextRoundBtn.disabled = !(roundDone && hasMore);

  if (state.phase === PHASE.SETUP) {
    els.nextRoundBtn.textContent = "Ronde+";
  } else if (!hasMore && roundDone) {
    els.nextRoundBtn.textContent = "Selesai";
    els.nextRoundBtn.disabled = false;
  }
}

function allRevealed() {
  return state.revealed.every(Boolean);
}

function awardBoard(team) {
  state.scores[team] += state.boardPoints;
  state.boardPoints = 0;
  state.control = team;
  state.phase = PHASE.ROUND_DONE;
  setStatus(`${state.names[team]} menang ronde. Poin masuk skor.`, { sticky: true });
  showToast(`${state.names[team]} +poin`);
  renderBoard();
}

/** Lawan menolak steal: poin papan hangus, tidak masuk ke tim mana pun. */
function forfeitBoard() {
  const lost = state.boardPoints;
  state.boardPoints = 0;
  state.stealTeam = null;
  state.phase = PHASE.ROUND_DONE;
  setStatus(
    `Tidak steal. Poin papan hangus (${lost}). Lanjut Ronde+.`,
    { sticky: true }
  );
  showToast("Poin hangus");
  renderBoard();
}

function revealAnswer(index) {
  if (state.revealed[index]) return false;
  state.revealed[index] = true;
  state.boardPoints += currentRound().answers[index].points;
  return true;
}

function hostReveal(index) {
  if (!canHostAct() || state.revealed[index]) return;

  const answer = currentRound().answers[index];
  revealAnswer(index);
  showToast(`#${index + 1} · ${answer.points}`);

  if (state.phase === PHASE.FACEOFF) {
    setStatus(`Face-off #${index + 1}. Pilih tim: → Tim A / → Tim B`, {
      sticky: true,
    });
    renderBoard();
    return;
  }

  if (state.phase === PHASE.STEAL) {
    awardBoard(state.stealTeam);
    return;
  }

  if (allRevealed()) {
    awardBoard(state.control);
    return;
  }

  setStatus(`Benar (#${index + 1}). Lanjut klik baris, atau Salah.`);
  renderBoard();
}

function startRound() {
  const round = currentRound();
  state.phase = PHASE.FACEOFF;
  state.control = null;
  state.strikes = 0;
  state.boardPoints = 0;
  state.revealed = round.answers.map(() => false);
  state.stealTeam = null;
  setStatus("Face-off: klik nomor jawaban yang benar, lalu pilih tim.", {
    sticky: true,
  });
  renderBoard();
}

function beginPlay(team) {
  state.control = team;
  state.phase = PHASE.PLAY;
  state.strikes = 0;
  setStatus(`${state.names[team]} main. Klik baris 1–5 atau tombol Salah.`, {
    sticky: true,
  });
  renderBoard();
}

function handleWrong() {
  if (!canHostAct()) return;

  if (state.phase === PHASE.FACEOFF) {
    setStatus("Salah face-off. Giliran tim lain.");
    showToast("X");
    renderBoard();
    return;
  }

  if (state.phase === PHASE.STEAL) {
    const defender = state.control;
    setStatus(`Steal gagal. ${state.names[defender]} dapat poin.`);
    showToast("Steal gagal");
    awardBoard(defender);
    return;
  }

  state.strikes = Math.min(3, state.strikes + 1);
  showToast("X");
  if (state.strikes >= 3) {
    const other = state.control === "A" ? "B" : "A";
    setStatus(
      `3 X! ${state.names[other]}: Steal atau Tidak Steal (poin hangus).`,
      { sticky: true }
    );
  } else {
    setStatus(`Salah ${state.strikes}/3`);
  }
  renderBoard();
}

function startSteal() {
  if (state.phase !== PHASE.PLAY || state.strikes < 3) return;
  state.stealTeam = state.control === "A" ? "B" : "A";
  state.phase = PHASE.STEAL;
  setStatus(
    `${state.names[state.stealTeam]} steal: klik jawaban benar atau Salah.`,
    { sticky: true }
  );
  renderBoard();
}

function passSteal() {
  if (state.phase !== PHASE.PLAY || state.strikes < 3) return;
  forfeitBoard();
}

function revealAll() {
  const round = currentRound();
  round.answers.forEach((_, index) => {
    if (!state.revealed[index]) {
      if (state.phase !== PHASE.ROUND_DONE) revealAnswer(index);
      else state.revealed[index] = true;
    }
  });
  if (state.phase !== PHASE.ROUND_DONE && state.phase !== PHASE.SETUP) {
    setStatus("Semua jawaban dibuka.");
  }
  renderBoard();
}

function nextRound() {
  if (
    state.phase === PHASE.ROUND_DONE &&
    state.roundIndex >= state.rounds.length - 1
  ) {
    const winner =
      state.scores.A === state.scores.B
        ? "Seri!"
        : state.scores.A > state.scores.B
          ? `${state.names.A} menang!`
          : `${state.names.B} menang!`;
    setStatus(`Selesai. ${winner} ${state.scores.A} – ${state.scores.B}`, {
      sticky: true,
    });
    state.phase = PHASE.SETUP;
    els.setupBox.classList.remove("hidden");
    els.nextRoundBtn.textContent = "Ronde+";
    updateControls();
    return;
  }

  if (state.roundIndex < state.rounds.length - 1) {
    state.roundIndex += 1;
    startRound();
  }
}

async function loadSurvey() {
  const res = await fetch("./data/survey.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat survey.json");
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "survey.json rusak formatnya. Cek tanda kutip dan tulis points dengan benar."
    );
  }
  if (!Array.isArray(data.rounds) || data.rounds.length === 0) {
    throw new Error("survey.json kosong");
  }
  state.rounds = data.rounds;
}

function wireEvents() {
  const commitNames = () => {
    syncNamesFromInputs();
    renderScores();
    // Update label tombol/status yang pakai nama tim
    if (state.control) {
      els.controlTeam.textContent = state.names[state.control];
    }
  };

  els.nameA.addEventListener("input", commitNames);
  els.nameB.addEventListener("input", commitNames);
  els.nameA.addEventListener("change", commitNames);
  els.nameB.addEventListener("change", commitNames);

  els.startBtn.addEventListener("click", () => {
    syncNamesFromInputs();
    state.scores = { A: 0, B: 0 };
    state.roundIndex = 0;
    startRound();
  });

  els.wrongBtn.addEventListener("click", handleWrong);
  els.faceOffA.addEventListener("click", () => beginPlay("A"));
  els.faceOffB.addEventListener("click", () => beginPlay("B"));
  els.stealBtn.addEventListener("click", startSteal);
  els.passStealBtn.addEventListener("click", passSteal);
  els.revealBtn.addEventListener("click", revealAll);
  els.nextRoundBtn.addEventListener("click", nextRound);

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "x" || e.key === "X") {
      e.preventDefault();
      handleWrong();
    }
    if (e.key >= "1" && e.key <= "5") {
      e.preventDefault();
      hostReveal(Number(e.key) - 1);
    }
  });
}

async function init() {
  wireEvents();
  try {
    await loadSurvey();
    const first = currentRound();
    state.revealed = first.answers.map(() => false);
    renderBoard();
    setStatus("Klik nama tim di atas untuk edit, lalu tekan Mulai.", {
      sticky: true,
    });
  } catch (err) {
    els.questionText.textContent = "SURVEY BELUM SIAP";
    setStatus(err.message + " · jalankan via local server.", { sticky: true });
  }
}

init();
