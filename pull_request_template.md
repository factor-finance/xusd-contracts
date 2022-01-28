If you made a contract change, make sure to complete the checklist below before merging it in master.

Contract change checklist:
  - [ ] Code reviewed by 1 reviewers.
  - [ ] Unit tests pass – `yarn test`
  - [ ] Smoke tests pass: `./scripts/smokeTest.sh`
  - [ ] Slither tests pass with no warning: `yarn slither` (repair with `yarn slither:triage`)
  - [ ] Echidna tests pass if PR includes changes to XUSD contract (not automated, run manually on local): `yarn echidna`
