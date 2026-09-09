# Phase 1 publication — September 8, 2026

- Public fork: https://github.com/ModDayJob/gods-eye-view
- Phase 1 source/download branch: https://github.com/ModDayJob/gods-eye-view/tree/codex/phase-1
- Upstream draft pull request: https://github.com/bilawalsidhu/gods-eye-view/pull/199
- Successful GitHub checks: https://github.com/ModDayJob/gods-eye-view/actions/runs/34283599216
- Verified published commit: 2273fe543f79013d09c07a885fb03bf0ebb1964c
- Base: ac927de71a322991b513e45098326dbdfe8f9084
- All 42 changed files matched the reviewed local copy by Git blob hash.
- Private .env excluded; configured key values absent from selected source files.
- Clean npm ci, 2,613 unit/allocation checks, 11 Phase 1 checks and build passed.
- GitHub Phase 1 workflow also completed successfully.

Use the Phase 1 branch link above, then Code → Download ZIP. Extract, open a
terminal in the folder, run npm ci and npm start with supported Node 24 or 26.
The fork's main branch still mirrors upstream; Phase 1 is on codex/phase-1.
The browser-uploaded macOS .command file is not executable by default; npm start
is the recommended portable entry point.

The draft has conflicts with newer upstream work (18 intervening commits).
Four previously observed grounded-aircraft/model regression failures remain
open. The browser tracking suite was not rerun for this publication. Maintainer
edit/access-to-secrets permission was left unchecked. No merge or final release
tag has been created.
