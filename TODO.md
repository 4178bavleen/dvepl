# TODO — Permission Gating for Action Buttons

## Steps

1. **vendorsPage.tsx** — Import `usePermissions` and gate:
   - `canCreate` → "+ Add Vendor" button and "Generate PO" / Data Entry column button
   - `canEdit` → "Load" revision button
   - `canDelete` → GenericTable `onDelete` (belt-and-suspenders)
   - `canEdit` → GenericTable `onEdit` (belt-and-suspenders)

2. **inventoryPage.tsx** — Inspect and gate custom action buttons with `usePermissions` (create/edit/delete).

3. **Other pages with custom action buttons** — Search for `Button`, `+`, `Add`, `Create`, `onClick` patterns and gate them.

4. **Verify** — Run typecheck/build to ensure no TS errors.

