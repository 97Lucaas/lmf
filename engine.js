const DEFAULT_PRIZES = [50, 100, 200, 400, 600, 1000, 1500, 3000, 5000];
const DEFAULT_TIMER_SECONDS = 150;

const state = {
    players: ["Joueur 1", "Joueur 2"],
    prizes: [...DEFAULT_PRIZES],
    timerSeconds: DEFAULT_TIMER_SECONDS,
    startingPlayerIndex: 0,
    currentPlayerIndex: 0,
    currentStep: 0,
    roundBank: 0,
    totalBank: 0,
    round: 1,
    timerRemaining: DEFAULT_TIMER_SECONDS,
    timerStopped: true,
    intervalId: null,
    gameStarted: false,
    roundEnded: false,
    roundEndReason: "",
    currentScreen: "setup",
    roundPlayerStats: [],
    rankedRoundStats: []
};

const elements = {};

window.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    bindSetupEvents();
    bindKeyboardEvents();
    renderSetup();
    syncGameBoard();
});

function cacheElements() {
    elements.setupScreen = document.getElementById("setup-screen");
    elements.gameScreen = document.getElementById("game-screen");
    elements.statsScreen = document.getElementById("stats-screen");
    elements.playersList = document.getElementById("players-list");
    elements.startingPlayer = document.getElementById("starting-player");
    elements.timerSeconds = document.getElementById("timer-seconds");
    elements.prizesList = document.getElementById("prizes-list");
    elements.setupError = document.getElementById("setup-error");
    elements.time = document.getElementById("time");
    elements.bank = document.getElementById("bank");
    elements.currentPlayer = document.getElementById("current-player");
    elements.roundNumber = document.getElementById("round-number");
    elements.roundBankLabel = document.getElementById("round-bank-label");
    elements.totalBankLabel = document.getElementById("total-bank-label");
    elements.roundEndPanel = document.getElementById("round-end-panel");
    elements.roundEndTitle = document.getElementById("round-end-title");
    elements.roundEndReason = document.getElementById("round-end-reason");
    elements.statsRoundTitle = document.getElementById("stats-round-title");
    elements.statsRoundEarned = document.getElementById("stats-round-earned");
    elements.statsTotalBank = document.getElementById("stats-total-bank");
    elements.statsRows = document.getElementById("stats-rows");
    elements.strongestPlayerName = document.getElementById("strongest-player-name");
    elements.strongestPlayerCorrect = document.getElementById("strongest-player-correct");
    elements.strongestPlayerWrong = document.getElementById("strongest-player-wrong");
    elements.strongestPlayerBanked = document.getElementById("strongest-player-banked");
    elements.strongestPlayerLost = document.getElementById("strongest-player-lost");
    elements.weakestPlayerName = document.getElementById("weakest-player-name");
    elements.weakestPlayerCorrect = document.getElementById("weakest-player-correct");
    elements.weakestPlayerWrong = document.getElementById("weakest-player-wrong");
    elements.weakestPlayerBanked = document.getElementById("weakest-player-banked");
    elements.weakestPlayerLost = document.getElementById("weakest-player-lost");
}

function bindSetupEvents() {
    document.getElementById("add-player").addEventListener("click", () => {
        state.players.push("Nouveau joueur");
        renderSetup();
    });

    document.getElementById("reset-prizes").addEventListener("click", () => {
        state.prizes = [...DEFAULT_PRIZES];
        renderSetup();
    });

    document.getElementById("start-game").addEventListener("click", startGameFromSetup);
    document.getElementById("back-to-setup").addEventListener("click", returnToSetup);
    document.getElementById("go-to-stats").addEventListener("click", goToStatisticsScreen);
    document.getElementById("next-round").addEventListener("click", startNextRound);

    elements.timerSeconds.addEventListener("change", (event) => {
        elements.timerSeconds.value = sanitizeTimerValue(event.target.value);
    });
}

function bindKeyboardEvents() {
    document.addEventListener("keyup", (event) => {
        if (!state.gameStarted || state.currentScreen !== "game" || state.roundEnded) {
            return;
        }

        const key = event.key.toLowerCase();

        if (key === "v") {
            handleCorrectAnswer();
        }

        if (key === "b") {
            handleBank();
        }

        if (key === "n") {
            handleWrongAnswer();
        }

        if (key === "p") {
            toggleTimer();
        }

        if (key === "s") {
            endRound("Manche terminee manuellement.");
        }
    });
}

function renderSetup() {
    renderPlayersList();
    renderStartingPlayerOptions();
    renderPrizesList();
    elements.timerSeconds.value = state.timerSeconds;
}

function renderPlayersList() {
    elements.playersList.innerHTML = "";

    state.players.forEach((player, index) => {
        const row = document.createElement("div");
        row.className = "player-row";

        const input = document.createElement("input");
        input.type = "text";
        input.value = player;
        input.placeholder = "Prenom du joueur";
        input.addEventListener("input", (event) => {
            state.players[index] = event.target.value;
            renderStartingPlayerOptions();
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Supprimer";
        removeButton.disabled = state.players.length === 1;
        removeButton.addEventListener("click", () => {
            if (state.players.length === 1) {
                return;
            }

            state.players.splice(index, 1);
            if (state.currentPlayerIndex >= state.players.length) {
                state.currentPlayerIndex = 0;
            }
            renderSetup();
        });

        row.appendChild(input);
        row.appendChild(removeButton);
        elements.playersList.appendChild(row);
    });
}

function renderStartingPlayerOptions() {
    const previousValue = elements.startingPlayer.value;
    elements.startingPlayer.innerHTML = "";

    state.players.forEach((player, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = normalizePlayerName(player, index);
        elements.startingPlayer.appendChild(option);
    });

    const nextValue = previousValue && Number(previousValue) < state.players.length
        ? previousValue
        : String(state.startingPlayerIndex);

    elements.startingPlayer.value = nextValue;
}

function renderPrizesList() {
    elements.prizesList.innerHTML = "";

    state.prizes.forEach((prize, index) => {
        const row = document.createElement("div");
        row.className = "prize-row";

        const label = document.createElement("label");
        label.setAttribute("for", `prize-${index}`);
        label.textContent = `${index + 1}.`;

        const input = document.createElement("input");
        input.id = `prize-${index}`;
        input.type = "number";
        input.min = "0";
        input.step = "10";
        input.value = prize;
        input.addEventListener("input", (event) => {
            state.prizes[index] = sanitizePrizeValue(event.target.value);
        });

        row.appendChild(label);
        row.appendChild(input);
        elements.prizesList.appendChild(row);
    });
}

function startGameFromSetup() {
    const cleanedPlayers = state.players.map((player, index) => normalizePlayerName(player, index));
    const timerValue = sanitizeTimerValue(elements.timerSeconds.value);
    const prizes = Array.from(elements.prizesList.querySelectorAll("input")).map((input) => sanitizePrizeValue(input.value));

    if (cleanedPlayers.length === 0) {
        elements.setupError.textContent = "Ajoute au moins un joueur pour lancer la partie.";
        return;
    }

    state.players = cleanedPlayers;
    state.prizes = prizes;
    state.timerSeconds = timerValue;
    state.startingPlayerIndex = clampStartingPlayerIndex(elements.startingPlayer.value, state.players.length);
    state.currentPlayerIndex = state.startingPlayerIndex;
    state.round = 1;
    state.totalBank = 0;
    state.gameStarted = true;
    elements.setupError.textContent = "";

    initializeRoundState();
    switchScreen("game");
    syncGameBoard();
    startTimer();
}

function returnToSetup() {
    state.gameStarted = false;
    state.timerStopped = true;
    state.roundEnded = false;
    clearInterval(state.intervalId);
    state.intervalId = null;
    switchScreen("setup");
    renderSetup();
}

function switchScreen(screenName) {
    state.currentScreen = screenName;
    elements.setupScreen.classList.toggle("hidden", screenName !== "setup");
    elements.gameScreen.classList.toggle("hidden", screenName !== "game");
    elements.statsScreen.classList.toggle("hidden", screenName !== "stats");
}

function initializeRoundState() {
    state.currentPlayerIndex = state.startingPlayerIndex;
    state.currentStep = 0;
    state.roundBank = 0;
    state.timerRemaining = state.timerSeconds;
    state.timerStopped = true;
    state.roundEnded = false;
    state.roundEndReason = "";
    state.roundPlayerStats = createRoundPlayerStats();
    state.rankedRoundStats = [];
    elements.roundEndPanel.classList.add("hidden");
}

function createRoundPlayerStats() {
    return state.players.map((player) => ({
        name: player,
        correct: 0,
        wrong: 0,
        banked: 0,
        lost: 0
    }));
}

function syncGameBoard() {
    updatePrizeDisplay();
    updateScaleDisplay();
    updateBankDisplay();
    updateCurrentPlayerDisplay();
    updateRoundDisplay();
    updateTimerDisplay();
    updateRoundEndPanel();
}

function updatePrizeDisplay() {
    state.prizes.forEach((prize, index) => {
        const card = document.getElementById(`card${index + 1}`);
        if (card) {
            card.textContent = prize;
        }
    });
}

function updateScaleDisplay() {
    for (let index = 1; index <= state.prizes.length; index += 1) {
        const card = document.getElementById(`card${index}`);
        if (!card) {
            continue;
        }

        card.classList.toggle("active", index === state.currentStep);
    }
}

function updateBankDisplay() {
    elements.bank.textContent = String(state.roundBank);
    elements.roundBankLabel.textContent = String(state.roundBank);
    elements.totalBankLabel.textContent = String(state.totalBank);
}

function updateCurrentPlayerDisplay() {
    elements.currentPlayer.textContent = state.players[state.currentPlayerIndex] || "-";
}

function updateRoundDisplay() {
    elements.roundNumber.textContent = String(state.round);
}

function updateTimerDisplay() {
    const minutes = String(Math.floor(state.timerRemaining / 60)).padStart(2, "0");
    const seconds = String(state.timerRemaining % 60).padStart(2, "0");
    elements.time.textContent = `${minutes}:${seconds}`;
}

function updateRoundEndPanel() {
    elements.roundEndPanel.classList.toggle("hidden", !state.roundEnded);
    if (state.roundEnded) {
        elements.roundEndReason.textContent = state.roundEndReason;
    }
}

function startTimer() {
    clearInterval(state.intervalId);
    state.timerStopped = false;
    updateTimerDisplay();

    state.intervalId = window.setInterval(() => {
        if (state.timerStopped || state.roundEnded) {
            return;
        }

        if (state.timerRemaining <= 0) {
            endRound("Le chrono est ecoule.");
            return;
        }

        state.timerRemaining -= 1;
        updateTimerDisplay();

        if (state.timerRemaining <= 0) {
            endRound("Le chrono est ecoule.");
        }
    }, 1000);
}

function toggleTimer() {
    state.timerStopped = !state.timerStopped;
}

function handleCorrectAnswer() {
    const playerStats = getCurrentPlayerStats();
    playerStats.correct += 1;

    if (state.currentStep < state.prizes.length) {
        state.currentStep += 1;
    } else {
        const cappedAmount = getCappedAmount(state.prizes[state.prizes.length - 1]);
        applyBankGain(playerStats, cappedAmount);

        if (!state.roundEnded) {
            state.currentStep = 1;
        }
    }

    if (!state.roundEnded) {
        moveToNextPlayer();
    }

    syncGameBoard();
}

function handleBank() {
    const playerStats = getCurrentPlayerStats();
    const chainAmount = getCurrentChainAmount();

    if (chainAmount <= 0) {
        return;
    }

    const cappedAmount = getCappedAmount(chainAmount);

    applyBankGain(playerStats, cappedAmount);

    if (!state.roundEnded) {
        state.currentStep = 1;
    }

    syncGameBoard();
}

function handleWrongAnswer() {
    const playerStats = getCurrentPlayerStats();
    const chainAmount = getCurrentChainAmount();
    const cappedLostAmount = getCappedAmount(chainAmount);

    playerStats.wrong += 1;
    playerStats.lost += cappedLostAmount;
    state.currentStep = 1;

    moveToNextPlayer();
    syncGameBoard();
}

function applyBankGain(playerStats, amount) {
    if (amount <= 0) {
        return;
    }

    playerStats.banked += amount;
    state.roundBank += amount;
    state.totalBank += amount;

    if (state.roundBank >= getRoundMaximum()) {
        endRound("Le plafond de gains de cette manche est atteint.");
    }
}

function endRound(reason) {
    if (state.roundEnded) {
        return;
    }

    state.roundEnded = true;
    state.timerStopped = true;
    state.currentStep = 0;
    state.roundEndReason = reason;
    clearInterval(state.intervalId);
    state.intervalId = null;
    elements.roundEndTitle.textContent = `La manche ${state.round} est terminee`;
    syncGameBoard();
}

function goToStatisticsScreen() {
    state.rankedRoundStats = rankRoundStats();
    renderStatistics();
    switchScreen("stats");
}

function renderStatistics() {
    const rankedStats = state.rankedRoundStats;
    const strongestPlayer = rankedStats[0];
    const weakestPlayer = rankedStats[rankedStats.length - 1];

    elements.statsRoundTitle.textContent = `Resume de la manche ${state.round}`;
    elements.statsRoundEarned.textContent = String(state.roundBank);
    elements.statsTotalBank.textContent = String(state.totalBank);
    renderHighlightCard(strongestPlayer, "strongest");
    renderHighlightCard(weakestPlayer, "weakest");
    renderStatsRows(rankedStats);
}

function renderHighlightCard(playerStats, prefix) {
    elements[`${prefix}PlayerName`].textContent = playerStats.name;
    elements[`${prefix}PlayerCorrect`].textContent = String(playerStats.correct);
    elements[`${prefix}PlayerWrong`].textContent = String(playerStats.wrong);
    elements[`${prefix}PlayerBanked`].textContent = String(playerStats.banked);
    elements[`${prefix}PlayerLost`].textContent = String(playerStats.lost);
}

function renderStatsRows(rankedStats) {
    elements.statsRows.innerHTML = "";

    rankedStats.forEach((playerStats) => {
        const row = document.createElement("tr");

        [
            playerStats.name,
            String(playerStats.correct),
            String(playerStats.wrong),
            String(playerStats.banked),
            String(playerStats.lost)
        ].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        elements.statsRows.appendChild(row);
    });
}

function rankRoundStats() {
    return [...state.roundPlayerStats].sort((leftPlayer, rightPlayer) => {
        if (rightPlayer.correct !== leftPlayer.correct) {
            return rightPlayer.correct - leftPlayer.correct;
        }

        if (rightPlayer.banked !== leftPlayer.banked) {
            return rightPlayer.banked - leftPlayer.banked;
        }

        if (leftPlayer.lost !== rightPlayer.lost) {
            return leftPlayer.lost - rightPlayer.lost;
        }

        return leftPlayer.name.localeCompare(rightPlayer.name, "fr", { sensitivity: "base" });
    });
}

function startNextRound() {
    state.round += 1;
    initializeRoundState();
    switchScreen("game");
    syncGameBoard();
    startTimer();
}

function moveToNextPlayer() {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
}

function getCurrentPlayerStats() {
    return state.roundPlayerStats[state.currentPlayerIndex];
}

function getCurrentChainAmount() {
    if (state.currentStep <= 0) {
        return 0;
    }

    return state.prizes[state.currentStep - 1] || 0;
}

function getRoundMaximum() {
    return state.prizes[state.prizes.length - 1] || 0;
}

function getRemainingRoundCapacity() {
    return Math.max(0, getRoundMaximum() - state.roundBank);
}

function getCappedAmount(amount) {
    return Math.min(amount, getRemainingRoundCapacity());
}

function normalizePlayerName(player, index) {
    const trimmed = String(player || "").trim();
    return trimmed || `Joueur ${index + 1}`;
}

function sanitizeTimerValue(rawValue) {
    const parsed = Number.parseInt(rawValue, 10);

    if (Number.isNaN(parsed) || parsed < 10) {
        return 10;
    }

    return Math.max(10, Math.round(parsed / 10) * 10);
}

function sanitizePrizeValue(rawValue) {
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function clampStartingPlayerIndex(rawValue, playersCount) {
    const parsed = Number.parseInt(rawValue, 10);

    if (Number.isNaN(parsed) || parsed < 0 || parsed >= playersCount) {
        return 0;
    }

    return parsed;
}
