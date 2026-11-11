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

The Idea reader membership summary includes Public Collections and Collections
where the viewer is an explicit Owner, Editor, or Viewer. An Unlisted Collection
is included only for participants or when its ID is supplied as link context.
The context must be an actual membership and never grants Private access.
Summary counts cover these returned memberships, not every container globally.

Each membership includes its icon and `capabilities.manageIdeas`, computed in
SQL from Collection ownership or an Editor role. Idea ownership does not grant
permission to remove a Collection membership. The removal endpoint rechecks the
role even when the reader has cached an earlier capability.
