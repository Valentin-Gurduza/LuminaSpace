# LuminaSpace

**Română** | [English](README.en.md)

LuminaSpace este o aplicație web pentru amenajarea camerelor și explorarea iluminării interioare. Poți configura o încăpere, amplasa mobilier și corpuri de iluminat și compara rezultatul într-un plan 2D sau într-o scenă 3D interactivă.

[Deschide aplicația](https://lumina-space-eight.vercel.app/) · [Repository GitHub](https://github.com/Valentin-Gurduza/LuminaSpace)

## Funcționalități

- **Vizualizare:** modurile `3D Orbit`, `2D Floorplan`, `Walkthrough` și `Isometric`.
- **Configurarea camerei:** dimensiuni, grosimea pereților, culori, texturi, materiale pentru pardoseală și ferestre pe fiecare latură.
- **Catalog de mobilier:** scaune și canapele, mese, depozitare, paturi, corpuri de iluminat, decorațiuni, plante și elemente arhitecturale.
- **Editarea obiectelor:** adăugare, deplasare, rotație, scalare, schimbarea culorilor, duplicare și ștergere.
- **Iluminare:** preseturi, direcția și intensitatea soarelui, temperatură de culoare, lumină ambientală, expunere și configurarea corpurilor de iluminat.
- **Planificare:** aliniere la grilă cu pași de 0,1 m, 0,25 m sau 0,5 m și afișarea dimensiunilor camerei în planul 2D.
- **Undo/Redo:** istoric pentru mobilier, cameră și iluminare; o editare continuă este grupată într-o singură operație.
- **Șabloane și export:** camere predefinite, import/export JSON și export PNG pentru planul 2D sau vederea 3D curentă.
- **Interfață adaptată dispozitivului:** panouri laterale pe desktop și panouri suprapuse pe mobil.

Scena 3D păstrează geometria mobilierului la modificări de poziție, rotație sau scară. Randarea se actualizează la schimbări și în timpul deplasării în modul Walkthrough; resursele GPU sunt eliberate la înlocuirea sau eliminarea obiectelor.

## Tehnologii

| Tehnologie | Rol |
| --- | --- |
| React 19 și TypeScript | Interfață, starea editorului și tipuri de date |
| Vite 8 | Server de dezvoltare și build pentru producție |
| Three.js | Scenă 3D, materiale, iluminare și umbre |
| SVG | Plan 2D, dimensiuni și manipularea obiectelor |
| Tailwind CSS 4 și Lucide React | Stiluri și pictograme |
| Node.js Test Runner și Playwright | Teste unitare și teste în browser |

## Instalare și pornire

Ai nevoie de Git, **Node.js 22.12+** și **Bun 1.4+**. Node.js 24 este o opțiune potrivită. Pentru vizualizarea 3D, folosește un browser actualizat care suportă WebGL 2.

Repository-ul include `bun.lock`; instalarea cu Bun păstrează versiunile din lockfile.

```bash
git clone https://github.com/Valentin-Gurduza/LuminaSpace.git
cd LuminaSpace
bun install --frozen-lockfile
npm run dev
```

Pentru rulare pe calculatorul propriu, deschide `http://localhost:3000` în browser. Într-un environment cloud, accesul din browserul tău depinde de opțiunile platformei pentru expunerea portului; poți folosi și versiunea publicată pe Vercel.

### Variabile de mediu

Funcționalitățile actuale nu necesită chei API sau un fișier `.env`. Variabilele `GEMINI_API_KEY` și `APP_URL` din `.env.example` nu sunt utilizate de editorul actual.

Configurația Vite acceptă opțional `DISABLE_HMR=true`, care dezactivează actualizarea automată și monitorizarea fișierelor în timpul dezvoltării.

## Comenzi disponibile

| Comandă | Descriere |
| --- | --- |
| `npm run dev` | Pornește serverul de dezvoltare pe portul 3000 |
| `npm run lint` | Verifică tipurile TypeScript, fără generarea de fișiere |
| `npm test` | Rulează testele unitare și testele în browser |
| `npm run build` | Generează versiunea de producție în `dist/` |
| `npm run preview` | Servește local build-ul existent; necesită mai întâi `npm run build` |

### Teste în browser

Testele folosesc Chromium. Dacă nu ai deja un browser configurat, instalează-l prin Playwright:

```bash
npx playwright install chromium
npm test
```

Pe Linux, dacă lipsesc bibliotecile de sistem necesare, folosește `npx playwright install --with-deps chromium`; instalarea lor poate necesita drepturi de administrator.

Testele aleg browserul indicat de variabila `CHROMIUM_PATH`, apoi `/usr/bin/chromium` dacă există, altfel Chromium instalat de Playwright. Serverul Vite pentru teste pornește și se oprește automat pe portul **4174**, care trebuie să fie liber.

Suita verifică istoricul editărilor, exportul 2D, interfața mobilă, importurile invalide, limitele obiectelor rotite/scalate, deplasarea în Walkthrough și utilizarea resurselor GPU.

## Utilizare

1. Alege o cameră din **Templates** sau configurează camera în **Inspector**.
2. Adaugă obiecte din catalog prin **Add** sau prin tragere în scenă.
3. Selectează un obiect și modifică poziția, rotația, dimensiunile prin scalare sau culorile din Inspector.
4. Reglează iluminarea și compară modurile de vizualizare.
5. Salvează amenajarea prin **Templates → Export JSON**. Pentru restaurare, folosește **Import JSON**.
6. Folosește **Export Render → Download PNG** pentru a salva imaginea.

Pe mobil, butoanele **Furniture** și **Inspector** deschid panourile de lucru.

### Controale

| Acțiune | Control |
| --- | --- |
| Selectare și deplasare obiect | Click/atingere și tragere pe obiect în modul 2D sau 3D Orbit |
| Rotirea camerei în 3D | Click și tragere pe o zonă liberă |
| Deplasarea camerei în 3D | Click dreapta și tragere |
| Deplasarea planului 2D | Tragere pe fundal |
| Zoom | Rotița mouse-ului |
| Rotirea obiectului în 2D | Tragerea mânerului de rotație; `Shift` fixează pași de 15° |
| Deplasare în Walkthrough | `W`, `A`, `S`, `D` sau tastele săgeți |
| Privire în Walkthrough | Click și tragere |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Y` sau `Ctrl/Cmd + Shift + Z` |
| Duplicarea obiectului selectat | `Ctrl/Cmd + D` |
| Ștergerea obiectului selectat | `Delete` sau `Backspace` |
| Deselectare | `Escape` |

Scurtăturile editorului sunt suspendate când scrii într-un câmp de formular.

## Salvare și limite actuale

- Proiectul curent este păstrat în memoria paginii. Exportă JSON înainte să închizi sau să reîncarci pagina; nu există salvare automată, conturi de utilizator sau stocare în cloud.
- Fișierul JSON conține `roomSettings`, `lighting` și `furniture`. Importul validează structura, valorile numerice, culorile, modelele din catalog și ID-urile unice înainte să înlocuiască proiectul curent.
- Importul acceptă fișiere de cel mult **2 MB** și cel mult **200 de obiecte**. Acestea sunt limite de import, nu o garanție de performanță pentru orice dispozitiv.
- Poziționarea ține cont de rotația și scara obiectelor. Dacă un obiect este mai mare decât camera, este centrat pe axa pe care nu încape; nu este micșorat automat.
- Exportul 2D încadrează întregul plan și cotele, independent de deplasarea vederii, cu latura maximă de **2048 px**. Grila de fundal și ghidajele pentru raza luminilor sunt omise din imagine.
- Exportul 3D capturează perspectiva curentă la rezoluția canvasului. Aspectul și performanța depind de browser și de dispozitiv.
- Modul Walkthrough folosește tastatura pentru deplasare; nu are încă butoane dedicate deplasării pe ecrane tactile.

## Structura proiectului

```text
src/
├── App.tsx                 # Starea editorului și coordonarea interfeței
├── components/             # Vederi 2D/3D, panouri, bare de instrumente și modale
├── data/                   # Catalog de mobilier și preseturi de cameră/iluminare
├── types/                  # Tipurile camerei, mobilierului și iluminării
└── utils/                  # Istoric, validare, export, modele și texturi procedurale
tests/
├── editor.test.ts          # Teste unitare pentru logica editorului și resurse
└── browser.test.cjs        # Teste de interfață și WebGL cu Playwright
```

## Publicare pe Vercel

Aplicația se publică sub forma unui frontend static. În Vercel, importă repository-ul GitHub și verifică setările:

| Setare | Valoare |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | Rădăcina repository-ului |
| Install Command | `bun install --frozen-lockfile` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | `24.x` |
| Production Branch | `main` |

Pentru actualizări, trimite modificările pe GitHub și integrează-le în `main`. Dacă integrarea Git și publicarea automată sunt active, Vercel creează un nou deployment de producție. Verifică rezultatul în **Deployments**; un commit păstrat doar local nu actualizează aplicația publicată.
