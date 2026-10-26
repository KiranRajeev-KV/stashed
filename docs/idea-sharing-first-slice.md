# First slice: choose and understand an idea's sharing settings

Prepared 2026-10-05. Implemented locally; ready for manual review,
based on the current working tree, [IDEA.md](../IDEA.md), and
[PLAN.md](../PLAN.md).

## Implementation handoff

Open [the local app](http://127.0.0.1:5173), sign in with GitHub, and create an
idea or edit one of your existing ideas. The development server is running;
to start it again, use `pnpm db:local` followed by `pnpm dev`.

The editor, detail/card summaries, collection eligibility explanation, cache
refreshes, and legacy query-scope fix are implemented. Collection visibility
retains its existing controls. Quick idea visibility mutations now lead to
the editor to preserve the new settings.

Validation completed:

- Production build and Worker type-checking pass. The build reports the
  existing large editor chunk warning.
- Lint, formatting, Knip (comprehensive and production), and diff whitespace
  checks pass. Lint retains the existing Fast Refresh warning in
  `src/routes/ideas.tsx`.
- SQLite migration verification and the full local D1/API harness pass,
  including added legacy Private/Unlisted list/search scope coverage,
  explicit scope precedence, and authentication requirements.
- Local Chromium checks with synthetic API responses cover create/edit
  payloads, preference preservation through private/public changes and
  reloads, keyboard selection, save failure/retry, cancel, Link only reader
  eligibility, and desktop/mobile light/dark layouts. The 390px editor has
  no horizontal overflow. Synthetic browser requests never write local data;
  they do not establish real GitHub authentication or D1 persistence.
- The real local health and idea endpoints respond successfully, and the
  GitHub login endpoint redirects to GitHub with the configured
  `http://127.0.0.1:5173/api/auth/github/callback` callback. Completing GitHub
  sign-in remains part of your manual review.

Existing local records were preserved. No production deployment was made.
Use the manual checklist below, especially the signed-out direct-link and
collection membership restoration checks. My ideas remains a subsequent
slice, so retain the direct URLs for your hidden public test ideas.

## Outcome

An author can create or edit an idea using separate audience and appearance
choices, save it, and see an accurate summary on its detail page. Making an
idea private and public again preserves the appearance choice. Existing
collection memberships survive changes and follow the backend policy.

This slice gives us one complete path to verify before expanding personal
management, archive filters, and collection management interfaces.

## Research and design decisions

I reviewed official product documentation, the published Notion and Figma
sharing screenshots, accessibility guidance, and the repository's existing
light/dark idea-detail screenshots. These references inform the proposal;
they do not establish that the design is already validated with Stashed users.

| Reference                                                                                         | Observed pattern                                                                                                                       | Application to Stashed                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Notion sharing and permissions](https://www.notion.com/help/sharing-and-permissions)             | General access is distinct from publishing; workspace access can also be hidden from search.                                           | Ask who can read first, then where the idea can appear. Keep both decisions together in the editor so the relationship is visible.                                                       |
| [Figma sharing](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes) | The illustrated sharing panel separates audience, individual roles, link copying, and Community publication.                           | Keep audience and discovery distinct. Retain the existing Copy link action and place an accurate audience summary nearby in Details.                                                     |
| [YouTube privacy settings](https://support.google.com/youtube/answer/157177?hl=en)                | Unlisted content can be read and reshared by anyone with its link. Public playlists can expose unlisted videos.                        | Use plain language about link access. Stashed's Link only rule is stricter: it excludes collections entirely. Collections only must never imply access restricted to collection members. |
| [NN/g: dropdown lists](https://www.nngroup.com/articles/dropdown-list/)                           | Radio choices expose a small option set for immediate comparison; compact dropdowns still suit secondary controls in dense interfaces. | Use visible radio rows for the two and three editor choices, with descriptions beneath their labels. Reconsider compact controls later for filters and inline editing.                   |
| [NN/g: progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)          | Show the important choices first and defer options when they cease to be relevant.                                                     | When Only me is selected, replace public appearance controls with a readable summary of the retained preference.                                                                         |
| [GOV.UK radios](https://design-system.service.gov.uk/components/radios/)                          | Exclusive choices can carry individual hints, with related questions revealed conditionally.                                           | Give each appearance option a short explanation that can be read before selection. Keep public link-access information visible while those choices are available.                        |
| [W3C grouped form controls](https://www.w3.org/WAI/tutorials/forms/grouping/)                     | Related radio inputs need programmatic grouping and an understandable group label.                                                     | Use native radios, fieldsets, legends, associated descriptions, keyboard navigation, and visible focus.                                                                                  |

The visual direction is Stashed's existing restrained archive: current fonts,
semantic colors, subtle borders, and content-first hierarchy. Selection uses
a radio dot and quiet row highlight; no new page theme or animation system is
needed. Icons supplement readable labels.

## Proposed editor

Add a Sharing section in the existing editor settings area, with full-width
groups even when the surrounding settings use a two-column layout. Preserve
the desktop sidebar and stacked mobile layout.

**Who can view this idea?**

- **Anyone** — Anyone can open this idea with its link.
- **Only me** — Only you can open this idea.

When Anyone is selected, show **Where should it appear?**

- **Everywhere** — Eligible to appear in Ideas, search, tags, and collections.
- **Collections only** — Can appear in collections. Hidden from Ideas, global
  search, and tag discovery.
- **Link only** — Opened through its direct link. Hidden from Ideas, search,
  tags, and collections.

Keep a shared note beside these options: “Anyone with the link can view this
idea and share its link.” This also applies to Collections only, including
when its collection is private. Choosing Collections only does not add the
idea to a collection, and zero memberships remain valid.

When Only me is selected, replace the appearance choices with:
“If you choose Anyone again, this idea will use: Collections only.”
Substitute the actual retained choice. Never reset or
drop distribution when hiding its controls. It remains part of the saved
form value, including across reloads.

For Link only in edit mode, include:
“Any existing collection placements will be hidden, not removed. They can
reappear if you choose Everywhere or Collections only.” This is general
explanatory text, not an assertion that memberships exist. The current detail
response does not provide a complete membership count, so this slice adds no
count endpoint and does not infer counts from the target picker.

Keep the existing explicit Create idea / Save changes flow. Selecting a radio
changes the draft; it does not immediately change server access. Cancel
discards the draft. Pending saves disable submission, and failed saves retain
all input and show the existing local error feedback.

New ideas default to Anyone + Everywhere, matching the current product
brief and backend defaults. Existing ideas initialize from the returned
access/distribution fields.

## Implementation scope and order

1. **Restore a working baseline and protect existing navigation.** Fix the
   omitted-scope parsing problem in `worker/ideas/schemas.ts`: preserve an
   absent scope so the service's legacy Private/Unlisted-to-MINE mapping can
   run; keep explicit or malformed scopes governed by the existing safe
   behavior. Verify normal public discovery remains the default and MINE
   still requires authentication. This allows the existing private/link-only
   archive filters to work during the incremental frontend migration.
2. **Add idea-specific presentation primitives.** Derive access/distribution
   types from the API and centralize the labels, help text, radio group, and
   summary. Keep collection visibility controls independent; collections
   retain their existing Public/Unlisted/Private model.
3. **Migrate create/edit together.** Update `idea-form.tsx` and
   `idea-form-pages.tsx` to validate, initialize, retain, and send access and
   distribution. Define the form submission type from the exact new fields
   rather than `Required<CreateIdeaInput>`, which wrongly requires legacy
   visibility too. Send no legacy visibility field. Title/content/status/tag
   edits must preserve the two settings.
4. **Make the reader and cards consistent.** Replace the detail Visibility
   row with Audience and Appears in. Public ideas show both active settings;
   private ideas show Only me and explain their retained public preference to
   the author. Replace the old mutating inline idea visibility control on
   detail/cards with an accurate summary and an author-only link to the
   existing editor. That old control writes legacy visibility and can erase
   Collections only. Quick inline editing can return in a later slice. Use
   `access` for the reader's private-state indication as well.
5. **Respect collection eligibility in the reader.** For public Link only,
   show explanatory text instead of opening the Add to collection picker.
   Authors can edit the appearance setting to enable it. Public Everywhere
   and Collections only retain the existing picker; private ideas remain
   addable by their author to collections they can edit. The server continues
   to decide membership and collection permissions.
6. **Refresh dependent surfaces on save.** Update the detail cache from the
   mutation response and invalidate ideas, search, tags, collection lists,
   collection detail/member queries, candidates, and target pickers. The
   existing query-key prefixes are `ideas`, `search`, `tags`, `collections`,
   and `collection`. Navigating back must not display old eligibility/counts.

Expected touchpoints are the idea form/pages, detail/cards, the retiring
`idea-visibility-editor.tsx`, an idea-specific sharing component/model, a
small cache invalidation helper, and the query-schema compatibility fix.

## Verification before handoff

Run build, lint, formatting, Knip, Worker type-checking, the existing SQLite
migration verifier, and the D1/API verification harness for the compatibility
change. Follow `src/AGENTS.md`: do not introduce frontend test scripts for
this slice. Inspect the new controls in a browser at desktop/mobile sizes in
both themes, including keyboard-only use.

Use local D1 migrations and the existing local authentication setup. Confirm
sign-in works before promising an authenticated manual-review URL. Avoid
adding an authentication bypass. Any local setup or verification limitation
must be explicit in the handoff.

## Your manual review

Use one author session and a signed-out window. Give a test idea a unique
title and tag. Save its direct URL before hiding it; the full My ideas view
is a later slice. Use a public collection you can edit for membership checks.

| Check                                                                                        | Expected result                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create Anyone + Everywhere, then reload and edit                                             | Both values persist; the idea is eligible for Ideas, global search, public tags, and collections.                                                      |
| Switch to Collections only before adding any membership                                      | Save succeeds. Signed-out direct link works; Ideas/global search/tag discovery omit the idea.                                                          |
| Add it to the public collection                                                              | It appears in that collection and collection-local search, including signed out.                                                                       |
| Switch the member idea to Link only                                                          | Direct link still works. The collection and its search/count omit it, including for its author. The reader explains why adding is unavailable.         |
| Switch back to Collections only                                                              | The original membership reappears without adding it again.                                                                                             |
| For each appearance choice, switch to Only me, save, reload, then choose Anyone              | Signed-out detail is unavailable while private. The stored appearance choice returns unchanged. Authors can still find private ideas in global search. |
| Keep a private idea in a collection                                                          | Its author can see it there if they can access the collection; signed-out visitors cannot. Collection counts reflect each viewer's visible ideas.      |
| Edit only the title, notes, tags, or status of a Collections only idea                       | Access/distribution remain unchanged; the detail and collection summary stay accurate.                                                                 |
| Change settings, then cancel; separately fail a save and retry                               | Cancel leaves server values unchanged. Failure retains the draft and announces the error; retry succeeds.                                              |
| Navigate between previously visited archive, search, tags, and collection pages after saving | Eligibility and counts refresh without a hard reload.                                                                                                  |
| Use keyboard navigation and 390px/desktop layouts in both themes                             | Groups and descriptions are readable, focus is visible, choices work by keyboard, and controls do not overflow.                                        |

A zero-count tag may disappear entirely from discovery; review the tagged
idea's contribution rather than assuming its tag will always have a row.

During this slice the old archive filters remain a compatibility aid. They
cannot retrieve the author's public Collections only ideas. Use saved direct
URLs for those; a complete personal library is the next increment.

## Stop point and subsequent work

Hand off the working local slice with its URL, setup steps, checks completed,
and this manual checklist. Pause feature expansion for your feedback on the
labels, interaction, and actual behavior.

Subsequent slices cover My ideas, separate archive/filter URL semantics,
global versus personal search, fuller collection picker explanations, and
the staged production release/documentation. This first slice is for local
review; production cutover and rollback preparation remain separate work.
