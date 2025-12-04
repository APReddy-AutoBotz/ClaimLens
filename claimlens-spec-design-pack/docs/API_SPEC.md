
# ClaimLens — API Spec (MVP)

## POST /v1/menu/feed  (Profile: menushield_in)
Request:
- single `MenuItem` or array

Response:
- `Verdict` with reasons, changes, audit_id

## GET /v1/export/menu.ndjson
- Emits line‑delimited cleaned menu items

## POST /v1/web/ingest  (Profile: claimlens_go)
- Input: DOM extract or simplified item
- Output: overlay badges + reasons
