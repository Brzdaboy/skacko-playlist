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
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  /** @type {{file:string, title:string, id:string}[]} */
  let tracks = [];
  let currentId = null;
  let currentTrackIndex = -1;
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

  function playByIndex(index) {
    if (tracks.length === 0) return;
    if (index < 0) index = tracks.length - 1;
    if (index >= tracks.length) index = 0;
    currentTrackIndex = index;
    loadAndPlay(tracks[index]);
  }

  function playNext() {
    playByIndex(currentTrackIndex < 0 ? 0 : currentTrackIndex + 1);
  }

  function playPrev() {
    playByIndex(currentTrackIndex < 0 ? tracks.length - 1 : currentTrackIndex - 1);
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
        { src: "icons/skb-logo-800x800x200-200x200.png", sizes: "800x800", type: "image/png" },
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
      const activate = () => {
        currentTrackIndex = index;
        loadAndPlay(track);
      };
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

  // --- prev / next buttons ---
  prevBtn.addEventListener("click", playPrev);
  nextBtn.addEventListener("click", playNext);

  // --- swipe left / right ---
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) playNext();
      else playPrev();
    }
  }, { passive: true });

  // --- keyboard arrow keys ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") playNext();
    if (e.key === "ArrowLeft") playPrev();
  });

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
  player.addEventListener("ended", () => {
    setPlayingUI(false);
    if (currentId !== "gol" && currentTrackIndex >= 0) playNext();
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => player.play());
    navigator.mediaSession.setActionHandler("pause", () => player.pause());
    navigator.mediaSession.setActionHandler("stop", () => {
      player.pause();
      player.currentTime = 0;
    });
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("previoustrack", playPrev);
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
