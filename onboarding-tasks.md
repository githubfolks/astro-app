# Onboarding Tasks — Astrologer Post-Welcome Checklist

The "Welcome Onboard" email (Step 4, `build_onboarding_started_email` in
`api/app/services/email_service.py`) promises a self-service checklist after
login. All five items below are now built and live in `web/src/pages/Dashboard.tsx`.

## Checklist items

- [x] **Personal Details** — alternate/WhatsApp number.
  - `AstrologerProfile.whatsapp_number`. Editable in the "Personal Details" card.

- [x] **Contract Signing** — digital contract prompted after login.
  - `AstrologerProfile.contract_signed_at` / `contract_signature_name`.
  - `GET /astrologers/contract`, `POST /astrologers/contract/sign` (timestamp set
    server-side only — not editable via the generic profile-update endpoint).
  - UI: `web/src/components/ContractSignCard.tsx`.

- [x] **Document Upload (KYC)** — PAN, Aadhaar, Bank details.
  - `AstrologerProfile.pan_number` / `pan_doc_url` / `aadhaar_number` /
    `aadhaar_doc_url` / `bank_account_holder_name` / `bank_account_number` / `bank_ifsc`.
  - UI: `web/src/components/KycDocumentsCard.tsx`.

- [x] ~~Gallery Photos~~ — dropped per product decision (2026-07-15). Replaced
  with a simple "Change Profile Photo" option instead (see below).

- [x] **Profile Photo** — astrologer can change their own profile photo post-login.
  - Reuses existing `AstrologerProfile.profile_picture_url`.
  - UI: `web/src/components/ProfilePhotoCard.tsx`.

- [x] **Certificate Upload** — astrology certificates, optional, for internal
  verification.
  - `AstrologerProfile.certificate_urls` (JSON list, images or PDF).
  - UI: `web/src/components/CertificatesCard.tsx`.

## Shared infra added

- `POST /astrologers/documents/upload` — authenticated upload (5MB limit,
  image/PDF) used by KYC docs, gallery photos, and certificates. Separate from
  the public/unauthenticated `/astrologers/onboarding/photo` used at signup.
- Migration: `alembic/versions/2c062ba620d6_add_contract_kyc_gallery_certificate_.py`.

## Admin-side KYC review

- `AstrologerProfile.kyc_verified` / `kyc_verified_at` — set only via
  `PUT /admin/astrologers/{user_id}/kyc` (admin-only, not exposed on the
  astrologer's own profile-update endpoint).
- Editing any KYC field (PAN/Aadhaar number or doc, bank details) resets
  `kyc_verified` to `False` automatically, forcing re-review.
- Admin UI: `admin/src/pages/UserDetails.jsx` — "KYC & Documents" card shows
  contract-signed status, PAN/Aadhaar numbers + doc links, bank details,
  certificate links, and a Verify/Unverify toggle.

## Not yet done

- No automated notification to the astrologer when KYC is verified/unverified
  by admin (e.g. an email), and no "pending KYC" filter/count on the admin
  Astrologers list.
