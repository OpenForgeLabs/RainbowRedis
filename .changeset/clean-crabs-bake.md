---
"@openforgelabs/rainbow-redis": minor
---

Improve the Redis keys editing experience with a new CodeMirror-based raw editor, including theme-aligned syntax highlighting, embedded JSON-string editing, and better tab/list navigation behavior.

- Replace the raw value editor implementation with a single CodeMirror editor surface
- Align JSON token colors and search panel styles with the application design system theme tokens
- Add click-to-edit support for embedded JSON strings and save them back as escaped JSON strings
- Auto-save the key when saving embedded JSON content from the modal
- Keep loaded keys across pagination, preserve selected tabs, and scroll the key list to the selected key
