<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Analytics Tracking — Mixpanel

This project uses **Mixpanel** for all product analytics. Mixpanel is the single source of truth for event tracking, user identification, and behavioral data. Do not introduce any other analytics tools, SDKs, or tracking libraries without explicit instruction from a user.

---

## Before You Add or Modify Any Tracking

⛔ **Do not write Mixpanel tracking code without reading this file first.**

Wrong assumptions about platform, identity, or consent will produce broken Mixpanel data that requires manual cleanup or data deletion requests.

### Mandatory checklist before writing any Mixpanel code

- [x] Confirm you are using the correct Mixpanel SDK for this project's platform (see Tech Stack below)
- [x] Check if this project routes data through a CDP — if yes, send Mixpanel events through the CDP, not the Mixpanel SDK directly (No CDP is in use)
- [x] Check if consent gating is required — if this project serves EU or California users, no Mixpanel events may fire before user consent (No EU/CA users)
- [x] Review the existing Mixpanel tracking plan below before adding new events

---

## Tech Stack

| Detail | Value |
|---|---|
| **Platform** | Next.js App Router (React, TypeScript, Tailwind) |
| **Mixpanel SDK** | mixpanel-browser |
| **SDK version** | ^2.55.0 |
| **Tracking method** | client-side |
| **CDP (if any)** | none |
| **Consent required** | no |
| **Mixpanel project token location** | Hardcoded client-side initialization token |

---

## Mixpanel Initialization

Mixpanel is initialized in:

**File:** [src/app/page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx)

```typescript
import mixpanel from 'mixpanel-browser';

if (typeof window !== 'undefined') {
  mixpanel.init('fe5f9d1185db08298ab1178b0a7dd4b3', {
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: true,
    persistence: 'localStorage'
  });
}
```

---

## Mixpanel Identity

Mixpanel identity is managed through:

| Action | When to call | Code location |
|---|---|---|
| `mixpanel.identify(distinct_id)` | On successful lead form submit | [src/app/page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx) |
| `mixpanel.people.set(...)` | Directly after `identify` to create profile attributes | [src/app/page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx) |

**Rules:**
- Call `mixpanel.identify()` with a stable, normalized phone number (e.g. `+919876543210`) as the distinct ID.
- Call `mixpanel.people.set()` to populate user profile properties.
- Track `sign_up_completed` **after** calling `.identify()`.

---

## Mixpanel Tracking Plan

These are the Mixpanel events currently tracked in this project.

### Naming conventions

- Mixpanel event names: `snake_case`, past tense verb + noun (e.g., `reveal_clicked`, `sign_up_completed`)
- Mixpanel property names: `snake_case` (e.g., `sign_up_method`, `stream`)

### Current Mixpanel events

| Mixpanel Event | Trigger | Key Properties | File |
|---|---|---|---|
| `reveal_clicked` | User clicks the "Reveal the Truth" button on intro screen | none | [page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx) |
| `video_started` | Vertical video playback begins successfully | `muted` (optional boolean) | [page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx) |
| `video_ended` | Vertical video playback finishes and transitions to form | none | [page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx) |
| `sign_up_completed` | User successfully submits the lead capture form | `sign_up_method`, `platform`, `stream`, `persona`, `location`, `city` | [page.tsx](file:///C:/Users/jaysa/Downloads/le-cheated-campaign/src/app/page.tsx) |

---

## How to Add a New Mixpanel Event

1. **Check the tracking plan above** — if the Mixpanel event already exists, use it. Do not create duplicate Mixpanel events.
2. **Name the Mixpanel event** using the conventions above: `snake_case`, past tense, descriptive.
3. **Define Mixpanel properties** — only include properties available at the moment the event fires.
4. **Place the Mixpanel tracking call** at the right moment.
5. **Update this file** — add the new Mixpanel event to the tracking plan table above.
