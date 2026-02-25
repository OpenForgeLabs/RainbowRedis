---
"@openforgelabs/rainbow-redis": patch
---

Improve Redis key explorer interactions and search behavior.

- Add explicit search execution (Enter/button) with support for pattern, exhaustive pattern, and exact key modes.
- Improve key tabs UX: stable ordering, full-tab click selection, close-all tabs, and empty-state guidance.
- Refine keys panel layout (collapse/expand handle, resize affordance, compact collapsed width).
- Clean selected key header metadata section and remove unnecessary periodic re-render polling.
