const DEFAULT_PRIZES = [50, 100, 200, 400, 600, 1000, 1500, 3000, 5000];
const DEFAULT_TIMER_SECONDS = 150;
const SAVED_PLAYERS_KEY = "lmf.players";
const AMBIENCE_TRACKS = {
    voting: "sounds/voting.mp3",
    penalty: "sounds/Penalty_Shootout.mp3",
    suddenDeath: "sounds/sudden_death.mp3"
};

const state = {
    players: ["Joueur 1", "Joueur 2"],
    basePrizes: [...DEFAULT_PRIZES],
    prizes: [...DEFAULT_PRIZES],
    timerSeconds: DEFAULT_TIMER_SECONDS,
    startingPlayerIndex: 0,
    currentPlayerIndex: 0,
    currentStep: 0,
    roundBank: 0,
    totalBank: 0,
    round: 1,
    eliminateEachRound: true,
    eliminatedPlayerIndex: "",
    timerRemaining: DEFAULT_TIMER_SECONDS,
    timerStopped: true,
    intervalId: null,
    roundAudio: null,
    ambienceAudio: null,
    ambienceTrack: "",
    gameStarted: false,
    roundEnded: false,
    roundEndReason: "",
    currentScreen: "setup",
    roundPlayerStats: [],
    rankedRoundStats: [],
    isTripleRound: false,
    finalReady: false,
    finalists: [],
    finalStrongestPlayer: "",
    finalStarted: false,
    finalCurrentPlayerIndex: 0,
    finalMode: "regular",
    finalWaitingForSuddenDeath: false,
    finalResults: [],
    suddenDeathRound: 0,
    finalWinner: ""
};

const elements = {};

window.addEventListener("DOMContentLoaded", () => {
    loadSavedPlayers();
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
    elements.finalScreen = document.getElementById("final-screen");
    elements.playersList = document.getElementById("players-list");
    elements.startingPlayer = document.getElementById("starting-player");
    elements.timerSeconds = document.getElementById("timer-seconds");
    elements.eliminateEachRound = document.getElementById("eliminate-each-round");
    elements.startGameButton = document.getElementById("start-game");
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
    elements.eliminationCard = document.getElementById("elimination-card");
    elements.eliminatedPlayer = document.getElementById("eliminated-player");
    elements.eliminationError = document.getElementById("elimination-error");
    elements.nextRoundButton = document.getElementById("next-round");
    elements.finalTitle = document.getElementById("final-title");
    elements.finalStatus = document.getElementById("final-status");
    elements.finalChoiceCard = document.getElementById("final-choice-card");
    elements.finalStrongestPlayer = document.getElementById("final-strongest-player");
    elements.finalTakeHand = document.getElementById("final-take-hand");
    elements.finalLeaveHand = document.getElementById("final-leave-hand");
    elements.finalBoard = document.getElementById("final-board");
    elements.finalControlCard = document.getElementById("final-control-card");
    elements.finalModeLabel = document.getElementById("final-mode-label");
    elements.finalCurrentPlayer = document.getElementById("final-current-player");
    elements.finalSuddenCard = document.getElementById("final-sudden-card");
    elements.startSuddenDeath = document.getElementById("start-sudden-death");
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
        savePlayers();
        renderSetup();
    });

    document.getElementById("reset-prizes").addEventListener("click", () => {
        state.basePrizes = [...DEFAULT_PRIZES];
        state.prizes = [...DEFAULT_PRIZES];
        renderSetup();
    });

    elements.startGameButton.addEventListener("click", startGameFromSetup);
    document.getElementById("back-to-setup").addEventListener("click", returnToSetup);
    document.getElementById("go-to-stats").addEventListener("click", goToStatisticsScreen);
    elements.nextRoundButton.addEventListener("click", startNextRound);
    elements.finalTakeHand.addEventListener("click", () => startFinal(true));
    elements.finalLeaveHand.addEventListener("click", () => startFinal(false));
    elements.startSuddenDeath.addEventListener("click", startSuddenDeath);

    elements.timerSeconds.addEventListener("change", (event) => {
        elements.timerSeconds.value = sanitizeTimerValue(event.target.value);
    });

    elements.eliminateEachRound.addEventListener("change", (event) => {
        state.eliminateEachRound = !event.target.checked;
    });

    elements.eliminatedPlayer.addEventListener("change", (event) => {
        state.eliminatedPlayerIndex = event.target.value;
        elements.eliminationError.textContent = "";
        updateNextRoundButtonLabel();
    });
}

function bindKeyboardEvents() {
    document.addEventListener("keyup", (event) => {
        if (state.gameStarted && state.currentScreen === "final" && state.finalStarted && !state.finalWinner) {
            const finalKey = event.key.toLowerCase();

            if (finalKey === "v") {
                answerFinalQuestion(true);
            }

            if (finalKey === "n") {
                answerFinalQuestion(false);
            }

            return;
        }

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
    state.prizes = [...state.basePrizes];
    renderPlayersList();
    renderStartingPlayerOptions();
    renderPrizesList();
    elements.timerSeconds.value = state.timerSeconds;
    elements.eliminateEachRound.checked = !state.eliminateEachRound;
    updateStartGameButtonLabel();
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
            savePlayers();
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
            savePlayers();
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
    elements.startingPlayer.innerHTML = "";

    state.players.forEach((player, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = normalizePlayerName(player, index);
        elements.startingPlayer.appendChild(option);
    });

    state.startingPlayerIndex = getAlphabeticalFirstPlayerIndex(state.players);
    elements.startingPlayer.value = String(state.startingPlayerIndex);
    updateStartGameButtonLabel();
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
            state.basePrizes[index] = state.prizes[index];
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
    savePlayers();
    state.basePrizes = prizes;
    state.timerSeconds = timerValue;
    state.eliminateEachRound = !elements.eliminateEachRound.checked;
    state.eliminatedPlayerIndex = "";
    state.startingPlayerIndex = getAlphabeticalFirstPlayerIndex(state.players);
    state.currentPlayerIndex = state.startingPlayerIndex;
    state.round = 1;
    state.totalBank = 0;
    state.finalReady = false;
    state.finalists = [];
    state.finalWinner = "";
    state.gameStarted = true;
    elements.setupError.textContent = "";

    stopAmbienceAudio();
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
    stopRoundAudio();
    stopAmbienceAudio();
    switchScreen("setup");
    renderSetup();
}

function switchScreen(screenName) {
    state.currentScreen = screenName;
    elements.setupScreen.classList.toggle("hidden", screenName !== "setup");
    elements.gameScreen.classList.toggle("hidden", screenName !== "game");
    elements.statsScreen.classList.toggle("hidden", screenName !== "stats");
    elements.finalScreen.classList.toggle("hidden", screenName !== "final");
}

function initializeRoundState() {
    state.isTripleRound = isFinalClassicRound();
    state.prizes = getPrizesForCurrentRound();
    state.currentPlayerIndex = state.startingPlayerIndex;
    state.currentStep = state.prizes.length > 0 ? 1 : 0;
    state.roundBank = 0;
    state.timerRemaining = state.timerSeconds;
    state.timerStopped = true;
    state.roundEnded = false;
    state.roundEndReason = "";
    state.eliminatedPlayerIndex = "";
    state.roundPlayerStats = createRoundPlayerStats();
    state.rankedRoundStats = [];
    elements.roundEndPanel.classList.add("hidden");
    prepareRoundAudio();
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
    elements.roundNumber.textContent = state.isTripleRound ? `${state.round} x3` : String(state.round);
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
    playRoundAudio();

    state.intervalId = window.setInterval(() => {
        if (state.timerStopped || state.roundEnded) {
            return;
        }

        if (state.timerRemaining <= 0) {
            endRoundFromTimer();
            return;
        }

        state.timerRemaining -= 1;
        updateTimerDisplay();

        if (state.timerRemaining <= 0) {
            endRoundFromTimer();
        }
    }, 1000);
}

function endRoundFromTimer() {
    const playerStats = getCurrentPlayerStats();
    const bankableAmount = getBankableChainAmount();
    const cappedLostAmount = getCappedAmount(bankableAmount);

    if (playerStats && cappedLostAmount > 0) {
        playerStats.lost += cappedLostAmount;
    }

    endRound("Le chrono est ecoule.");
}

function toggleTimer() {
    state.timerStopped = !state.timerStopped;

    if (state.timerStopped) {
        pauseRoundAudio();
    } else {
        playRoundAudio();
    }
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
    const bankableAmount = getBankableChainAmount();

    if (bankableAmount <= 0) {
        return;
    }

    const cappedAmount = getCappedAmount(bankableAmount);

    applyBankGain(playerStats, cappedAmount);

    if (!state.roundEnded) {
        state.currentStep = 1;
    }

    syncGameBoard();
}

function handleWrongAnswer() {
    const playerStats = getCurrentPlayerStats();
    const bankableAmount = getBankableChainAmount();
    const cappedLostAmount = getCappedAmount(bankableAmount);

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

function prepareRoundAudio() {
    stopRoundAudio();
    state.roundAudio = new Audio(`sounds/${state.timerSeconds}.mp3`);
    state.roundAudio.preload = "auto";
}

function playRoundAudio() {
    if (!state.roundAudio) {
        return;
    }

    state.roundAudio.play().catch(() => {
        pauseRoundAudio();
    });
}

function pauseRoundAudio() {
    if (state.roundAudio) {
        state.roundAudio.pause();
    }
}

function stopRoundAudio() {
    if (!state.roundAudio) {
        return;
    }

    state.roundAudio.pause();
    state.roundAudio.currentTime = 0;
    state.roundAudio = null;
}

function playAmbienceAudio(track) {
    if (!track) {
        return;
    }

    if (state.ambienceAudio && state.ambienceTrack === track) {
        state.ambienceAudio.play().catch(() => {});
        return;
    }

    stopAmbienceAudio();
    state.ambienceTrack = track;
    state.ambienceAudio = new Audio(track);
    state.ambienceAudio.loop = true;
    state.ambienceAudio.play().catch(() => {
        stopAmbienceAudio();
    });
}

function stopAmbienceAudio() {
    if (!state.ambienceAudio) {
        state.ambienceTrack = "";
        return;
    }

    state.ambienceAudio.pause();
    state.ambienceAudio.currentTime = 0;
    state.ambienceAudio = null;
    state.ambienceTrack = "";
}

function goToStatisticsScreen() {
    state.rankedRoundStats = rankRoundStats();
    state.finalReady = isFinalClassicRound();
    if (state.finalReady) {
        prepareFinalistsFromCurrentRound();
    }
    renderStatistics();
    stopRoundAudio();
    if (state.finalReady) {
        stopAmbienceAudio();
    } else {
        playAmbienceAudio(AMBIENCE_TRACKS.voting);
    }
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
    renderEliminationPicker();
    updateNextRoundButtonLabel();
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

function renderEliminationPicker() {
    const shouldAskForElimination = state.eliminateEachRound && state.players.length > 1 && !state.finalReady;
    elements.eliminationCard.classList.toggle("hidden", !shouldAskForElimination);
    elements.eliminationError.textContent = "";

    if (!shouldAskForElimination) {
        state.eliminatedPlayerIndex = "";
        elements.eliminatedPlayer.innerHTML = "";
        return;
    }

    elements.eliminatedPlayer.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selectionner un joueur";
    elements.eliminatedPlayer.appendChild(placeholder);

    state.players.forEach((player, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = player;
        elements.eliminatedPlayer.appendChild(option);
    });

    state.eliminatedPlayerIndex = "";
    elements.eliminatedPlayer.value = state.eliminatedPlayerIndex;
}

function updateStartGameButtonLabel() {
    const playerName = getPlayerNameByIndex(state.startingPlayerIndex);
    elements.startGameButton.textContent = `Lancer partie - ${playerName} commence`;
}

function updateNextRoundButtonLabel() {
    if (state.finalReady) {
        elements.nextRoundButton.textContent = "Acceder a la finale";
        return;
    }

    const playerName = getNextStartingPlayerNamePreview();
    elements.nextRoundButton.textContent = `Manche suivante - ${playerName} commence`;
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
    if (state.finalReady) {
        showFinalScreen();
        return;
    }

    if (!applyRoundElimination()) {
        return;
    }

    state.startingPlayerIndex = getNextStartingPlayerIndexFromPreviousRanking();
    state.round += 1;
    state.timerSeconds = Math.max(10, state.timerSeconds - 10);
    initializeRoundState();
    stopAmbienceAudio();
    switchScreen("game");
    syncGameBoard();
    startTimer();
}

function isFinalClassicRound() {
    if (state.eliminateEachRound) {
        return state.players.length === 2;
    }

    return state.round === 8;
}

function getPrizesForCurrentRound() {
    const multiplier = state.isTripleRound ? 3 : 1;
    return state.basePrizes.map((prize) => prize * multiplier);
}

function prepareFinalistsFromCurrentRound() {
    const rankedNames = state.rankedRoundStats.map((playerStats) => playerStats.name);
    const finalists = rankedNames.filter((name) => state.players.includes(name)).slice(0, 2);

    if (finalists.length < 2) {
        state.players.forEach((player) => {
            if (finalists.length < 2 && !finalists.includes(player)) {
                finalists.push(player);
            }
        });
    }

    state.finalists = finalists;
    state.finalStrongestPlayer = finalists[0] || "";
}

function showFinalScreen() {
    stopRoundAudio();
    resetFinalState();
    renderFinal();
    playAmbienceAudio(AMBIENCE_TRACKS.penalty);
    switchScreen("final");
}

function resetFinalState() {
    state.finalStarted = false;
    state.finalCurrentPlayerIndex = 0;
    state.finalMode = "regular";
    state.finalWaitingForSuddenDeath = false;
    state.suddenDeathRound = 0;
    state.finalWinner = "";
    state.finalResults = state.finalists.map((player) => ({
        name: player,
        regular: [],
        suddenDeath: []
    }));
}

function startFinal(strongestTakesHand) {
    if (state.finalists.length < 2) {
        return;
    }

    const strongestIndex = Math.max(0, state.finalists.indexOf(state.finalStrongestPlayer));
    state.finalCurrentPlayerIndex = strongestTakesHand ? strongestIndex : getOtherFinalistIndex(strongestIndex);
    state.finalStarted = true;
    renderFinal();
}

function answerFinalQuestion(isCorrect) {
    if (!state.finalStarted || state.finalWaitingForSuddenDeath || state.finalWinner) {
        return;
    }

    const playerResult = state.finalResults[state.finalCurrentPlayerIndex];

    if (!playerResult) {
        return;
    }

    if (state.finalMode === "regular") {
        playerResult.regular.push(isCorrect);
        const winner = getRegularFinalWinner();

        if (winner) {
            concludeFinal(winner);
            return;
        }

        if (hasRegularFinalTie()) {
            state.finalWaitingForSuddenDeath = true;
            stopAmbienceAudio();
            renderFinal();
            return;
        }

        state.finalCurrentPlayerIndex = getNextRegularFinalPlayerIndex();
        renderFinal();
        return;
    }

    playerResult.suddenDeath[state.suddenDeathRound - 1] = isCorrect;

    if (isSuddenDeathRoundComplete()) {
        const winner = getSuddenDeathWinner();

        if (winner) {
            concludeFinal(winner);
            return;
        }

        state.suddenDeathRound += 1;
        state.finalCurrentPlayerIndex = 0;
        renderFinal();
        return;
    }

    state.finalCurrentPlayerIndex = getOtherFinalistIndex(state.finalCurrentPlayerIndex);
    renderFinal();
}

function concludeFinal(winnerName) {
    state.finalWinner = winnerName;
    renderFinal();
}

function startSuddenDeath() {
    if (!state.finalWaitingForSuddenDeath || state.finalWinner) {
        return;
    }

    state.finalWaitingForSuddenDeath = false;
    state.finalMode = "suddenDeath";
    state.suddenDeathRound = 1;
    state.finalCurrentPlayerIndex = 0;
    state.finalResults.forEach((playerResult) => {
        playerResult.suddenDeath = [];
    });
    playAmbienceAudio(AMBIENCE_TRACKS.suddenDeath);
    renderFinal();
}

function renderFinal() {
    elements.finalTitle.textContent = state.finalWinner ? `${state.finalWinner} remporte la finale` : "Duel final";
    elements.finalStatus.textContent = getFinalStatusText();
    elements.finalStrongestPlayer.textContent = `Maillon fort: ${state.finalStrongestPlayer || "-"}`;
    elements.finalChoiceCard.classList.toggle("hidden", state.finalStarted || Boolean(state.finalWinner));
    elements.finalControlCard.classList.toggle("hidden", !state.finalStarted || state.finalWaitingForSuddenDeath || Boolean(state.finalWinner));
    elements.finalSuddenCard.classList.toggle("hidden", !state.finalWaitingForSuddenDeath || Boolean(state.finalWinner));
    elements.finalModeLabel.textContent = state.finalMode === "regular" ? "Questions" : `Mort subite ${state.suddenDeathRound}`;
    elements.finalCurrentPlayer.textContent = state.finalWinner ? "-" : getCurrentFinalPromptText();
    renderFinalBoard();
}

function renderFinalBoard() {
    elements.finalBoard.innerHTML = "";

    state.finalResults.forEach((playerResult) => {
        const row = document.createElement("div");
        row.className = "final-row";

        const name = document.createElement("div");
        name.className = "final-name";
        name.textContent = playerResult.name;
        row.appendChild(name);

        getVisibleFinalResults(playerResult).forEach((result, index) => {
            row.appendChild(createFinalToken(result, String(index + 1)));
        });

        elements.finalBoard.appendChild(row);
    });
}

function getVisibleFinalResults(playerResult) {
    if (state.finalMode === "regular") {
        return Array.from({ length: 5 }, (_, index) => playerResult.regular[index]);
    }

    const visibleStartIndex = Math.floor((Math.max(1, state.suddenDeathRound) - 1) / 5) * 5;
    return Array.from({ length: 5 }, (_, index) => playerResult.suddenDeath[visibleStartIndex + index]);
}

function createFinalToken(result, fallbackText) {
    const token = document.createElement("div");
    token.className = "final-token";

    if (result === true) {
        token.classList.add("correct");
        token.textContent = "V";
        return token;
    }

    if (result === false) {
        token.classList.add("wrong");
        token.textContent = "X";
        return token;
    }

    token.textContent = fallbackText;
    return token;
}

function getFinalStatusText() {
    if (state.finalWinner) {
        return "La finale est terminee.";
    }

    if (!state.finalStarted) {
        const otherPlayer = state.finalists.find((player) => player !== state.finalStrongestPlayer) || "-";
        return `${state.finalStrongestPlayer || "-"} peut prendre la main ou la laisser a ${otherPlayer}.`;
    }

    if (state.finalWaitingForSuddenDeath) {
        return "Egalite apres cinq questions. Lance la mort subite quand tu es pret.";
    }

    if (state.finalMode === "suddenDeath") {
        return "Egalite apres cinq questions: mort subite.";
    }

    return "Chaque joueur repond a cinq questions au maximum.";
}

function getCurrentFinalPromptText() {
    const playerName = state.finalists[state.finalCurrentPlayerIndex] || "-";
    const result = state.finalResults[state.finalCurrentPlayerIndex];

    if (state.finalMode === "suddenDeath") {
        return `${playerName} - question de mort subite ${state.suddenDeathRound}`;
    }

    return `${playerName} - question ${result ? result.regular.length + 1 : 1}`;
}

function getRegularFinalWinner() {
    const left = state.finalResults[0];
    const right = state.finalResults[1];

    if (!left || !right) {
        return "";
    }

    const leftScore = countCorrect(left.regular);
    const rightScore = countCorrect(right.regular);
    const leftRemaining = 5 - left.regular.length;
    const rightRemaining = 5 - right.regular.length;

    if (leftScore > rightScore + rightRemaining) {
        return left.name;
    }

    if (rightScore > leftScore + leftRemaining) {
        return right.name;
    }

    if (left.regular.length === 5 && right.regular.length === 5 && leftScore !== rightScore) {
        return leftScore > rightScore ? left.name : right.name;
    }

    return "";
}

function hasRegularFinalTie() {
    const left = state.finalResults[0];
    const right = state.finalResults[1];

    return left && right
        && left.regular.length === 5
        && right.regular.length === 5
        && countCorrect(left.regular) === countCorrect(right.regular);
}

function getNextRegularFinalPlayerIndex() {
    const currentPlayer = state.finalResults[state.finalCurrentPlayerIndex];
    const otherIndex = getOtherFinalistIndex(state.finalCurrentPlayerIndex);
    const otherPlayer = state.finalResults[otherIndex];

    if (otherPlayer && otherPlayer.regular.length < 5 && otherPlayer.regular.length <= currentPlayer.regular.length) {
        return otherIndex;
    }

    if (currentPlayer.regular.length < 5) {
        return state.finalCurrentPlayerIndex;
    }

    return otherIndex;
}

function isSuddenDeathRoundComplete() {
    return state.finalResults.every((playerResult) => playerResult.suddenDeath.length >= state.suddenDeathRound);
}

function getSuddenDeathWinner() {
    const left = state.finalResults[0];
    const right = state.finalResults[1];
    const leftResult = left.suddenDeath[state.suddenDeathRound - 1];
    const rightResult = right.suddenDeath[state.suddenDeathRound - 1];

    if (leftResult === true && rightResult === false) {
        return left.name;
    }

    if (rightResult === true && leftResult === false) {
        return right.name;
    }

    return "";
}

function getOtherFinalistIndex(index) {
    return index === 0 ? 1 : 0;
}

function countCorrect(results) {
    return results.filter(Boolean).length;
}

function applyRoundElimination() {
    if (!state.eliminateEachRound || state.players.length <= 1) {
        return true;
    }

    const eliminatedIndex = Number.parseInt(state.eliminatedPlayerIndex, 10);

    if (Number.isNaN(eliminatedIndex) || eliminatedIndex < 0 || eliminatedIndex >= state.players.length) {
        elements.eliminationError.textContent = "Choisis le joueur elimine avant de lancer la manche suivante.";
        return false;
    }

    state.players.splice(eliminatedIndex, 1);
    return true;
}

function moveToNextPlayer() {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
}

function getCurrentPlayerStats() {
    return state.roundPlayerStats[state.currentPlayerIndex];
}

function getBankableChainAmount() {
    if (state.currentStep <= 1) {
        return 0;
    }

    return state.prizes[state.currentStep - 2] || 0;
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

function loadSavedPlayers() {
    try {
        const savedPlayers = JSON.parse(localStorage.getItem(SAVED_PLAYERS_KEY) || "[]");

        if (Array.isArray(savedPlayers) && savedPlayers.length > 0) {
            state.players = savedPlayers.map((player, index) => normalizePlayerName(player, index));
        }
    } catch (error) {
        state.players = ["Joueur 1", "Joueur 2"];
    }
}

function savePlayers() {
    const playersToSave = state.players.map((player, index) => normalizePlayerName(player, index));
    localStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(playersToSave));
}

function getAlphabeticalFirstPlayerIndex(players) {
    if (players.length === 0) {
        return 0;
    }

    return players
        .map((player, index) => ({
            index,
            name: normalizePlayerName(player, index)
        }))
        .sort((leftPlayer, rightPlayer) => leftPlayer.name.localeCompare(rightPlayer.name, "fr", { sensitivity: "base" }))[0].index;
}

function getNextStartingPlayerIndexFromPreviousRanking() {
    return getNextStartingPlayerIndexFromPlayers(state.players);
}

function getNextStartingPlayerIndexFromPlayers(players) {
    const firstAvailableRankedPlayer = state.rankedRoundStats.find((playerStats) => players.includes(playerStats.name));

    if (!firstAvailableRankedPlayer) {
        return getAlphabeticalFirstPlayerIndex(players);
    }

    return players.indexOf(firstAvailableRankedPlayer.name);
}

function getNextStartingPlayerNamePreview() {
    const playersAfterElimination = getPlayersAfterPendingElimination();
    const nextStartingPlayerIndex = getNextStartingPlayerIndexFromPlayers(playersAfterElimination);
    return playersAfterElimination[nextStartingPlayerIndex] || "-";
}

function getPlayersAfterPendingElimination() {
    const players = [...state.players];

    if (!state.eliminateEachRound || players.length <= 1) {
        return players;
    }

    const eliminatedIndex = Number.parseInt(state.eliminatedPlayerIndex, 10);

    if (!Number.isNaN(eliminatedIndex) && eliminatedIndex >= 0 && eliminatedIndex < players.length) {
        players.splice(eliminatedIndex, 1);
    }

    return players;
}

function getPlayerNameByIndex(index) {
    return state.players[index] || "-";
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
