# Discover UI Contract

This is the interface contract consumed by the ClubHub UI. It documents required behavior; it does
not assert that every field exists in the current backend response.

## Directory source

**Current source**: authenticated active-club directory request already exposed through the UI API
client.

**Required normalized response**:

```text
ClubDirectoryEntry[]
  id: string
  name: string
  code?: string
  category?: string
  description?: string
  logoUrl?: string
  scheduleLabel?: string
  isRecruiting: boolean
```

The source MUST return only active, publicly displayable clubs for the current viewer. It MUST NOT
require the UI to derive recruitment state from activity status or roster data. Directory responses
should not expose member rosters or manager identity merely to render Discover cards; return
display-safe summary data instead.

## Public detail source

The V2 detail route requires an authenticated, least-privilege public-detail response for a single
club. It includes public identity/description plus optional schedule, location, cover, recruitment
state, member count, public leaders, contact, and the viewer's permitted relationship/status. It
MUST return 404 for unavailable clubs, 403 for denied valid sessions, and MUST NOT return raw
membership rosters solely to render a public detail page.

## Outcome mapping

| Source outcome | UI outcome |
| --- | --- |
| Auth/session no longer valid | Existing sign-in handling |
| Valid response with zero entries | Empty |
| Access denied for valid session | Forbidden |
| Network/service failure | Error with retry |
| Valid response | Populated or filtered Empty |

## Recommendation evolution

Before RE-39, the UI derives a `sourceLabel: Curated` subset from the directory response and labels
it non-personalized. RE-39 may introduce an authenticated recommendation source returning only
publicly displayable entries plus optional reason/rank metadata. That source must never cause the
All Clubs directory to fail or be replaced by fixture data.

## Existing destination

Each card targets `/v2/clubs/:clubId`. The V2 detail route is read-only in this feature; joining,
club workspace, and demo mutations remain outside scope. The source remains responsible for
authorization checks.
