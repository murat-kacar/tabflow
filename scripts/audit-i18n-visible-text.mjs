import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["src/apps/tenant-web/app", "src/apps/platform-web/app"];
const extensions = new Set([".ts", ".tsx"]);
const ignoredFragments = [
  "/i18n/dictionaries/tr.ts",
  "/node_modules/",
  "/.next/",
  "/dist/",
  "/coverage/"
];

const turkishCharPattern = /[çğıöşüÇĞİÖŞÜ]/;
const asciiTurkishWords = [
  "Acik",
  "Acil",
  "Adim",
  "Aktif",
  "Anahtar",
  "Bilinmiyor",
  "Cihaz",
  "Cikis",
  "Deneme",
  "Dikkat",
  "Duzen",
  "Duzeni",
  "Duzenleme",
  "Giris",
  "Gorunen",
  "Guncelle",
  "Hazir",
  "Henuz",
  "Hesap",
  "Ilk",
  "Isletme",
  "Istasyon",
  "Kapanis",
  "Kapali",
  "Kasa",
  "Kaydet",
  "Kayit",
  "Kisi",
  "Kullanici",
  "Kurulum",
  "Masa",
  "Musteri",
  "Mutfak",
  "Odeme",
  "Olustur",
  "Pasif",
  "Rol",
  "Sec",
  "Sicak",
  "Sifre",
  "Sil",
  "Siparis",
  "Son",
  "Toplam",
  "Tum",
  "Urun",
  "Yonet",
  "acik",
  "cihaz",
  "guncelle",
  "hazir",
  "hesap",
  "isletme",
  "istasyon",
  "kasa",
  "kaydet",
  "musteri",
  "odeme",
  "olustur",
  "sec",
  "sil",
  "siparis",
  "urun",
  "yonet"
];
const asciiTurkishPattern = new RegExp(`\\b(${asciiTurkishWords.join("|")})\\b`);

function hasAllowedExtension(path) {
  return [...extensions].some((extension) => path.endsWith(extension));
}

function shouldIgnore(path) {
  const normalized = path.replaceAll("\\", "/");
  return ignoredFragments.some((fragment) => normalized.includes(fragment));
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (!shouldIgnore(path)) {
        walk(path, files);
      }
      continue;
    }

    if (hasAllowedExtension(path) && !shouldIgnore(path)) {
      files.push(path);
    }
  }

  return files;
}

const findings = [];

for (const scanRoot of scanRoots) {
  const absoluteRoot = join(root, scanRoot);
  for (const file of walk(absoluteRoot)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (turkishCharPattern.test(line) || asciiTurkishPattern.test(line)) {
        findings.push({
          file: relative(root, file),
          line: index + 1,
          text: line.trim()
        });
      }
    });
  }
}

if (findings.length > 0) {
  console.error("i18n visible text audit failed. Move user-visible text into dictionaries.");
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: ${finding.text}`);
  }
  process.exit(1);
}

console.log("i18n visible text audit passed.");
