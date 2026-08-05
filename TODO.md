# TODO — Vendor Tracking as separate feature in Inventory

## Steps
- [x] 1. Add `mainView` state (`"inventory" | "tracking"`) to inventoryPage.tsx
- [x] 2. Add "Vendor Tracking" button in the Inventory header to switch to tracking view
- [x] 3. Wrap Search input + DynamicTable in conditional so they render only in inventory view
- [x] 4. Render VendorTracking with a "← Back to Inventory" button in tracking view
- [x] 5. Repoint DynamicTable `onStock` to open tracking view; remove empty tracking dialog
- [x] 6. Remove now-unused `trackingOpen`/`selectedRecord` state
- [x] 7. Verify compile (typecheck)
