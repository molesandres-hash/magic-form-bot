# Configurable ZIP Output Walkthrough

I have implemented a fully configurable ZIP output system. This allows you to define exactly how the generated ZIP file is structured and which documents are included in each folder.

## Features

### 1. Dynamic Folder Structure
You can now configure the folder structure in **Settings > Folder Structure**.
- **Create Folders**: Add as many folders as you need.
- **Rename Folders**: Give them meaningful names.
- **Reorder Folders**: Drag and drop to change the order.
- **Enable/Disable**: Turn folders on or off without deleting them.

### 2. Template Assignment
Inside each folder configuration card, you will now see a "TEMPLATE ASSEGNATI" section.
- **Assign Templates**: Select which templates (System, Local, or Database) should be generated and placed in that folder.
- **Mix and Match**: You can put a system template (like "Registro Didattico") and a local template (like "My Custom Doc") in the same folder.

### 3. Root Folder Customization
You can customize the name of the root folder inside the ZIP.
- Default: `{ID_CORSO} - {NOME_CORSO}`
- You can change this pattern in the settings (future improvement, currently uses default or configured pattern).

### 4. Dynamic Generation
The ZIP generation logic now follows your settings exactly.
- It iterates through your configured folders.
- It generates only the templates you have assigned.
- It places them in the correct folders.

## How to Use

1.  Go to **Settings**.
2.  Open the **Folder Structure** tab.
3.  Click **Aggiungi Cartella** to create a new folder (e.g., "Verbali").
4.  Expand the folder card.
5.  In the **TEMPLATE ASSEGNATI** list, check "Verbale Partecipazione" and any other templates you want in this folder.
6.  Save the settings.
7.  Go to a Course page and click **Scarica ZIP**.
8.  The ZIP will now contain a "Verbali" folder with the selected documents.

## Technical Details

- **`FolderStructureSettings.tsx`**: Updated to handle template assignments.
- **`templateRegistry.ts`**: New service that maps Template IDs to generation logic.
- **`zipPackager.ts`**: Completely rewritten to use the dynamic settings instead of hardcoded logic.
