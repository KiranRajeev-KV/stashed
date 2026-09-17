# Collections authorization

Collection access and Idea access are separate. A Collection role can edit the
container and its membership, but never the underlying Idea.

- Public Collections are discoverable; Unlisted and Private Collections are not.
- Private Collections require an explicit Owner, Editor, or Viewer role.
- Public Ideas may be shown in any accessible Collection.
- Unlisted Ideas may be shown through an Unlisted/Private Collection URL. In a
  Public Collection they are shown only to explicit participants or the Idea owner.
- Private Ideas are always shown only to their owner.

Every nested list, search, count, and pagination query applies these predicates
in SQL. Never fetch a page and filter hidden Ideas in application code.
