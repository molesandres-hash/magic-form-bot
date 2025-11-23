# Task: Import and Configure Templates

- [x] List files in `TEMPLATE/Documenti con NUOVI LOGHI` <!-- id: 0 -->
- [x] Copy `.docx` files to `public/templates` <!-- id: 1 -->
- [x] Run `scan:templates` to register them <!-- id: 2 -->
- [x] Verify they appear in `manifest.json` <!-- id: 3 -->
- [x] Notify user and explain placeholder insertion <!-- id: 4 -->

# Task: Implement Configurable ZIP Output

- [x] Create `src/services/templateRegistry.ts` <!-- id: 5 -->
- [x] Update `FolderStructureSettings.tsx` to support template assignment <!-- id: 6 -->
- [x] Update `zipPackager.ts` to use dynamic settings <!-- id: 7 -->
- [/] Verify ZIP generation with custom settings <!-- id: 8 -->

# Task: Implement New Placeholders for Modello A

- [x] Update `templateRegistry.ts` with FAD and Participant placeholders <!-- id: 9 -->
- [x] Update `GUIDA_PLACEHOLDERS.md` with new keys <!-- id: 10 -->

# Task: Implement Modello B (Daily FAD Sheets)

- [x] Update `templateRegistry.ts` with `giorno`, `mese`, `anno` and nested participants <!-- id: 11 -->
- [x] Update `GUIDA_PLACEHOLDERS.md` with Modello B instructions <!-- id: 12 -->

# Task: Implement Verbale Placeholders

- [x] Update `templateRegistry.ts` with verbale and responsible persons data <!-- id: 13 -->
- [x] Update `GUIDA_PLACEHOLDERS.md` with verbale placeholders <!-- id: 14 -->
