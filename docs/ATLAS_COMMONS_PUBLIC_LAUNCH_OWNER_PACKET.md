# Atlas Commons public-launch owner packet

Status: decision-ready; production remains disabled.

This packet turns the remaining Commons launch gates into explicit owner decisions. It does not authorize production enablement, change moderation access, or alter retention.

## Current technical baseline

- Staging Commons is enabled, OAuth-connected, moderated, and rollback-proven.
- Production remains on the seven-tool, Commons-disabled surface.
- The public-notes release runbook and technical test report record the staging evidence.

## Required owner decisions

All five items must be marked approved by a named owner before a production window can be scheduled.

| Gate | Decision required | Approval record |
| --- | --- | --- |
| Moderation ownership | Name a primary moderator, backup moderator, and response-hours coverage. | Owner, names/roles, effective date |
| Retention and deletion | Set the public-note/moderation-evidence retention period, deletion method, backup handling, and legal-hold exception. | Owner, duration, deletion cadence |
| Abuse response | Approve report triage targets, auto-hide policy, escalation path, and incident contact. | Owner, severity targets, contact path |
| Public copy | Approve the privacy-policy changes, public-note visibility language, report/removal language, and community standard. | Owner, approved copy revision |
| Production window | Choose the launch date/time, named operator, monitoring owner, rollback authority, and post-launch review time. | Owner, window, operator, rollback authority |

## Proposed operating defaults for approval

These are proposals, not effective policy until the owner records approval.

- Public notes are visible only after moderation approval; pending and removed notes are never anonymously readable.
- Reports auto-hide only at the threshold established by the moderation policy; moderators can remove or restore content with an auditable reason.
- A report receives initial triage during the stated coverage hours. Urgent legal or safety escalations use the named incident contact.
- Private notes remain in the ChatGPT conversation and are not copied into Atlas storage.
- Public-note records are retained only for the approved period, then deleted by the approved process unless a documented legal hold applies.
- Users see plain language: public notes are visible after moderation; private notes stay in the current chat; reporting is not an emergency service.

## Production launch checklist

1. Confirm all five owner decisions above in a dated release record.
2. Re-read the live privacy and community copy from the production candidate.
3. Capture the pre-window production deployment id, image digest, `/ready`, tool count, and widget version.
4. Run the approved production migration while Commons remains disabled.
5. Verify the disabled seven-tool baseline, exact OAuth scopes, connector refresh, moderation lifecycle, and rollback route.
6. Enable Commons only for the named window; verify the nine-tool surface and anonymous public-read boundary.
7. Monitor readiness, database health, OAuth failures without token logging, queue age, auto-hides, list latency, MCP errors, connection saturation, and widget console errors.
8. Disable and roll back immediately if any runbook stop condition is met; preserve moderation evidence and do not drop tables during rollback.
9. Record the final deployment/digest, enablement decision, incidents, rollback status, and post-launch owner sign-off.

## Copy awaiting approval

### Public-note disclosure

Public notes are visible to everyone after moderation. Private notes stay in this chat.

### Composer disclosure

Post only information you are comfortable making public. Your note may be reviewed, removed, or reported. Do not use this feature for emergencies.

### Report confirmation

Thanks — this report is queued for review. We may hide or remove content that breaks the community standard.

### Removal-request route

For a removal request or privacy question, contact mzwin3545@gmail.com with the public note link or place and approximate posting time. Do not include passwords, payment details, or other sensitive information.

## Approval record

| Date | Owner | Gate | Decision | Evidence link |
| --- | --- | --- | --- | --- |
| pending | pending | moderation ownership | pending | pending |
| pending | pending | retention and deletion | pending | pending |
| pending | pending | abuse response | pending | pending |
| pending | pending | public copy | pending | pending |
| pending | pending | production window | pending | pending |

Production enablement is prohibited until every row above is replaced with a named, dated approval.
