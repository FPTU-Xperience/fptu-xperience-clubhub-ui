# Data Model: Production Discover Experience

## ClubDirectoryEntry

The normalized, public card model. It is produced only by the Discover adapter.

| Field           | Required    | Rules                                                                            |
| --------------- | ----------- | -------------------------------------------------------------------------------- |
| `id`            | Yes         | Stable club identifier; used for keys and the `/v2/clubs/:clubId` destination.   |
| `name`          | Yes         | Human-readable club name.                                                        |
| `code`          | No          | Short searchable identifier.                                                     |
| `category`      | No          | Used by the category filter; unclassified entries remain visible under All.      |
| `description`   | No          | Searchable descriptive text; missing value gets an accessible unavailable label. |
| `logoUrl`       | No          | Optional visual identity; absence uses a non-fixture fallback treatment.         |
| `scheduleLabel` | No          | Public schedule text; absent means unavailable, never an invented schedule.      |
| `isRecruiting`  | Conditional | Boolean from the extended directory contract; filtering requires this field.     |
| `destination`   | Yes         | Production V2 detail destination for this club.                                  |

## DirectoryCriteria

| Field            | Default    | Validation                                                                              |
| ---------------- | ---------- | --------------------------------------------------------------------------------------- |
| `query`          | Empty text | Normalized case-insensitively; matches available name, code, category, and description. |
| `category`       | All        | Must be All or a category present in the permitted directory.                           |
| `recruitingOnly` | False      | May be enabled only when recruitment state is available.                                |
| `page`           | 1          | Clamped to the available page range: six per Discover page or twelve per Clubs page.    |

Criteria are combined using AND semantics. An empty result is a valid state and preserves controls.

## DiscoverPageState

| State     | Meaning                                  | Allowed transition                  |
| --------- | ---------------------------------------- | ----------------------------------- |
| Loading   | A current request is in flight.          | Populated, Empty, Forbidden, Error  |
| Populated | Current permitted entries are present.   | Loading after retry/context change  |
| Empty     | Current request/filter has no entries.   | Loading after retry/criteria change |
| Forbidden | Session is valid but access was denied.  | Loading after context refresh       |
| Error     | A retriable non-access failure occurred. | Loading on retry                    |

An expired or unauthenticated session uses the existing application sign-in flow instead of the
Forbidden state. No terminal state may transition to demo data.

## CuratedRecommendationSet

Contains a deterministic subset of `ClubDirectoryEntry` plus `sourceLabel: Curated`. It is not
stored independently and never includes a personalized reason, score, or rank. When RE-39 is
available, the same card region can receive `RecommendationEntry` records with optional permitted
explanation metadata.

## ClubPublicDetail

The display-safe detail model for `/v2/clubs/:clubId`. Required: stable identifier, name, category,
description, activity state, and destination context. Optional: logo, cover, schedule, location,
recruitment status, member count, public leaders, contact information, and viewer relationship.
Missing optional fields render as unavailable. Membership rosters, private member identifiers, and
manager-only fields are never part of this model.

## Relationships and Isolation

`DirectoryCriteria` filters one current `ClubDirectoryEntry` collection. A
`CuratedRecommendationSet` derives from that same collection. The adapter’s request identity binds
the collection/detail to the current user session, active V2 route, club identifier when present,
and criteria; obsolete identities cannot update visible state.
