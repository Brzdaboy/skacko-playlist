(() => {
  "use strict";

  const GOL_SONG = { file: "assets/gol-song.mp3", title: "GÓL! – siréna", id: "gol" };

  const player = document.getElementById("player");
  const goalBtn = document.getElementById("goalBtn");
  const goalIconPlay = document.getElementById("goalIconPlay");
  const goalIconStop = document.getElementById("goalIconStop");
  const goalLabel = document.getElementById("goalLabel");
  const playlistEl = document.getElementById("playlist");
  const offlineBadge = document.getElementById("offlineBadge");

  /** @type {{file:string, title:string, id:string}[]} */
  let tracks = [];
  let currentId = null; // id of whatever is currently loaded ("gol" or "t<index>")
  let isPlaying = false;

  function setPlayingUI(playing) {
    isPlaying = playing;
    const id = currentId;

    // goal button
    const goalActive = playing && id === "gol";
    goalBtn.classList.toggle("playing", goalActive);
    goalBtn.setAttribute("aria-pressed", String(goalActive));
    goalIconPlay.classList.toggle("icon-hidden", goalActive);
    goalIconStop.classList.toggle("icon-hidden", !goalActive);
    goalLabel.textContent = goalActive ? "STOP" : "GÓL!";

    // playlist rows
    document.querySelectorAll(".track").forEach((row) => {
      const active = playing && row.dataset.id === id;
      row.classList.toggle("active", active);
      const playIcon = row.querySelector(".track-play");
      playIcon.innerHTML = active ? eqSvg() : playSvgSmall();
    });
  }

  function playSvgSmall() {
    return '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  }

  function eqSvg() {
    return '<span class="eq"><span></span><span></span><span></span></span>';
  }

  function loadAndPlay(track) {
    const isCurrent = currentId === track.id;

    if (isCurrent && !player.paused && !player.ended) {
      player.pause();
      return;
    }

    if (!isCurrent) {
      player.src = track.file;
      currentId = track.id;
    }
    if (player.ended) {
      player.currentTime = 0;
    }
    player.play().catch((err) => {
      console.warn("Playback failed", err);
    });
    updateMediaSession(track);
  }

  function updateMediaSession(track) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: "SK Boršice",
      album: "Skácko Playlist",
      artwork: [
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  }

  function renderPlaylist() {
    playlistEl.innerHTML = "";
    tracks.forEach((track, index) => {
      const li = document.createElement("li");
      li.className = "track";
      li.dataset.id = track.id;
      li.setAttribute("role", "button");
      li.tabIndex = 0;
      li.innerHTML = `
        <span class="track-play">${playSvgSmall()}</span>
        <span class="track-title">${escapeHtml(track.title)}</span>
      `;
      const activate = () => loadAndPlay(track);
      li.addEventListener("click", activate);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
      playlistEl.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- goal button ---
  goalBtn.addEventListener("click", () => {
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (_) {}
    }
    loadAndPlay(GOL_SONG);
  });

  // --- shared audio element events ---
  player.addEventListener("play", () => setPlayingUI(true));
  player.addEventListener("pause", () => setPlayingUI(false));
  player.addEventListener("ended", () => setPlayingUI(false));

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => player.play());
    navigator.mediaSession.setActionHandler("pause", () => player.pause());
    navigator.mediaSession.setActionHandler("stop", () => {
      player.pause();
      player.currentTime = 0;
    });
  }

  // --- offline indicator ---
  function updateOnlineStatus() {
    offlineBadge.hidden = navigator.onLine;
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  // --- load playlist data then render ---
  fetch("assets/playlist.json")
    .then((res) => res.json())
    .then((data) => {
      tracks = data.map((t, i) => ({ ...t, id: `t${i}` }));
      renderPlaylist();
    })
    .catch((err) => {
      console.error("Nepodařilo se načíst playlist.json", err);
      playlistEl.innerHTML = '<li class="track" style="cursor:default">Playlist se nepodařilo načíst.</li>';
    });

  // --- service worker registration (offline support) ---
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.warn("Service worker registration failed", err);
      });
    });
  }
})();
