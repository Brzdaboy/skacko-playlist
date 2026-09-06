#!/usr/bin/env node
// Regeneruje assets/playlist.json podle obsahu assets/songs/.
//
// Nové soubory (s mezerami, velkými písmeny, [Official Video] apod.) se
// automaticky přejmenují na bezpečný tvar pro web (slug) a do playlistu
// se přidá hezký název bez zbytečných "(Official Video)" apod.
// Už zpracované soubory (které už mají tvar slugu) se nechají na pokoji,
// jen se pro ně dohledá/zachová název v playlist.json.
//
// Použití:  node scripts/generate-playlist.js
"use strict";
const fs = require("fs");
const path = require("path");

const SONGS_DIR = path.join(__dirname, "..", "assets", "songs");
const PLAYLIST_JSON = path.join(__dirname, "..", "assets", "playlist.json");

const TAG_WORDS = [
  "official", "video", "videoklip", "videoclip", "lyrics",
  "audio", "oficiální", "remaster", "hd", "4k",
];

function stripDiacritics(str) {
  return str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function cleanTitle(base) {
  let title = base.replace(/\s*[([]([^()[\]]*)[)\]]/g, (match, inner) => {
    const lower = inner.toLowerCase();
    return TAG_WORDS.some((w) => lower.includes(w)) ? "" : match;
  });
  title = title.replace(/\s{2,}/g, " ").trim();
  title = title.replace(/[-\s]+$/, "").trim();
  return title;
}

function slugify(base) {
  let s = stripDiacritics(base).toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  return s || "song";
}

function looksLikeSlug(filenameNoExt) {
  return /^[a-z0-9-]+$/.test(filenameNoExt);
}

function titleCaseFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function main() {
  if (!fs.existsSync(SONGS_DIR)) {
    console.error("Složka assets/songs neexistuje:", SONGS_DIR);
    process.exit(1);
  }

  let existing = [];
  if (fs.existsSync(PLAYLIST_JSON)) {
    existing = JSON.parse(fs.readFileSync(PLAYLIST_JSON, "utf8"));
  }
  const existingTitleByFile = new Map(existing.map((e) => [path.basename(e.file), e.title]));

  const files = fs.readdirSync(SONGS_DIR).filter((f) => f.toLowerCase().endsWith(".mp3"));
  const usedSlugs = new Set();
  const entries = [];

  for (const file of files.sort((a, b) => a.localeCompare(b, "cs"))) {
    const base = file.replace(/\.mp3$/i, "");
    let targetFile = file;
    let title;

    if (looksLikeSlug(base)) {
      title = existingTitleByFile.get(file) || titleCaseFromSlug(base);
    } else {
      title = cleanTitle(base);
      const baseSlug = slugify(base);
      let candidate = baseSlug;
      let i = 2;
      while (usedSlugs.has(candidate) || fs.existsSync(path.join(SONGS_DIR, `${candidate}.mp3`))) {
        candidate = `${baseSlug}-${i++}`;
      }
      targetFile = `${candidate}.mp3`;
      fs.renameSync(path.join(SONGS_DIR, file), path.join(SONGS_DIR, targetFile));
      console.log(`Přejmenováno: "${file}" -> "${targetFile}"`);
    }

    usedSlugs.add(targetFile.replace(/\.mp3$/i, ""));
    entries.push({ file: `assets/songs/${targetFile}`, title });
  }

  fs.writeFileSync(PLAYLIST_JSON, JSON.stringify(entries, null, 2) + "\n", "utf8");
  console.log(`Hotovo – playlist.json teď obsahuje ${entries.length} písniček.`);
}

main();
