# Adaptive content on Fumadocs: what this prototype proves

Built and verified on Fumadocs 16.14.5 / Next.js 16.3.1 / React 19. Everything below
was observed from a real production build and a running server, not reasoned about.

## What was built

The three GitBook visitor claims are reproduced as client-side variant dimensions:

| GitBook claim | Here | Values |
| --- | --- | --- |
| `region` | `region` | in, sea, mena, br, pe, eu |
| `platform` | `platform` | web, android, ios |
| `integrationPath` | `integrationPath` | hypercheckout, ec-sdk, ec-api |

Two mechanisms sit on top:

**Page-level.** Frontmatter declares applicability. An omitted key means the page is
CORE and applies to everyone, so no existing page needs migrating.

```yaml
---
title: UPI Intent
regions: ["in"]
---
```

**Block-level.** A `<Variant>` component, available in every MDX file with no
import:

```mdx
<Variant region="in">Google Pay runs over UPI here.</Variant>
<Variant region={["sea", "mena"]} platform="android">…</Variant>
```

The sidebar filters against the page-level index; `<Variant>` blocks respond to the
same state. Changing a selector re-filters both with no navigation.

## Verified results

**Nav filtering works.** Matching logic tested across region combinations:

```
IN  / web     / hypercheckout -> index, google-pay, upi-intent, session-api
SEA / ios     / ec-api        -> index, google-pay
BR  / android / ec-sdk        -> index, pix, session-api
EU  / web     / ec-api        -> index
```

That last row is itself a finding. Selecting Europe collapses the nav to a single
page, because nothing in this slice is scoped to EU. Under a consolidated model you
need a deliberate answer for regions with thin coverage — either CORE fallback
content or an explicit "not available in your region" state. GitBook has the same
problem; it is just less visible there.

**SSG is preserved.** All 21 routes prerender as static HTML. The variant index is
computed at build time and serialised into the RSC payload, so adaptive nav costs
nothing at request time. This was the main risk going in, and it did not
materialise.

**`llms.txt` ignores variants entirely.** It lists every page including
Brazil-only PIX and India-only UPI Intent. For your AI-agent-first integration
work this matters: an agent gets the union of all regions with no signal about
which apply.

**Search ignores variants too.** Querying `PIX` while notionally in India returns
the Brazil page. Fixing this means filtering the index client-side after query, or
maintaining per-region indexes.

## The finding that matters

**This hides content. It does not withhold it.**

Requesting the Google Pay page — the India URL, with no SEA selection anywhere —
and grepping the returned HTML:

```
runs over UPI                    PRESENT
card wallet                      PRESENT   <- SEA-only prose
Play Services                    PRESENT   <- Android-only
use Apple Pay instead            PRESENT   <- iOS-only
own the entire wallet handshake  PRESENT   <- EC API-only
```

Every variant ships in the HTML. And every REGION-ONLY page returns HTTP 200 on a
direct request regardless of selection — PIX, UPI Intent, and Session API all
resolved 200.

So the honest framing for a vendor comparison: this is presentation-layer
personalisation, equivalent to a tabbed interface with memory. It is genuinely good
for reader experience and it removes the five-space duplication problem. It is not
access control.

Whether that is acceptable depends on one question: **does any regional
documentation contain commercially sensitive material that must not be readable by
another region's merchants?** Pricing, acquirer names, unreleased methods,
bank-specific terms. If yes, you need route-level separation with a server-side
check, and you lose SSG on those routes. If no, this approach is sufficient and
arguably better than GitBook's, because the reader can switch variants in-page
instead of being pinned by a claim.

Worth confirming what GitBook actually enforces today before treating this as a
regression — visitor claims are signed, but whether unselected variants are
stripped from the response or merely hidden is worth verifying rather than
assuming.

## Cost

Roughly 400 lines across five files, plus a frontmatter convention. Not a research
project. But it is code you now own and maintain, versus a feature you configure.
That is the real trade, and it recurs for search, analytics, localisation, and
review workflow.

## Files

```
lib/variants.ts                          dimensions, matching logic
components/variants/context.tsx          state, URL + localStorage persistence
components/variants/variant.tsx          <Variant>, <VariantText>, <CurrentVariant>
components/variants/switcher.tsx         sidebar selectors
components/variants/adaptive-layout.tsx  page-tree filtering
lib/source.ts                            extended frontmatter schema + variant index
```

## Not yet tested

- `fumadocs-openapi` against a real Juspay spec (your `md-to-openapi` output)
- A non-technical contributor editing a page
- Build time at realistic page counts
- Whether search filtering is worth the complexity
