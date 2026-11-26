# Security Specification — Catálogo & Administración

## 1. Data Invariants

1. **Admin-Only Mutations**: Only verified admin accounts (`request.auth.token.email_verified == true` matching the bootstrapped store owner email or an entry in `/admins/{uid}`) may create, update, or delete `/products/{productId}` or write `/settings/store`.
2. **Public Catalog Read Separation**: Unauthenticated customers can only `get` `/settings/store` and `get`/`list` `/products` where `published == true`. Unpublished/draft products and `/admins` are hidden from non-admins.
3. **Strict Schema & Size Boundaries**: Every string, number, and key set is bounded (`name <= 120`, `description <= 1000`, `imageUrl <= 250000`, `price >= 0`, strict `hasAll` + `hasOnly` on create, `affectedKeys().hasOnly()` on update).
4. **Temporal & Ownership Immutability**: `createdAt` and `createdBy` must match `request.time` and `request.auth.uid` on creation and are strictly immutable on updates. `updatedAt` must equal `request.time`.
5. **Path ID Hardening**: All document IDs (`productId`, `settingId`, `adminId`) must match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)

1. **Unauthenticated Product Create**: Anonymous client writes to `/products/p1` -> Denied (`isAdmin()` fails).
2. **Unverified Email Admin Spoof**: User with `email_verified: false` claiming admin email writes `/settings/store` -> Denied (`email_verified == true` check fails).
3. **Non-Admin Authenticated Write**: Random signed-in customer updates `/products/p1` price to `0` -> Denied (`isAdmin()` fails).
4. **Shadow Field Injection on Create**: Admin creates `/products/p1` with extra ghost field `isVerified: true` -> Denied (`hasOnly` rejects).
5. **Shadow Field Injection on Update**: Admin updates `/products/p1` with `createdBy: 'other-uid'` -> Denied (`affectedKeys().hasOnly()` + immutability check rejects).
6. **Negative Price Poisoning**: Admin creates `/products/p1` with `price: -50` -> Denied (`price >= 0` rejects).
7. **Oversized String / Denial of Wallet**: Admin creates `/products/p1` with `name` > 120 chars or `description` > 1000 chars -> Denied (`size()` boundary rejects).
8. **Path ID Poisoning**: Request targets `/products/bad$id..with..chars` -> Denied (`isValidId` regex rejects).
9. **Client Timestamp Forgery**: Payload supplies custom `createdAt` different from `request.time` -> Denied (`createdAt == request.time` rejects).
10. **Unpublished Product Leakage**: Non-admin executes `get` or `list` targeting unpublished product (`published: false`) -> Denied (`published == true` check rejects).
11. **Self-Assigned Admin Escalation**: Non-admin user writes `/admins/<their_uid>` -> Denied (`isBootstrappedAdmin()` required).
12. **Settings Document Deletion / Arbitrary Settings ID**: Attempt to delete `/settings/store` or write `/settings/evil` -> Denied (`settingId == 'store'` and `allow delete: if false`).
