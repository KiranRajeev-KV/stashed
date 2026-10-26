"""Check the compatibility migration and database-owned public tag counts."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
conn = sqlite3.connect(":memory:")
conn.execute("PRAGMA foreign_keys = ON")


def apply(path):
    for statement in path.read_text().split("--> statement-breakpoint"):
        if statement.strip():
            conn.executescript(statement)


migrations = sorted((root / "drizzle/migrations").glob("*.sql"))
for migration in migrations[:7]:
    apply(migration)

conn.executemany("INSERT INTO users (id, display_name) VALUES (?, ?)", [("author", "Author"), ("other", "Other")])
conn.execute("INSERT INTO tags (id, name, name_key) VALUES ('tag', 'Tag', 'tag')")
for visibility in ("PUBLIC", "UNLISTED", "PRIVATE"):
    conn.execute("INSERT INTO ideas (id, title, content, content_plain, visibility, author_id) VALUES (?, ?, 'body', 'body', ?, 'author')", (visibility.lower(), visibility, visibility))
    conn.execute("INSERT INTO idea_tags (idea_id, tag_id) VALUES (?, 'tag')", (visibility.lower(),))
conn.execute("INSERT INTO collections (id, name, owner_id) VALUES ('collection', 'Collection', 'other')")
conn.execute("INSERT INTO collection_ideas (collection_id, idea_id, added_by_user_id) VALUES ('collection', 'unlisted', 'other')")
assert conn.execute("SELECT public_idea_count FROM tags WHERE id = 'tag'").fetchone()[0] == 1
apply(migrations[7])
for migration in migrations[8:]:
    apply(migration)
assert conn.execute("SELECT visibility, access, distribution FROM ideas ORDER BY id").fetchall() == [
    ("PRIVATE", "PRIVATE", "LISTED"), ("PUBLIC", "PUBLIC", "LISTED"), ("UNLISTED", "PUBLIC", "UNLISTED")
]
assert conn.execute("SELECT count(*) FROM collection_ideas").fetchone()[0] == 1
assert conn.execute("SELECT public_idea_count FROM tags WHERE id = 'tag'").fetchone()[0] == 1

# Legacy insert and update SQL remains valid between migration and deployment.
conn.execute("INSERT INTO ideas (id, title, content, content_plain, visibility, author_id) VALUES ('old', 'Old', 'body', 'body', 'PRIVATE', 'author')")
assert conn.execute("SELECT access FROM ideas WHERE id = 'old'").fetchone()[0] == "PRIVATE"
conn.execute("INSERT INTO idea_tags (idea_id, tag_id) VALUES ('old', 'tag')")
conn.execute("UPDATE ideas SET visibility = 'PUBLIC' WHERE id = 'old'")
assert conn.execute("SELECT access, distribution FROM ideas WHERE id = 'old'").fetchone() == ("PUBLIC", "LISTED")
assert conn.execute("SELECT public_idea_count FROM tags WHERE id = 'tag'").fetchone()[0] == 2

# New writes carry a conservative projection for any legacy reader.
conn.execute("UPDATE ideas SET access = 'PUBLIC', distribution = 'COLLECTIONS_ONLY', visibility = 'UNLISTED' WHERE id = 'old'")
assert conn.execute("SELECT access, distribution FROM ideas WHERE id = 'old'").fetchone() == ("PUBLIC", "COLLECTIONS_ONLY")
assert conn.execute("SELECT public_idea_count FROM tags WHERE id = 'tag'").fetchone()[0] == 1
conn.execute("UPDATE ideas SET access = 'PRIVATE', distribution = 'COLLECTIONS_ONLY', visibility = 'PRIVATE' WHERE id = 'old'")
conn.execute("UPDATE ideas SET access = 'PUBLIC', distribution = 'LISTED', visibility = 'PUBLIC' WHERE id = 'old'")
assert conn.execute("SELECT public_idea_count FROM tags WHERE id = 'tag'").fetchone()[0] == 2
conn.execute("DELETE FROM ideas WHERE id = 'old'")
assert conn.execute("SELECT public_idea_count FROM tags WHERE id = 'tag'").fetchone()[0] == 1
assert conn.execute("PRAGMA foreign_key_check").fetchall() == []
assert conn.execute("INSERT INTO ideas_fts(ideas_fts) VALUES ('integrity-check')").fetchall() == []
print("migration bridge, membership preservation, FTS, foreign keys, and tag counts: OK")
