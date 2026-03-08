# @openforgelabs/rainbow-redis

## 1.1.0

### Minor Changes

- 5aa4da3: Improve the Redis keys editing experience with a new CodeMirror-based raw editor, including theme-aligned syntax highlighting, embedded JSON-string editing, and better tab/list navigation behavior.

  - Replace the raw value editor implementation with a single CodeMirror editor surface
  - Align JSON token colors and search panel styles with the application design system theme tokens
  - Add click-to-edit support for embedded JSON strings and save them back as escaped JSON strings
  - Auto-save the key when saving embedded JSON content from the modal
  - Keep loaded keys across pagination, preserve selected tabs, and scroll the key list to the selected key

## 1.0.2

### Patch Changes

- 31faa98: Improve Redis key explorer interactions and search behavior.

  - Add explicit search execution (Enter/button) with support for pattern, exhaustive pattern, and exact key modes.
  - Improve key tabs UX: stable ordering, full-tab click selection, close-all tabs, and empty-state guidance.
  - Refine keys panel layout (collapse/expand handle, resize affordance, compact collapsed width).
  - Clean selected key header metadata section and remove unnecessary periodic re-render polling.
