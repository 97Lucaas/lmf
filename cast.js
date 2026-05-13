const CAST_STATE_KEY = "lmf.cast.state";
const CAST_POLL_MS = 100;

const app = document.getElementById("cast-app");
let lastSnapshot = "";

window.addEventListener("DOMContentLoaded", () => {
    renderFromStorage();
    window.setInterval(renderFromStorage, CAST_POLL_MS);
    window.addEventListener("storage", (event) => {
        if (event.key === CAST_STATE_KEY) {
            renderFromStorage();
        }
    });
});

function renderFromStorage() {
    const snapshot = localStorage.getItem(CAST_STATE_KEY) || "";

    if (snapshot === lastSnapshot) {
        return;
    }

    lastSnapshot = snapshot;

    if (!snapshot) {
        renderWaitingScreen();
        return;
    }

    try {
        const castState = JSON.parse(snapshot);
        renderCast(castState);
    } catch (error) {
        renderWaitingScreen();
    }
}

function renderCast(castState) {
    switch (castState.screen) {
        case "game":
            renderGameScreen(castState.game);
            return;
        case "stats":
            renderDeliberationScreen(castState.stats);
            return;
        case "walk":
            renderWalkScreen(castState.walk);
            return;
        case "final":
            renderFinalScreen(castState.final);
            return;
        case "setup":
        default:
            renderWaitingScreen(castState.setup);
    }
}

function renderWaitingScreen(setup = {}) {
    const players = Array.isArray(setup.players) ? setup.players : [];
    app.innerHTML = `
        <section class="cast-hero">
            <div class="cast-card">
                <p class="eyebrow">Le Maillon Faible</p>
                <h1 class="cast-title">En attente du lancement</h1>
                <p class="cast-copy">L'ecran joueurs affichera automatiquement la manche en cours.</p>
                ${players.length > 0 ? `
                    <div class="players-list">
                        ${players.map((player) => `<span class="player-chip">${escapeHtml(player)}</span>`).join("")}
                    </div>
                ` : ""}
            </div>
        </section>
    `;
}

function renderDeliberationScreen(stats = {}) {
    const roundLabel = stats.roundLabel || "1";
    const title = `Manche ${roundLabel} terminee`;
    const copy = stats.shouldVote
        ? "C'est l'heure des votes."
        : stats.nextStageLabel
            ? `Prochaine manche : ${stats.nextStageLabel}`
            : "";

    app.innerHTML = `
        <section class="cast-hero">
            <div class="cast-card">
                <p class="eyebrow">Entre deux manches</p>
                <h1 class="cast-title">${escapeHtml(title)}</h1>
                ${copy ? `<p class="cast-copy">${escapeHtml(copy)}</p>` : ""}
            </div>
        </section>
    `;
}

function renderWalkScreen(walk) {
    app.innerHTML = `
        <section class="cast-hero">
            <div class="cast-card">
                <p class="eyebrow">Elimination</p>
                <h1 class="cast-title">${escapeHtml(walk.playerName || "-")}</h1>
                <p class="cast-copy">Prochaine manche : ${escapeHtml(walk.nextStageLabel || "Manche suivante")}</p>
            </div>
        </section>
    `;
}

function renderGameScreen(game) {
    const prizes = Array.isArray(game.prizes) ? game.prizes : [];

    app.innerHTML = `
        <section class="cast-layout">
            <div class="status-cluster">
                <div class="status-pill"><span>Manche</span><strong>${escapeHtml(game.roundLabel || "1")}</strong></div>
                <div class="status-pill"><span>Gagne cette manche</span><strong>${escapeHtml(String(game.roundBank ?? 0))}</strong></div>
                <div class="status-pill"><span>Banque totale</span><strong>${escapeHtml(String(game.totalBank ?? 0))}</strong></div>
            </div>

            <div class="cast-card">
                <div class="game-grid">
                    <div class="leftside">
                        ${renderPrizeChain(prizes, game.currentStep)}
                        <div class="big-card bank">
                            <div class="tag">BANK</div>
                            <div>${escapeHtml(String(game.roundBank ?? 0))}</div>
                        </div>
                    </div>
                    <div class="rightside">
                        <div class="cast-card timer-card">${escapeHtml(game.timerText || "00:00")}</div>
                    </div>
                </div>
            </div>

            <div class="player-banner">
                <span>Joueur actuel</span>
                <strong>${escapeHtml(game.currentPlayer || "-")}</strong>
            </div>

            ${game.roundEnded ? `
                <div class="cast-overlay">
                    <div class="cast-card cast-overlay-card">
                    <p class="eyebrow">Fin de manche</p>
                    <h2>${escapeHtml(game.roundEndTitle || "La manche est terminee")}</h2>
                    <p class="cast-copy">${escapeHtml(game.roundEndReason || "")}</p>
                    </div>
                </div>
            ` : ""}
        </section>
    `;
}

function renderFinalScreen(finalState) {
    const showStatus = finalState.started || finalState.winner || finalState.waitingForSuddenDeath;
    const bottomCard = finalState.winner
        ? `
            <div class="cast-card cast-victory-card">
                <p class="eyebrow">Victoire</p>
                <h2 class="cast-title">${escapeHtml(finalState.winner)} a gagne</h2>
            </div>
        `
        : finalState.waitingForSuddenDeath
            ? `
                <div class="cast-card cast-victory-card">
                    <p class="eyebrow">Mort subite</p>
                    <h2>Egalite</h2>
                </div>
            `
            : finalState.started
                ? `
                    <div class="cast-card">
                        <p class="eyebrow">${escapeHtml(finalState.modeLabel || "Questions")}</p>
                        <h2>${escapeHtml(finalState.currentPrompt || "-")}</h2>
                    </div>
                `
                : "";

    app.innerHTML = `
        <section class="cast-layout">
            <div>
                <p class="eyebrow">Finale</p>
                <h1 class="cast-title">${escapeHtml(finalState.title || "Duel final")}</h1>
                ${showStatus ? `<p class="cast-copy">${escapeHtml(finalState.status || "")}</p>` : ""}
            </div>

            <div class="cast-card cast-board-card">
                <div class="cast-final-board">
                    ${(finalState.rows || []).map((row) => `
                        <div class="final-row">
                            <div class="final-name">${escapeHtml(row.name)}</div>
                            ${(row.tokens || []).map((token) => `
                                <div class="final-token ${escapeHtml((token.classes || []).join(" "))}">${escapeHtml(token.text || "")}</div>
                            `).join("")}
                        </div>
                    `).join("")}
                </div>
            </div>

            ${bottomCard}
        </section>
    `;
}

function renderPrizeChain(prizes, currentStep) {
    const levels = [...prizes];

    return levels.reverse().map((prize, reverseIndex) => {
        const levelIndex = levels.length - reverseIndex;
        const isTop = reverseIndex === 0;
        const className = `${isTop ? "big-card" : "card"}${levelIndex === currentStep ? " active" : ""}`;
        return `<div class="${className}">${escapeHtml(String(prize))}</div>`;
    }).join("");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}
