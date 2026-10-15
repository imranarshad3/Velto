# Product photo assistant

Admin → Products → New product starts with a photo uploader. Select one or two label photos, optionally add known details, then Generate with AI. Review the draft before saving. The first photo is uploaded to the existing Media Library only when the product is saved. The second photo is used only for analysis.

Existing entries are preserved by default. The replacement checkbox permits replacing descriptive fields; edits made during analysis are still preserved. Price, inventory, verification, publication and documents are never generated. Unknown facts remain empty and are listed for review.

## Server configuration

Set these in the local ignored `.env` and Vercel production environment, then restart/redeploy:

- `GROQ_API_KEY`: server-only Groq key.
- `GROQ_VISION_MODEL`: defaults to `qwen/qwen3.8-27b`.
- `OLLAMA_API_KEY`: optional server-only fallback key.
- `OLLAMA_VISION_MODEL`: defaults to `gemma4:31b` (vision capability verified).

Never prefix secret keys with `VITE_`. Groq is attempted first; provider errors, invalid drafts, timeouts or quota failures trigger at most one Ollama request. Both providers unavailable means a recoverable error and manual editing remains available. Each provider has a 45-second timeout.

`POST /api/admin/products/ai-generate` requires a verified Clerk session, permitted catalog staff role and an allowed origin. Persistent limits allow five attempts per user per ten minutes and 100 globally per day. Two photos maximum, 2.5 MB combined decoded bytes; actual JPEG/PNG/WebP decoding and normalization strip metadata. Strict Zod validation rejects unknown output properties and operational fields. Generation never writes products or media.

Official APIs: https://console.groq.com/docs/vision and https://docs.ollama.com/api/openai-compatibility. Provider output is untrusted and requires human review even when schema-valid.

Validation: `npm test`, `npm run build`, `npm run lint`. Regression tests in `tests/aiProduct.test.ts` cover authorization, origins, limits, image decoding, provider failures, fallback and preservation of manual edits.
