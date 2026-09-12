import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  FileText,
  Globe2,
  Hash,
  Layers3,
  Link2,
  LockKeyhole,
  Search,
} from "lucide-react";
import { currentUserQueryOptions, githubLoginPath } from "../../api/auth.js";
import { Navbar } from "../../components/layout/navbar.js";
import { Button } from "../../components/ui/button.js";
import { buttonStyles } from "../../components/ui/button-variants.js";
import { FaGithub } from "react-icons/fa";
import {
  landingCopy,
  landingEnter,
  landingEyebrow,
  landingHeading,
  landingPage,
  landingSection,
  landingWrap,
  previewFilter,
  previewFrame,
  previewIdea,
  previewTag,
  visibilityChoice,
} from "../../styles/landing-styles.js";

const exampleIdeas = [
  {
    id: "001",
    title: "A slower corner of the internet",
    tag: "design",
    status: "Draft",
    statusClass: "text-muted-foreground",
    description:
      "A personal website that feels more like a place to spend time.",
    text: "What if a personal website felt like visiting someone’s studio? A few things they’ve made. Books with notes in the margins. Work that isn’t quite finished.",
    thought: "Build a place to return to, even when there’s nothing new.",
    next: "Start with a single room. One page, a reading list, and a small collection of things in progress.",
  },
  {
    id: "002",
    title: "The one-weekend tool",
    tag: "building",
    status: "Active",
    statusClass: "text-status-active",
    description: "A tiny recipe finder for what’s already in the fridge.",
    text: "Most recipe apps start with what you want to eat. This one starts with what you already have. Pick a few ingredients and find one good thing to make.",
    thought: "A useful little tool can stay a useful little tool.",
    next: "Try five ingredients and ten recipes. Make the smallest version that helps with tonight’s dinner.",
  },
  {
    id: "003",
    title: "Notes from the long way home",
    tag: "everyday",
    status: "Draft",
    statusClass: "text-muted-foreground",
    description: "A collection of things I only notice when I walk.",
    text: "The hand-painted sign. The same window full of plants. A conversation overheard at the crossing. Walking leaves room for details that a faster journey skips.",
    thought: "Paying attention is a kind of collecting.",
    next: "Take a different route this week. Write down one thing worth remembering after each walk.",
  },
];

const visibilityOptions = [
  {
    name: "Private",
    icon: LockKeyhole,
    hint: "Only you",
    title: "Room to think for yourself.",
    description:
      "Keep a rough thought, a personal note, or a plan you’re not ready to share. Only you can read it.",
    audience: "Only visible to you",
  },
  {
    name: "Unlisted",
    icon: Link2,
    hint: "Anyone with the link",
    title: "A thought to pass along.",
    description:
      "Share an idea by sending its link. It stays out of the public archive, but anyone with the link can read it.",
    audience: "Readable by anyone with the link",
  },
  {
    name: "Public",
    icon: Globe2,
    hint: "Everyone",
    title: "A starting point for someone else.",
    description:
      "Add your idea to the shared archive, where anyone can discover and read it. Your perspective might open up a new one.",
    audience: "Discoverable in the public archive",
  },
];

function StartButton() {
  const session = useQuery(currentUserQueryOptions());
  const classes = buttonStyles({ variant: "primary" });

  if (session.isPending) {
    return (
      <Button variant="primary" loading loadingLabel="Checking session…" />
    );
  }

  return session.data ? (
    <Link to="/ideas/new" className={classes}>
      Stash an idea <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  ) : (
    <a href={githubLoginPath} className={classes}>
      Start your stash <ArrowUpRight size={16} aria-hidden="true" />
    </a>
  );
}

function ArchivePreview() {
  const [filter, setFilter] = useState("All ideas");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("001");
  const visibleIdeas = exampleIdeas.filter((idea) => {
    const matchesTag = filter === "All ideas" || filter === idea.tag;
    const searchable = `${idea.title} ${idea.description} ${idea.text} ${idea.thought} ${idea.next} ${idea.tag}`;
    return (
      matchesTag &&
      searchable.toLowerCase().includes(query.trim().toLowerCase())
    );
  });
  const selected =
    visibleIdeas.find((idea) => idea.id === selectedId) ?? visibleIdeas[0];

  return (
    <div className={previewFrame}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-subtle px-4 py-3 md:px-6">
        <span className="flex items-center gap-2.5 text-ui font-medium">
          <Layers3 size={17} className="text-primary" aria-hidden="true" />
          The idea archive
        </span>
        <span className="flex items-center gap-2 font-mono text-caption text-muted-foreground">
          <span
            className="size-1.5 rounded-full bg-success"
            aria-hidden="true"
          />
          Interactive demo
        </span>
      </div>
      <div className="grid min-w-0 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <aside
          className="flex min-w-0 flex-wrap gap-1 border-b border-border-subtle bg-background/50 p-3 lg:flex-col lg:border-0 lg:p-4"
          aria-label="Filter example ideas"
        >
          <p className="mb-2 hidden px-3 pt-2 font-mono text-caption text-muted-foreground lg:block">
            COLLECTION
          </p>
          <Button
            variant="ghost"
            className={previewFilter}
            aria-pressed={filter === "All ideas"}
            onClick={() => setFilter("All ideas")}
          >
            <Layers3 size={14} aria-hidden="true" /> All ideas
            <span className="ml-auto pl-3 text-caption text-muted-foreground">
              03
            </span>
          </Button>
          <p className="mb-1 mt-7 hidden px-3 font-mono text-caption text-muted-foreground lg:block">
            TAGS
          </p>
          {["design", "building", "everyday"].map((tag) => (
            <Button
              key={tag}
              variant="ghost"
              className={previewFilter}
              aria-pressed={filter === tag}
              onClick={() => setFilter(tag)}
            >
              <Hash size={14} aria-hidden="true" /> {tag}
            </Button>
          ))}
          <div className="mt-auto hidden px-3 pt-16 text-caption text-muted-foreground lg:block">
            A few ideas to explore.
            <br />
            Your collection comes next.
          </div>
        </aside>
        <div className="min-w-0 lg:border-l lg:border-border-subtle">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 md:px-5">
            <span className="text-ui font-medium">
              {filter === "All ideas" ? "All ideas" : `# ${filter}`}
            </span>
            <label className="flex min-h-control min-w-0 flex-1 items-center gap-2 rounded-control border border-border-subtle bg-background/50 px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring sm:max-w-56">
              <Search
                size={14}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                className="min-w-0 w-full bg-transparent py-2 text-ui placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search example ideas"
                placeholder="Find a thought…"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <div className="grid min-w-0 md:min-h-104 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
            <div
              className="min-w-0 border-b border-border-subtle p-2 md:border-r md:border-b-0"
              aria-label="Example ideas"
            >
              {visibleIdeas.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  className={previewIdea}
                  aria-pressed={selected?.id === idea.id}
                  aria-controls="example-idea-detail"
                  onClick={() => setSelectedId(idea.id)}
                >
                  <span className="flex w-full items-center justify-between gap-2 font-mono text-caption text-muted-foreground">
                    <span>IDEA {idea.id}</span>
                    <ArrowUpRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 group-aria-pressed:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-body font-medium">{idea.title}</span>
                  <span className="flex flex-wrap items-center gap-3">
                    <span className={previewTag}># {idea.tag}</span>
                    <span
                      className={`flex items-center gap-1.5 text-caption ${idea.statusClass}`}
                    >
                      <Circle size={9} aria-hidden="true" />
                      {idea.status}
                    </span>
                  </span>
                </button>
              ))}
              {visibleIdeas.length === 0 && (
                <div className="p-4">
                  <p className="text-body font-medium">No matching thoughts.</p>
                  <p className="mt-2 text-ui text-muted-foreground">
                    Try another word or reset the filters.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => {
                      setQuery("");
                      setFilter("All ideas");
                    }}
                  >
                    Reset preview
                  </Button>
                </div>
              )}
            </div>
            <article
              id="example-idea-detail"
              className="min-w-0 bg-surface-elevated p-6 md:p-8"
              aria-live="polite"
              aria-atomic="true"
            >
              {selected ? (
                <div
                  key={selected.id}
                  className="flex h-full flex-col motion-safe:animate-[st-content-in_250ms_both]"
                >
                  <div className="mb-7 flex items-center justify-between gap-2 text-caption text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} aria-hidden="true" /> Example idea
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe2 size={13} aria-hidden="true" /> Public
                    </span>
                  </div>
                  <h3 className="font-display text-card-title">
                    {selected.title}
                  </h3>
                  <p className="mt-5 text-ui leading-reading text-muted-foreground">
                    {selected.text}
                  </p>
                  <blockquote className="my-6 border-l-2 border-primary/40 pl-4 text-body">
                    {selected.thought}
                  </blockquote>
                  <p className="text-ui font-medium">A place to start</p>
                  <p className="mt-2 text-ui leading-reading text-muted-foreground">
                    {selected.next}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-8 text-caption text-muted-foreground">
                    <Hash size={13} aria-hidden="true" />
                    {selected.tag}
                    <span className="ml-auto">Worth coming back to.</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Search size={22} strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-ui">
                    Your next thought might be a different search away.
                  </p>
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisibilityPreview() {
  const [selected, setSelected] = useState(0);
  const option = visibilityOptions[selected];
  const Icon = option.icon;

  return (
    <div className="overflow-hidden rounded-surface border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle px-6 py-5">
        <p className="flex items-center gap-2 text-ui font-medium">
          <FileText
            size={15}
            className="text-muted-foreground"
            aria-hidden="true"
          />{" "}
          An idea in the making
        </p>
        <p className="mt-1 text-caption text-muted-foreground">
          Choose who can read it
        </p>
      </div>
      <div className="p-3" role="group" aria-label="Explore idea visibility">
        {visibilityOptions.map(({ name, icon: OptionIcon, hint }, index) => (
          <button
            key={name}
            type="button"
            className={visibilityChoice}
            aria-pressed={selected === index}
            aria-controls="visibility-explanation"
            onClick={() => setSelected(index)}
          >
            <OptionIcon size={16} className="shrink-0" aria-hidden="true" />
            <span>{name}</span>
            <span className="ml-auto text-right text-caption text-muted-foreground">
              {hint}
            </span>
          </button>
        ))}
      </div>
      <div
        id="visibility-explanation"
        className="min-h-52 border-t border-border-subtle bg-background/40 p-6"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-body font-medium">{option.title}</p>
        <p className="mt-2 text-ui leading-reading text-muted-foreground">
          {option.description}
        </p>
        <p className="mt-5 flex items-center gap-2 text-caption text-primary">
          <Icon size={13} className="shrink-0" aria-hidden="true" />
          {option.audience}
        </p>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className={landingPage}>
      <Navbar contentId="landing-content" />
      <main id="landing-content" tabIndex={-1}>
        <section
          className={`${landingWrap} pb-14 pt-16 md:pb-20 md:pt-24`}
          aria-labelledby="landing-title"
        >
          <div className={landingEnter}>
            <p className={landingEyebrow}>
              <span className="h-px w-6 bg-primary" aria-hidden="true" /> A
              shared space for unfinished thinking
            </p>
            <div className="mt-7 grid items-end gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
              <h1 id="landing-title" className="text-landing-title font-medium">
                Good ideas deserve
                <br />
                <span className="font-display font-normal text-primary">
                  a second thought.
                </span>
              </h1>
              <div className="pb-1">
                <p className="max-w-sm text-prose text-muted-foreground">
                  Save the thought before it slips away. Give it shape, find it
                  later, and share it when you’re ready.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <StartButton />
                  <Link
                    to="/ideas"
                    className={buttonStyles({ variant: "ghost" })}
                  >
                    Explore ideas <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <FaGithub size={13} aria-hidden="true" /> GitHub sign-in to
                  save. Open to everyone to explore.
                </p>
              </div>
            </div>
          </div>
          <div
            className={`${landingEnter} mt-12 motion-safe:[animation-delay:120ms] md:mt-16`}
          >
            <ArchivePreview />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground">
              <p>Try it out. Pick a tag, search, or open an idea.</p>
              <a
                href="#how-it-works"
                className="inline-flex min-h-control items-center gap-2 rounded-control px-1 hover:text-foreground"
              >
                A little structure. A lot of possibility.
                <ArrowDown size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className={`${landingWrap} ${landingSection} scroll-mt-32`}
          aria-labelledby="workflow-title"
        >
          <div className="grid gap-6 md:grid-cols-2 md:gap-16">
            <div>
              <p className={landingEyebrow}>01 / KEEP THE THREAD</p>
              <h2 id="workflow-title" className={`${landingHeading} mt-5`}>
                From “what if”
                <br />
                to somewhere to start.
              </h2>
            </div>
            <p className={`${landingCopy} md:pt-11`}>
              Side projects, passing observations, a question you can’t shake.
              Stashed keeps them together, with just enough structure to pick up
              where you left off.
            </p>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-9">
            {[
              {
                icon: FileText,
                title: "Get it down.",
                text: "Start with a sentence. Make room for the details with Markdown, lists, links, and code.",
                detail: "A writing space for ideas of any size",
              },
              {
                icon: Hash,
                title: "Give it some context.",
                text: "Add tags that make sense to you. Set a status as a first thought becomes an active project.",
                detail: "Tags and statuses, at your pace",
              },
              {
                icon: Search,
                title: "Come back to it.",
                text: "Search titles and content, or narrow the archive by tag. Find the thought when the time is right.",
                detail: "Full-text search across your archive",
              },
            ].map(({ icon: Icon, title, text, detail }) => (
              <article
                key={title}
                className="border-t border-border-subtle pt-6"
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="mb-5 text-primary"
                  aria-hidden="true"
                />
                <h3 className="text-prose font-medium">{title}</h3>
                <p className="mt-3 text-body text-muted-foreground">{text}</p>
                <p className="mt-5 font-mono text-caption text-muted-foreground">
                  {detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="border-y border-border-subtle bg-surface/60"
          aria-labelledby="visibility-title"
        >
          <div
            className={`${landingWrap} grid items-center gap-10 py-16 md:grid-cols-2 md:gap-20 md:py-24`}
          >
            <div>
              <p className={landingEyebrow}>02 / CHOOSE YOUR AUDIENCE</p>
              <h2 id="visibility-title" className={`${landingHeading} mt-5`}>
                Some thoughts are yours.
                <br />
                <span className="text-muted-foreground">
                  Some are worth sharing.
                </span>
              </h2>
              <p className={`${landingCopy} mt-6`}>
                Choose visibility for each idea. Keep it private, send a link,
                or put it out in the open. You can change your mind as the idea
                develops.
              </p>
              <p className="mt-7 flex items-center gap-2 text-ui">
                <Check
                  size={15}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                Only the author can edit or delete an idea.
              </p>
            </div>
            <VisibilityPreview />
          </div>
        </section>

        <section
          className={`${landingWrap} py-16 md:py-24`}
          aria-labelledby="shared-title"
        >
          <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-20">
            <div>
              <p className={landingEyebrow}>03 / FOLLOW YOUR CURIOSITY</p>
              <h2 id="shared-title" className={`${landingHeading} mt-5`}>
                Your next idea might
                <br />
                start with someone else’s.
              </h2>
            </div>
            <div>
              <p className={landingCopy}>
                An archive for curious people. Explore what others are thinking,
                revisit a familiar subject, or find a starting point you hadn’t
                considered.
              </p>
              <Link
                to="/ideas"
                className={buttonStyles({
                  variant: "secondary",
                  className: "mt-6",
                })}
              >
                Browse the public archive{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="mt-12 border-t border-border-subtle">
            {exampleIdeas.map((idea) => (
              <div
                key={idea.id}
                className="grid items-baseline gap-x-6 gap-y-2 border-b border-border-subtle py-6 sm:grid-cols-[6rem_minmax(0,1fr)] lg:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <span className="font-mono text-caption text-muted-foreground">
                  # {idea.tag}
                </span>
                <h3 className="font-display text-card-title">{idea.title}</h3>
                <p className="text-ui text-muted-foreground sm:col-start-2 lg:col-start-auto">
                  {idea.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-caption text-muted-foreground">
            Illustrative ideas. Discover what’s being shared in the live
            archive.
          </p>
        </section>

        <section
          className="border-t border-border-subtle bg-surface-muted/40"
          aria-labelledby="closing-title"
        >
          <div
            className={`${landingWrap} grid items-center gap-8 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:py-20`}
          >
            <div>
              <p className={landingEyebrow}>
                <Layers3 size={16} aria-hidden="true" /> A thought today. A
                starting point tomorrow.
              </p>
              <h2
                id="closing-title"
                className="mt-5 text-closing-title font-medium"
              >
                Keep something
                <br />
                <span className="font-display font-normal text-primary">
                  worth coming back to.
                </span>
              </h2>
            </div>
            <div>
              <StartButton />
              <p className="mt-3 text-caption text-muted-foreground">
                Start with the idea on your mind.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer
        className={`${landingWrap} flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-7`}
      >
        <Link
          to="/"
          className="inline-flex min-h-control items-center gap-2 text-ui font-medium"
          aria-label="Stashed home"
        >
          <Layers3 size={16} className="text-primary" aria-hidden="true" />
          stashed.
        </Link>
        <p className="text-caption text-muted-foreground">
          A shared idea archive. Made for curious people.
        </p>
        <a
          href="#landing-content"
          className="inline-flex min-h-control items-center gap-2 rounded-control text-caption text-muted-foreground hover:text-foreground"
        >
          Back to top <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
