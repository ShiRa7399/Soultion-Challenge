# Security Spec: Rapid Crisis Response System

## 1. Data Invariants
- An alert must have a type from the allowed list: `Fire`, `Medical`, `Lift`, `Security`, `Other`.
- An alert must have a status: `Pending`, `In Progress`, `Resolved`.
- Once an alert is `Resolved`, it cannot be changed back or modified further (audit trail integrity).
- Only authenticated staff can read or update alerts.
- Every alert must be associated with an `organizationId`.

## 2. The Dirty Dozen Payloads (Target: /alerts/{alertId})

1. **Identity Spoofing**: `alertId` in body differs from path ID.
2. **Schema Poisoning**: Adding `priority: "super-high"` (shadow field).
3. **Invalid Type**: `type: "Nuke"` (not in enum).
4. **Invalid Status**: `status: "Deleted"`.
5. **Update resolved alert**: Changing status of a "Resolved" alert.
6. **State Skip**: Changing `organizationId` during update.
7. **Resource Exhaustion**: `name` = 1MB string.
8. **Malicious ID**: `alertId` = `../../system/root`.
9. **Unauthenticated Read**: Attempting to list alerts without a token.
10. **Full Update**: Attempting to change `roomNumber` after creation.
11. **Negative Size**: `name.size() < 0` (though technically covered, good to test).
12. **Orphaned Write**: Creating alert with no name.

## 3. Test Runner (Mock Logic)
The `firestore.rules` are designed to block these payloads.
- `isValidAlert` ensures keys match and types are correct.
- `affectedKeys().hasOnly(['status'])` prevents modifying fields other than status.
- `existing().status != 'Resolved'` prevents post-resolution edits.
