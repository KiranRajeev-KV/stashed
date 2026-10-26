# Collections authorization

Collection access and idea access are independent. Public and unlisted
collections can be opened by anyone with the URL; private collections require
an owner, editor, or viewer role. Only owners and editors may change membership.

Within an accessible collection, the SQL policy includes public listed and
public collections-only ideas. A private idea appears only to its author, even
if another member owns the collection. Public unlisted ideas never appear.
The same predicate controls nested lists, local search, counts, candidates,
add targets, and membership mutations. Authorization runs before pagination.

A hidden membership remains stored when an idea changes access or distribution.
Batch responses and membership flags disclose only IDs visible to the acting
user. Changing the idea back to an eligible state reveals the preserved
membership automatically.
