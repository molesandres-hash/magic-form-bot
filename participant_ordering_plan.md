# Implementation Plan - Participant Ordering System

## Objective
Implement a drag-and-drop interface in the wizard to allow users to reorder participants, and ensure this order is respected in all generated documents.

## User Review Required

> [!IMPORTANT]
> This change will add UI functionality to the wizard and modify how participant data is sorted in templates.

## Current State Analysis

### What We Have
- `Partecipante` interface has a `numero` field (line number/order)
- Participants are already stored with this field in the database
- Templates use `{#PARTECIPANTI}` loop but may not respect the order

### What's Missing
- UI to reorder participants via drag-and-drop
- Sorting logic in `templateRegistry.ts` to respect `numero` field
- Documentation of `{{numero}}` placeholder in guide

---

## Proposed Changes

### Phase 1: Verify and Fix Template Sorting

#### [MODIFY] [templateRegistry.ts](file:///Users/andres/Documents/PROGRAMMI%20ANITGRAVITY/magic-form-bot/src/services/templateRegistry.ts)
**Goal**: Ensure all participant loops are sorted by `numero` field

**Changes**:
1. Add `.sort((a, b) => a.numero - b.numero)` to all `PARTECIPANTI` mappings
2. Include `numero` field in the mapped data
3. Apply same sorting to `PARTECIPANTI_SESSIONE` and other participant lists

**Example**:
```typescript
PARTECIPANTI: (data.partecipanti || [])
  .sort((a, b) => a.numero - b.numero)  // <-- ADD THIS
  .map(p => ({
    numero: p.numero,  // <-- ADD THIS
    nome: p.nome,
    cognome: p.cognome,
    // ...
  }))
```

---

### Phase 2: Update Documentation

#### [MODIFY] [GUIDA_PLACEHOLDERS.md](file:///Users/andres/Documents/PROGRAMMI%20ANITGRAVITY/magic-form-bot/public/templates/GUIDA_PLACEHOLDERS.md)
**Goal**: Document the `{{numero}}` placeholder

**Changes**:
1. Add `{{numero}}` to the participant loop documentation
2. Add example showing numbered list
3. Explain that order can be controlled in the wizard

**Example**:
```markdown
### 👥 Lista Partecipanti (Loop)
All'interno del loop puoi usare:
- `{{numero}}` - Numero progressivo (1, 2, 3...)
- `{{nome}}` - Nome del partecipante
- `{{cognome}}` - Cognome del partecipante

Esempio:
{#PARTECIPANTI}
{{numero}}. {{nome}} {{cognome}}
{/PARTECIPANTI}
```

---

### Phase 3: Implement Drag-and-Drop UI

#### [FIND] Wizard Component
**Goal**: Locate the wizard component that displays participants

**Search Strategy**:
1. Search for "partecipanti" in component files
2. Look for participant list rendering
3. Identify the step where participants are shown

#### [NEW] [ParticipantReorderList.tsx](file:///Users/andres/Documents/PROGRAMMI%20ANITGRAVITY/magic-form-bot/src/components/wizard/ParticipantReorderList.tsx)
**Goal**: Create a reusable drag-and-drop list component

**Features**:
- Display participants in current order
- Drag handle icon for each row
- Visual feedback during drag
- Update `numero` field on drop
- Save order to state/database

**Technology**:
- Use `@dnd-kit/core` and `@dnd-kit/sortable` (already in project?)
- OR use native HTML5 drag-and-drop
- OR use a simpler approach with up/down buttons

**Component Structure**:
```tsx
interface ParticipantReorderListProps {
  participants: Partecipante[];
  onReorder: (reordered: Partecipante[]) => void;
}

export function ParticipantReorderList({ participants, onReorder }) {
  // Drag-and-drop logic
  // Update numero field when order changes
  // Call onReorder callback
}
```

#### [MODIFY] Wizard Step Component
**Goal**: Integrate the reorder list into the wizard

**Changes**:
1. Import `ParticipantReorderList`
2. Add a "Riordina Partecipanti" section or button
3. Handle reorder callback to update state
4. Persist changes to database/context

---

## Implementation Strategy

### Option A: Full Drag-and-Drop (Recommended)
**Pros**: Best UX, intuitive, modern
**Cons**: Requires drag-and-drop library or custom implementation
**Effort**: Medium (4-6 hours)

### Option B: Up/Down Buttons
**Pros**: Simple to implement, no dependencies
**Cons**: Less intuitive for many items
**Effort**: Low (1-2 hours)

### Option C: Manual Number Input
**Pros**: Very simple
**Cons**: Poor UX, error-prone
**Effort**: Very Low (30 min)

**Recommendation**: Start with **Option B** (up/down buttons) for quick implementation, then upgrade to **Option A** if needed.

---

## Verification Plan

### Automated Tests
- Unit test: Verify sorting logic in `templateRegistry.ts`
- Integration test: Verify reorder updates `numero` field

### Manual Verification
1. **Template Sorting**:
   - Generate a document with participants
   - Verify they appear in order by `numero`
   
2. **UI Reordering**:
   - Open wizard
   - Reorder participants using UI
   - Verify order is saved
   
3. **End-to-End**:
   - Reorder participants in wizard
   - Generate documents
   - Verify new order appears in documents

---

## Dependencies

### Check if drag-and-drop library exists:
```bash
grep -i "dnd-kit\|react-beautiful-dnd\|react-dnd" package.json
```

If not present, we can:
1. Add `@dnd-kit/core` and `@dnd-kit/sortable` (modern, lightweight)
2. Use HTML5 native drag-and-drop (no dependencies)
3. Use up/down buttons (no dependencies)

---

## Rollout Plan

1. **Phase 1** (Quick Win - 30 min):
   - Fix sorting in `templateRegistry.ts`
   - Update documentation
   - Deploy and verify documents are ordered correctly

2. **Phase 2** (UI Implementation - 2-4 hours):
   - Find wizard component
   - Implement reorder UI (buttons or drag-and-drop)
   - Test and deploy

3. **Phase 3** (Polish - optional):
   - Upgrade to full drag-and-drop if using buttons
   - Add visual indicators
   - Add keyboard shortcuts
