# Security Specification & Test Protocol

## 1. Data Invariants
1. **User Identity Isolation**: A user can only access, create, update, or delete records located within their own subcollection `/users/{userId}/records/{recordId}` where `request.auth.uid == userId`.
2. **Profile Integrity**: A user can only write to their own profile `/users/{userId}`.
3. **Owner Field Verification**: Every record created must match `request.auth.uid == incoming().userId`.
4. **Key Whitelisting**: Payloads cannot inject unauthorized keys or overwrite immutable fields like `id` and `userId`.
5. **String Boundary Limits**: Document IDs must conform to `^[a-zA-Z0-9_\-]+$` and text fields must satisfy `.size()` constraints.
6. **Status Enumeration**: Record statuses must be one of `['Follow-up Required', 'Active Treatment', 'Resolved', 'Monitoring']`.

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempting to read `/users/user123/records/rec1` without auth.
2. **Cross-Tenant Read**: User B reading User A's `/users/userA/records/rec1`.
3. **Cross-Tenant Write**: User B writing to User A's `/users/userA/records/rec2`.
4. **Identity Spoofing in Payload**: User A creating record in `/users/userA/records/rec1` with `userId: "userB"`.
5. **Path Poisoning**: Document ID with invalid characters `../../admin`.
6. **Denial of Wallet 1MB String**: An attacker sending a 2MB junk text into `disease` or `notes`.
7. **Invalid Status Injection**: Trying to set `status: "HACKED_STATE"`.
8. **Profile Privilege Escalation**: User A attempting to write `role: "superadmin"` into `/users/userB`.
9. **Blanket Collection Query**: An unauthenticated user querying `/users`.
10. **Immutable Field Mutated**: Attempting to mutate `userId` on update.
11. **Negative Confidence Value**: Passing `confidence: -50` or `confidence: 9999`.
12. **Ghost Field Injection**: Attempting to inject unexpected fields like `backdoorAdmin: true`.

## 3. Rules Implementation Target
The security rules in `firestore.rules` will enforce:
- Default deny: `match /{document=**} { allow read, write: if false; }`
- User profile isolation: `match /users/{userId}` with strict owner checks and key validation.
- User scan records isolation: `match /users/{userId}/records/{recordId}` with strict owner checks, `isValidId()`, and `isValidScanRecord()`.
