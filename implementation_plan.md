# Implementation Plan - Configurable ZIP Output

The goal is to allow the user to fully configure the structure of the generated ZIP file, including folder names, order, and which templates go into which folder.

## User Review Required

> [!IMPORTANT]
> This change will migrate the hardcoded ZIP generation logic to a dynamic one based on user settings.
> Existing hardcoded logic in `zipPackager.ts` will be replaced.

## Proposed Changes

### Settings Component
#### [MODIFY] [FolderStructureSettings.tsx](file:///Users/andres/Documents/PROGRAMMI%20ANITGRAVITY/magic-form-bot/src/components/settings/FolderStructureSettings.tsx)
- Update `FolderDefinition` interface to include `assignedTemplates: string[]`.
- Fetch available templates (System + Local) using `TemplateManager` logic (or a shared hook).
- Add a UI element (Multi-select or Checkboxes) inside each folder card to assign templates.
- Allow configuring the "Root Folder Name" pattern (e.g., `{ID_CORSO} - {NOME_CORSO}`).

### ZIP Generation Service
#### [MODIFY] [zipPackager.ts](file:///Users/andres/Documents/PROGRAMMI%20ANITGRAVITY/magic-form-bot/src/services/zipPackager.ts)
- Import `loadFolderStructureSettings`.
- Create a `TemplateRegistry` that maps template IDs to generation functions.
- Refactor `createCompleteZIPPackage` to:
    1. Load settings.
    2. Create the root folder based on the configured pattern.
    3. Iterate through configured folders.
    4. For each folder, iterate through assigned templates.
    5. Call the appropriate generator from the registry.
    6. Add the generated file to the ZIP.

#### [NEW] [src/services/templateRegistry.ts](file:///Users/andres/Documents/PROGRAMMI%20ANITGRAVITY/magic-form-bot/src/services/templateRegistry.ts)
- Centralize the mapping between "Template ID" and "Generation Logic".
- Handle both System templates (hardcoded functions) and Local templates (generic Word processor).

## Verification Plan

### Manual Verification
1.  **Configure Settings**:
    *   Go to Settings > Folder Structure.
    *   Create a new folder "Test Folder".
    *   Assign "Registro Didattico" and a local template to it.
    *   Save.
2.  **Generate ZIP**:
    *   Run a test generation (using the "Test" button or normal flow).
    *   Download the ZIP.
3.  **Verify Output**:
    *   Unzip and check if "Test Folder" exists.
    *   Check if it contains the assigned files.
    *   Check if the root folder name matches the pattern.
