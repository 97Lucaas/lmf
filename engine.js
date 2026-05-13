const DEFAULT_PRIZES = [50, 100, 200, 400, 600, 1000, 1500, 3000, 5000];
const DEFAULT_TIMER_SECONDS = 150;
const SAVED_PLAYERS_KEY = "lmf.players";
const CAST_STATE_KEY = "lmf.cast.state";
const CAST_SYNC_INTERVAL_MS = 100;
const AMBIENCE_TRACKS = {
    voting: "sounds/voting.mp3",
    penalty: "sounds/Penalty_Shootout.mp3",
    suddenDeath: "sounds/sudden_death.mp3"
};
const EFFECT_TRACKS = {
    separator: "sounds/separator.mp3",
    walkOfShame: "sounds/Walk_Of_Shame.mp3",
    win: "sounds/win.mp3"
};

const state = {
    registeredPlayers: ["Joueur 1", "Joueur 2"],
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
    finalWinner: "",
    effectAudio: null,
    buttonTransitionInProgress: false,
    pendingEliminationIndex: null,
    walkOfShamePlayerName: ""
};

const elements = {};
let lastCastSnapshot = "";

window.addEventListener("DOMContentLoaded", () => {
    loadSavedPlayers();
    cacheElements();
    bindSetupEvents();
    bindKeyboardEvents();
    renderSetup();
    syncGameBoard();
    publishCastState();
    window.setInterval(publishCastState, CAST_SYNC_INTERVAL_MS);
});

function cacheElements() {
    elements.setupScreen = document.getElementById("setup-screen");
    elements.gameScreen = document.getElementById("game-screen");
    elements.statsScreen = document.getElementById("stats-screen");
    elements.walkScreen = document.getElementById("walk-screen");
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
    elements.walkTitle = document.getElementById("walk-title");
    elements.walkCopy = document.getElementById("walk-copy");
    elements.walkNextRoundButton = document.getElementById("walk-next-round");
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
    elements.finalWinCard = document.getElementById("final-win-card");
    elements.finalWinnerName = document.getElementById("final-winner-name");
    elements.playAgain = document.getElementById("play-again");
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
    bindButtonAction(document.getElementById("add-player"), () => {
        state.registeredPlayers.push("Nouveau joueur");
        savePlayers();
        renderSetup();
    }, { separatorMode: "none" });

    bindButtonAction(document.getElementById("reset-prizes"), () => {
        state.basePrizes = [...DEFAULT_PRIZES];
        state.prizes = [...DEFAULT_PRIZES];
        renderSetup();
    }, { separatorMode: "none" });

    bindButtonAction(elements.startGameButton, startGameFromSetup);
    bindButtonAction(document.getElementById("back-to-setup"), returnToSetup);
    bindButtonAction(document.getElementById("open-cast"), openCastWindow, { separatorMode: "none" });
    bindButtonAction(document.getElementById("go-to-stats"), goToStatisticsScreen, { separatorMode: "none" });
    bindButtonAction(elements.nextRoundButton, startNextRound);
    bindButtonAction(elements.walkNextRoundButton, advanceFromWalkOfShame);
    bindButtonAction(elements.finalTakeHand, () => startFinal(true), { separatorMode: "none" });
    bindButtonAction(elements.finalLeaveHand, () => startFinal(false), { separatorMode: "none" });
    bindButtonAction(elements.startSuddenDeath, startSuddenDeath, { separatorMode: "none" });
    bindButtonAction(elements.playAgain, returnToSetup, { separatorMode: "none" });

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

function bindButtonAction(button, handler, options = {}) {
    if (!button) {
        return;
    }

    button.addEventListener("click", async () => {
        if (state.buttonTransitionInProgress) {
            return;
        }

        state.buttonTransitionInProgress = true;

        try {
            stopTransitionAudio();
            const handlerResult = await handler();
            await waitForNextPaint();
            const skipSeparator = Boolean(handlerResult && handlerResult.skipSeparator);
            const afterSeparator = typeof handlerResult === "function"
                ? handlerResult
                : handlerResult && typeof handlerResult.afterSeparator === "function"
                    ? handlerResult.afterSeparator
                    : null;

            if (options.separatorMode !== "none" && !skipSeparator) {
                await playOneShotAudio(EFFECT_TRACKS.separator);
            }

            if (afterSeparator) {
                await afterSeparator();
            }
        } finally {
            state.buttonTransitionInProgress = false;
        }
    });
}

function waitForNextPaint() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(resolve);
        });
    });
}

function openCastWindow() {
    window.open("cast.html", "_blank", "noopener");
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
    state.players = [...state.registeredPlayers];
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

    state.registeredPlayers.forEach((player, index) => {
        const row = document.createElement("div");
        row.className = "player-row";

        const input = document.createElement("input");
        input.type = "text";
        input.value = player;
        input.placeholder = "Prenom du joueur";
        input.addEventListener("input", (event) => {
            state.registeredPlayers[index] = event.target.value;
            savePlayers();
            renderStartingPlayerOptions();
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Supprimer";
        removeButton.disabled = state.registeredPlayers.length === 1;
        bindButtonAction(removeButton, () => {
            if (state.registeredPlayers.length === 1) {
                return;
            }

            state.registeredPlayers.splice(index, 1);
            savePlayers();
            if (state.currentPlayerIndex >= state.registeredPlayers.length) {
                state.currentPlayerIndex = 0;
            }
            renderSetup();
        }, { separatorMode: "none" });

        row.appendChild(input);
        row.appendChild(removeButton);
        elements.playersList.appendChild(row);
    });
}

function renderStartingPlayerOptions() {
    elements.startingPlayer.innerHTML = "";

    state.registeredPlayers.forEach((player, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = normalizePlayerName(player, index);
        elements.startingPlayer.appendChild(option);
    });

    state.startingPlayerIndex = getAlphabeticalFirstPlayerIndex(state.registeredPlayers);
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
    const cleanedPlayers = state.registeredPlayers.map((player, index) => normalizePlayerName(player, index));
    const timerValue = sanitizeTimerValue(elements.timerSeconds.value);
    const prizes = Array.from(elements.prizesList.querySelectorAll("input")).map((input) => sanitizePrizeValue(input.value));

    if (cleanedPlayers.length === 0) {
        elements.setupError.textContent = "Ajoute au moins un joueur pour lancer la partie.";
        return;
    }

    state.registeredPlayers = cleanedPlayers;
    state.players = [...cleanedPlayers];
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
    state.pendingEliminationIndex = null;
    state.walkOfShamePlayerName = "";
    state.gameStarted = true;
    elements.setupError.textContent = "";

    stopAmbienceAudio();
    initializeRoundState();
    switchScreen("game");
    syncGameBoard();
    return startTimer;
}

function returnToSetup() {
    state.gameStarted = false;
    state.round = 1;
    state.roundBank = 0;
    state.totalBank = 0;
    state.timerRemaining = state.timerSeconds;
    state.timerStopped = true;
    state.roundEnded = false;
    state.roundEndReason = "";
    state.currentStep = 0;
    state.finalReady = false;
    state.finalists = [];
    state.finalStrongestPlayer = "";
    state.finalStarted = false;
    state.finalCurrentPlayerIndex = 0;
    state.finalMode = "regular";
    state.finalWaitingForSuddenDeath = false;
    state.finalResults = [];
    state.suddenDeathRound = 0;
    state.finalWinner = "";
    state.pendingEliminationIndex = null;
    state.walkOfShamePlayerName = "";
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.players = [...state.registeredPlayers];
    stopRoundAudio();
    stopAmbienceAudio();
    stopEffectAudio();
    elements.roundEndTitle.textContent = "La manche est terminee";
    elements.roundEndReason.textContent = "";
    switchScreen("setup");
    renderSetup();
}

function switchScreen(screenName) {
    state.currentScreen = screenName;
    elements.setupScreen.classList.toggle("hidden", screenName !== "setup");
    elements.gameScreen.classList.toggle("hidden", screenName !== "game");
    elements.statsScreen.classList.toggle("hidden", screenName !== "stats");
    elements.walkScreen.classList.toggle("hidden", screenName !== "walk");
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
    state.pendingEliminationIndex = null;
    state.walkOfShamePlayerName = "";
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
    elements.time.textContent = formatTimer(state.timerRemaining);
}

function updateRoundEndPanel() {
    elements.roundEndPanel.classList.toggle("hidden", !state.roundEnded);
    if (state.roundEnded) {
        elements.roundEndReason.textContent = state.roundEndReason;
    }
}

async function startTimer() {
    clearInterval(state.intervalId);
    state.timerStopped = true;
    updateTimerDisplay();
    const playbackStarted = await playRoundAudio();

    if (!playbackStarted || state.roundEnded) {
        return;
    }

    state.timerStopped = false;

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

async function toggleTimer() {
    if (state.timerStopped) {
        const playbackStarted = await playRoundAudio();

        if (playbackStarted) {
            state.timerStopped = false;
        }

        return;
    }

    state.timerStopped = true;
    pauseRoundAudio();
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

async function playRoundAudio() {
    if (!state.roundAudio) {
        return false;
    }

    try {
        await state.roundAudio.play();
        return true;
    } catch (error) {
        pauseRoundAudio();
        return false;
    }
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

function stopEffectAudio() {
    if (!state.effectAudio) {
        return;
    }

    state.effectAudio.pause();
    state.effectAudio.currentTime = 0;
    state.effectAudio = null;
}

function stopTransitionAudio() {
    stopRoundAudio();
    stopAmbienceAudio();
    stopEffectAudio();
}

function playOneShotAudio(track) {
    return new Promise((resolve) => {
        if (!track) {
            resolve();
            return;
        }

        stopEffectAudio();
        const audio = new Audio(track);
        state.effectAudio = audio;
        audio.preload = "auto";

        const finish = () => {
            if (state.effectAudio === audio) {
                state.effectAudio = null;
            }
            resolve();
        };

        audio.addEventListener("ended", finish, { once: true });
        audio.addEventListener("error", finish, { once: true });
        audio.play().catch(finish);
    });
}

function playScreenEffect(track) {
    stopEffectAudio();

    if (!track) {
        return;
    }

    const audio = new Audio(track);
    state.effectAudio = audio;
    audio.preload = "auto";
    audio.addEventListener("ended", () => {
        if (state.effectAudio === audio) {
            state.effectAudio = null;
        }
    }, { once: true });
    audio.addEventListener("error", () => {
        if (state.effectAudio === audio) {
            state.effectAudio = null;
        }
    }, { once: true });
    audio.play().catch(() => {
        if (state.effectAudio === audio) {
            state.effectAudio = null;
        }
    });
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
    switchScreen("stats");
    playAmbienceAudio(AMBIENCE_TRACKS.voting);
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
    const needsElimination = shouldAskForElimination();
    elements.eliminationCard.classList.toggle("hidden", !needsElimination);
    elements.eliminationError.textContent = "";

    if (!needsElimination) {
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

    if (shouldAskForElimination()) {
        elements.nextRoundButton.textContent = "Confirmer l'elimination";
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
        return {
            skipSeparator: true,
            afterSeparator: showFinalScreen
        };
    }

    if (shouldAskForElimination()) {
        if (!prepareWalkOfShame()) {
            return;
        }

        return showWalkOfShameScreen();
    }

    return proceedToNextRound();
}

function proceedToNextRound() {
    state.startingPlayerIndex = getNextStartingPlayerIndexFromPreviousRanking();
    state.round += 1;
    state.timerSeconds = Math.max(10, state.timerSeconds - 10);
    initializeRoundState();
    stopAmbienceAudio();
    switchScreen("game");
    syncGameBoard();
    return startTimer;
}

function shouldAskForElimination() {
    return state.eliminateEachRound && state.players.length > 1 && !state.finalReady;
}

function prepareWalkOfShame() {
    const eliminatedIndex = Number.parseInt(state.eliminatedPlayerIndex, 10);

    if (Number.isNaN(eliminatedIndex) || eliminatedIndex < 0 || eliminatedIndex >= state.players.length) {
        elements.eliminationError.textContent = "Choisis le joueur elimine avant de confirmer l'elimination.";
        return;
    }

    state.pendingEliminationIndex = eliminatedIndex;
    state.walkOfShamePlayerName = state.players[eliminatedIndex] || "Ce joueur";
    return true;
}

function showWalkOfShameScreen() {
    const nextRoundNumber = state.round + 1;
    const nextPlayerName = getNextStartingPlayerNamePreview();
    elements.walkTitle.textContent = `${state.walkOfShamePlayerName}, vous etes le maillon faible, au revoir.`;
    elements.walkCopy.textContent = `Passer a la manche ${nextRoundNumber} avec ${nextPlayerName} qui commence.`;
    elements.walkNextRoundButton.textContent = `Passer a la manche ${nextRoundNumber} - ${nextPlayerName} commence`;
    switchScreen("walk");
    return {
        skipSeparator: true,
        afterSeparator: () => {
            playScreenEffect(EFFECT_TRACKS.walkOfShame);
        }
    };
}

function advanceFromWalkOfShame() {
    if (!applyRoundElimination()) {
        return;
    }

    return proceedToNextRound();
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
    switchScreen("final");
    playAmbienceAudio(AMBIENCE_TRACKS.voting);
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
    playAmbienceAudio(AMBIENCE_TRACKS.penalty);
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
    stopAmbienceAudio();
    playScreenEffect(EFFECT_TRACKS.win);
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
    renderFinal();
    playAmbienceAudio(AMBIENCE_TRACKS.suddenDeath);
}

function renderFinal() {
    elements.finalTitle.textContent = state.finalWinner ? `${state.finalWinner} remporte la finale` : "Duel final";
    elements.finalStatus.textContent = getFinalStatusText();
    elements.finalStrongestPlayer.textContent = `Maillon fort: ${state.finalStrongestPlayer || "-"}`;
    elements.finalChoiceCard.classList.toggle("hidden", state.finalStarted || Boolean(state.finalWinner));
    elements.finalControlCard.classList.toggle("hidden", !state.finalStarted || state.finalWaitingForSuddenDeath || Boolean(state.finalWinner));
    elements.finalSuddenCard.classList.toggle("hidden", !state.finalWaitingForSuddenDeath || Boolean(state.finalWinner));
    elements.finalWinCard.classList.toggle("hidden", !state.finalWinner);
    elements.finalWinnerName.textContent = state.finalWinner ? `${state.finalWinner} a gagne` : "-";
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

        getVisibleFinalResults(playerResult).forEach((tokenData, index) => {
            row.appendChild(createFinalToken(playerResult, tokenData, index));
        });

        elements.finalBoard.appendChild(row);
    });
}

function getVisibleFinalResults(playerResult) {
    if (state.finalMode === "regular") {
        return Array.from({ length: 5 }, (_, index) => ({
            result: playerResult.regular[index],
            label: String(index + 1),
            revealed: true,
            absoluteRound: index + 1
        }));
    }

    const visibleStartIndex = Math.floor((Math.max(1, state.suddenDeathRound) - 1) / 5) * 5;
    return Array.from({ length: 5 }, (_, index) => {
        const absoluteRound = visibleStartIndex + index + 1;
        return {
            result: playerResult.suddenDeath[absoluteRound - 1],
            label: absoluteRound <= state.suddenDeathRound ? String(absoluteRound) : "",
            revealed: absoluteRound <= state.suddenDeathRound,
            absoluteRound
        };
    });
}

function createFinalToken(playerResult, tokenData, visibleIndex) {
    const descriptor = getFinalTokenDescriptor(playerResult, tokenData, visibleIndex);
    const token = document.createElement("div");
    token.className = "final-token";

    descriptor.classes.forEach((className) => token.classList.add(className));
    token.textContent = descriptor.text;
    return token;
}

function getFinalTokenDescriptor(playerResult, tokenData, visibleIndex) {
    const { result, label, revealed = true, absoluteRound = visibleIndex + 1 } = tokenData;
    const descriptor = {
        text: "",
        classes: []
    };

    if (result === true) {
        descriptor.classes.push("correct");
        descriptor.text = "V";
    } else if (result === false) {
        descriptor.classes.push("wrong");
        descriptor.text = "X";
    } else if (!revealed) {
        descriptor.classes.push("hidden-slot");
        return descriptor;
    } else {
        descriptor.text = label;
    }

    if (state.finalMode === "suddenDeath") {
        applySuddenDeathTokenState(descriptor.classes, playerResult, absoluteRound);
    } else {
        if (result === true || result === false) {
            descriptor.classes.push("current");
        } else if (isCurrentFinalToken(playerResult, visibleIndex)) {
            descriptor.classes.push("current");
        } else {
            descriptor.classes.push("pending");
        }
    }

    return descriptor;
}

function applySuddenDeathTokenState(classList, playerResult, absoluteRound) {
    if (absoluteRound < state.suddenDeathRound) {
        classList.push("settled");
        return;
    }

    if (absoluteRound > state.suddenDeathRound) {
        classList.push("hidden-slot");
        return;
    }

    const currentPlayer = state.finalResults[state.finalCurrentPlayerIndex];
    const isCurrentPlayer = currentPlayer && currentPlayer.name === playerResult.name;
    const hasAnsweredCurrentRound = playerResult.suddenDeath[absoluteRound - 1] !== undefined;

    if (isCurrentPlayer || hasAnsweredCurrentRound) {
        classList.push("current");
        return;
    }

    classList.push("pending");
}

function isCurrentFinalToken(playerResult, visibleIndex) {
    if (!state.finalStarted || state.finalWaitingForSuddenDeath || state.finalWinner) {
        return false;
    }

    const currentPlayer = state.finalResults[state.finalCurrentPlayerIndex];

    if (!currentPlayer || currentPlayer.name !== playerResult.name) {
        return false;
    }

    if (state.finalMode === "regular") {
        return playerResult.regular.length < 5 && visibleIndex === playerResult.regular.length;
    }

    const visibleStartIndex = Math.floor((Math.max(1, state.suddenDeathRound) - 1) / 5) * 5;
    return visibleStartIndex + visibleIndex === state.suddenDeathRound - 1;
}

function getFinalStatusText() {
    if (state.finalWinner) {
        return `${state.finalWinner} est le grand gagnant.`;
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

    const eliminatedIndex = Number.isInteger(state.pendingEliminationIndex)
        ? state.pendingEliminationIndex
        : Number.parseInt(state.eliminatedPlayerIndex, 10);

    if (Number.isNaN(eliminatedIndex) || eliminatedIndex < 0 || eliminatedIndex >= state.players.length) {
        elements.eliminationError.textContent = "Choisis le joueur elimine avant de lancer la manche suivante.";
        return false;
    }

    state.players.splice(eliminatedIndex, 1);
    state.pendingEliminationIndex = null;
    state.walkOfShamePlayerName = "";
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
            state.registeredPlayers = savedPlayers.map((player, index) => normalizePlayerName(player, index));
            state.players = [...state.registeredPlayers];
        }
    } catch (error) {
        state.registeredPlayers = ["Joueur 1", "Joueur 2"];
        state.players = ["Joueur 1", "Joueur 2"];
    }
}

function savePlayers() {
    const playersToSave = state.registeredPlayers.map((player, index) => normalizePlayerName(player, index));
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
    return state.registeredPlayers[index] || "-";
}

function formatTimer(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function publishCastState() {
    try {
        const snapshot = JSON.stringify(buildCastState());

        if (snapshot === lastCastSnapshot) {
            return;
        }

        lastCastSnapshot = snapshot;
        localStorage.setItem(CAST_STATE_KEY, snapshot);
    } catch (error) {
        // Ignore cast sync errors to avoid disturbing the controller screen.
    }
}

function buildCastState() {
    const shouldVoteOnStats = state.currentScreen === "stats"
        && state.eliminateEachRound
        && state.players.length > 2
        && !state.finalReady;
    const nextStageLabel = state.finalReady ? "Finale" : `Manche ${state.round + 1}`;

    return {
        screen: state.currentScreen,
        setup: {
            players: [...state.registeredPlayers]
        },
        stats: {
            roundLabel: String(state.round),
            shouldVote: shouldVoteOnStats,
            nextStageLabel
        },
        game: {
            roundLabel: state.isTripleRound ? `${state.round} x3` : String(state.round),
            roundBank: state.roundBank,
            totalBank: state.totalBank,
            timerText: formatTimer(state.timerRemaining),
            currentPlayer: state.players[state.currentPlayerIndex] || "-",
            prizes: [...state.prizes],
            currentStep: state.currentStep,
            roundEnded: state.roundEnded,
            roundEndTitle: elements.roundEndTitle ? elements.roundEndTitle.textContent : "La manche est terminee",
            roundEndReason: state.roundEndReason
        },
        walk: {
            playerName: state.walkOfShamePlayerName || "",
            nextStageLabel
        },
        final: {
            title: state.finalWinner ? `${state.finalWinner} remporte la finale` : "Duel final",
            status: getFinalStatusText(),
            strongestPlayer: state.finalStrongestPlayer || "-",
            modeLabel: state.finalMode === "regular" ? "Questions" : `Mort subite ${state.suddenDeathRound}`,
            currentPrompt: state.finalWinner ? "-" : getCurrentFinalPromptText(),
            started: state.finalStarted,
            waitingForSuddenDeath: state.finalWaitingForSuddenDeath,
            winner: state.finalWinner,
            rows: state.finalResults.map((playerResult) => ({
                name: playerResult.name,
                tokens: getVisibleFinalResults(playerResult).map((tokenData, index) => getFinalTokenDescriptor(playerResult, tokenData, index))
            }))
        }
    };
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
