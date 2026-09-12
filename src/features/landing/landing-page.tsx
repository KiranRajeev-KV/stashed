import { buttonStyles } from "../../components/ui/button-variants.js";
import {
  twStArtGrid,
  twStBackCard,
  twStBackOne,
  twStBackTop,
  twStBackTwo,
  twStCardBottom,
  twStCardTags,
  twStCardTape,
  twStCardTop,
  twStDemoLabel,
  twStEyebrow,
  twStFeatureIcon,
  twStFilterRow,
  twStFinal,
  twStFinalDoodle,
  twStFinalFoot,
  twStFinalSection,
  twStFinalSpark,
  twStFooter,
  twStHero,
  twStHeroArt,
  twStHeroButtons,
  twStHeroCopy,
  twStHeroDescription,
  twStHeroEnter,
  twStHeroFoot,
  twStLanding,
  twStLiveDot,
  twStLogo,
  twStMainCard,
  twStMethod,
  twStMethodCard,
  twStMethodDetail,
  twStMethodGrid,
  twStMethodTop,
  twStNumber,
  twStOrbitLabel,
  twStPlayground,
  twStPlaygroundSection,
  twStPlaygroundToolbar,
  twStPreviewBody,
  twStPreviewCaption,
  twStPreviewDetail,
  twStPreviewDetailFoot,
  twStPreviewDetailTop,
  twStPreviewHint,
  twStPreviewItem,
  twStPreviewItemMeta,
  twStPreviewItemTag,
  twStPreviewList,
  twStPreviewStatus,
  twStPrivacy,
  twStPrivacyCaption,
  twStPrivacyCopy,
  twStPrivacyNote,
  twStPrivacyOptions,
  twStPrivacySheet,
  twStPrivacySymbol,
  twStPrivacyVisual,
  twStSavedStamp,
  twStSectionHeading,
  twStSmallNote,
  twStStatusDot,
  twStUnderHero,
  twStUnderline,
  twStWrap,
} from "../../styles/landing-styles.js";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Globe2,
  Hash,
  Layers3,
  Lightbulb,
  Link2,
  LockKeyhole,
  MoveUpRight,
  PencilLine,
  Search,
  Sparkles,
} from "lucide-react";
import { currentUserQueryOptions, githubLoginPath } from "../../api/auth.js";
import { Navbar } from "../../components/layout/navbar.js";

const ideas = [
  {
    title: "A little corner of the internet",
    tag: "Design",
    status: "Exploring",
    text: "A personal website that feels like walking into someone's favorite room. A few good books, things they've made, and ideas still taking shape.",
    note: "What if a website felt more like a place?",
    color: "peach",
  },
  {
    title: "The Sunday side project",
    tag: "Building",
    status: "Active",
    text: "Build a tiny tool that picks a recipe from what's already in the fridge. Start with one ingredient, one good meal, and a very small prototype.",
    note: "Small enough to start. Useful enough to finish.",
    color: "green",
  },
  {
    title: "An unexpected connection",
    tag: "Thoughts",
    status: "Seed",
    text: "The best conversations leave you with a thought you wouldn't have found alone. Keep a little collection of those moments and see what connects.",
    note: "Leave a little room for serendipity.",
    color: "yellow",
  },
];
const visibility = [
  {
    name: "Public",
    icon: Globe2,
    title: "Some ideas are better shared.",
    text: "Let anyone discover and read your idea in the public archive. A small spark for you might be a starting point for someone else.",
    caption: "Visible in the public archive",
    label: "OUT IN THE OPEN",
  },
  {
    name: "Unlisted",
    icon: Link2,
    title: "Just for the people with the link.",
    text: "Share an idea by URL without putting it in the public archive. Anyone with that link can read it, so share it thoughtfully.",
    caption: "Anyone with the link can read",
    label: "PASS IT ALONG",
  },
  {
    name: "Private",
    icon: LockKeyhole,
    title: "A little space to think out loud.",
    text: "Keep an idea just for yourself while it takes shape. Private ideas are only visible to their author. You decide when they're ready to share.",
    caption: "Only visible to you",
    label: "JUST FOR YOU",
  },
];

function StartButton({ compact = false }: { compact?: boolean }) {
  const session = useQuery(currentUserQueryOptions());
  const classes = buttonStyles({ variant: "primary" });
  if (session.isPending)
    return (
      <span className={classes} role="status">
        One moment…
      </span>
    );
  return session.data ? (
    <Link to="/ideas" className={classes}>
      Explore ideas <ArrowUpRight size={17} />
    </Link>
  ) : (
    <a href={githubLoginPath} className={classes}>
      {compact ? "Get started" : "Start stashing"}
      <ArrowUpRight size={17} />
    </a>
  );
}

function LandingSecondaryAction() {
  const session = useQuery(currentUserQueryOptions());

  if (session.isPending) return null;

  return session.data ? (
    <Link to="/ideas/new" className={buttonStyles({ variant: "ghost" })}>
      Stash an idea <ArrowUpRight size={17} />
    </Link>
  ) : (
    <Link to="/ideas" className={buttonStyles({ variant: "ghost" })}>
      Explore ideas <ArrowRight size={17} />
    </Link>
  );
}

export function LandingPage() {
  const page = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("All ideas");
  const [selected, setSelected] = useState(0);
  const [privacy, setPrivacy] = useState(0);
  const item = ideas[selected];
  const privacyItem = visibility[privacy];
  const PrivacyIcon = privacyItem.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("st-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    page.current
      ?.querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={twStLanding} ref={page}>
      <Navbar contentId="landing-content" />
      <main id="landing-content" tabIndex={-1}>
        <section className={`${twStHero} ${twStWrap}`}>
          <div className={twStHeroCopy}>
            <p className={`${twStEyebrow} ${twStHeroEnter}`}>
              <span className={twStLiveDot} /> A HOME FOR YOUR WHAT-IFS
            </p>
            <h1 className={twStHeroEnter}>
              Big things start
              <br />
              with a <em>little idea.</em>
              <svg
                className={twStUnderline}
                viewBox="0 0 430 20"
                aria-hidden="true"
              >
                <path d="M4 13 Q200 -3 424 9 M45 18 Q230 7 378 14" />
              </svg>
            </h1>
            <p className={`${twStHeroDescription} ${twStHeroEnter}`}>
              The shower thoughts. The side projects. The “what ifs.”
              <br className="st-wide-break" /> Give them a place to land, and
              room to become something.
            </p>
            <div className={`${twStHeroButtons} ${twStHeroEnter}`}>
              <StartButton />
              <LandingSecondaryAction />
            </div>
            <p className={`${twStHeroFoot} ${twStHeroEnter}`}>
              <Check size={13} /> Your ideas, your space <span>·</span> Sign in
              with GitHub
            </p>
          </div>
          <div
            className={twStHeroArt}
            aria-label="Illustrated example idea cards"
          >
            <div className={twStArtGrid} aria-hidden="true" />
            <div className={twStOrbitLabel}>
              <Sparkles size={16} /> a little messy. a lot of potential.
            </div>
            <div className={`${twStBackCard} ${twStBackOne}`}>
              <span>
                <Hash size={14} /> someday-maybe
              </span>
            </div>
            <div className={`${twStBackCard} ${twStBackTwo}`}>
              <span>
                THOUGHT NO. 028 <Lightbulb size={17} />
              </span>
            </div>
            <article className={twStMainCard}>
              <div className={twStCardTape} aria-hidden="true" />
              <div className={twStCardTop}>
                <span>
                  <Lightbulb size={16} /> A SMALL SPARK
                </span>
                <ArrowUpRight size={20} />
              </div>
              <h2>
                What if we made
                <br />
                something <em>just because?</em>
              </h2>
              <p>
                No pitch deck. No five-year plan.
                <br />
                Just a curious idea and a place to start.
              </p>
              <div className={twStCardTags}>
                <span># side-project</span>
                <span># what-if</span>
              </div>
              <div className={twStCardBottom}>
                <span>
                  <span className={twStStatusDot} /> Exploring
                </span>
                <span>Saved for a someday.</span>
              </div>
            </article>
            <div className={twStSmallNote}>
              <span aria-hidden="true">✳</span> doesn't have to
              <br />
              be perfect yet.
            </div>
            <div className={twStSavedStamp}>
              <Bookmark size={15} fill="currentColor" /> A good thought, kept.
            </div>
          </div>
        </section>
        <div className={`${twStUnderHero} ${twStWrap}`}>
          <span>YOUR NEXT GOOD THING COULD START HERE</span>
          <a href="#how-it-works" aria-label="Discover how Stashed works">
            <ArrowDown size={18} />
          </a>
          <span>COLLECT NOW. CONNECT THE DOTS LATER.</span>
        </div>

        <section
          id="how-it-works"
          className={`${twStMethod} ${twStWrap}`}
          data-reveal
        >
          <div className={twStSectionHeading}>
            <div>
              <p className={twStEyebrow}>
                A LITTLE LESS LOST. A LITTLE MORE POSSIBLE.
              </p>
              <h2>
                From fleeting thought
                <br />
                to <em>something worth keeping.</em>
              </h2>
            </div>
            <p>
              You don't need a fully formed plan.
              <br />
              Just somewhere to put the first sentence.
            </p>
          </div>
          <div className={twStMethodGrid}>
            {[
              {
                icon: PencilLine,
                title: "Catch the spark.",
                text: "A sentence, a sketch in words, a half-baked plan. Capture it with Markdown before the moment passes.",
                detail: "Less formatting. More thinking.",
              },
              {
                icon: Hash,
                title: "Give it a little shape.",
                text: "Add a few tags. Set a status. Turn a pile of thoughts into a collection that makes sense to you.",
                detail: "A little structure goes a long way.",
              },
              {
                icon: Search,
                title: "Find it when it clicks.",
                text: "Search your archive, revisit a thread, or discover a public idea that gets your mind moving again.",
                detail: "Right idea. A different moment.",
              },
            ].map(({ icon: Icon, title, text, detail }, index) => (
              <article className={twStMethodCard} key={title}>
                <div className={twStMethodTop}>
                  <span
                    className={`${twStFeatureIcon} ${index === 1 ? "text-accent!" : index === 2 ? "text-warning!" : ""}`}
                  >
                    <Icon size={23} />
                  </span>
                  <span className={twStNumber}>0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className={twStMethodDetail}>{detail}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="playground" className={twStPlaygroundSection} data-reveal>
          <div className={twStWrap}>
            <div className={twStSectionHeading}>
              <div>
                <p className={twStEyebrow}>MAKE YOURSELF AT HOME</p>
                <h2>
                  A place for your
                  <br />
                  <em>beautifully unfinished.</em>
                </h2>
              </div>
              <p>
                A few example ideas to play with.
                <br />
                Pick a tag. Follow a thought. See what clicks.
              </p>
            </div>
            <div className={twStPlayground}>
              <div className={twStPlaygroundToolbar}>
                <span>
                  <Layers3 size={17} /> Your little collection
                </span>
                <span className={twStDemoLabel}>INTERACTIVE PREVIEW</span>
              </div>
              <div
                className={twStFilterRow}
                role="group"
                aria-label="Filter example ideas"
              >
                {["All ideas", "Design", "Building", "Thoughts"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={filter === tag}
                    onClick={() => {
                      setFilter(tag);
                      if (tag !== "All ideas")
                        setSelected(
                          ideas.findIndex((idea) => idea.tag === tag),
                        );
                    }}
                  >
                    {tag === "All ideas" ? (
                      <Layers3 size={14} />
                    ) : (
                      <Hash size={14} />
                    )}
                    {tag}
                  </button>
                ))}
              </div>
              <div className={twStPreviewBody}>
                <div className={twStPreviewList} aria-label="Example ideas">
                  {ideas.map((idea, index) =>
                    filter === "All ideas" || filter === idea.tag ? (
                      <button
                        type="button"
                        key={idea.title}
                        className={`${twStPreviewItem} st-${idea.color}`}
                        aria-pressed={selected === index}
                        onClick={() => setSelected(index)}
                      >
                        <span className={twStPreviewItemMeta}>
                          0{index + 1}
                          <ArrowUpRight size={16} />
                        </span>
                        <h3>{idea.title}</h3>
                        <span className={twStPreviewItemTag}>
                          # {idea.tag.toLowerCase()}
                        </span>
                      </button>
                    ) : null,
                  )}
                  <p className={twStPreviewHint}>
                    <MoveUpRight size={15} /> Select a thought to look inside
                  </p>
                </div>
                <article
                  className={twStPreviewDetail}
                  key={selected}
                  aria-live="polite"
                >
                  <div className={twStPreviewDetailTop}>
                    <span>FROM THE EXAMPLE COLLECTION</span>
                    <span className={twStPreviewStatus}>
                      <span className={twStStatusDot} /> {item.status}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <blockquote>{item.note}</blockquote>
                  <div className={twStPreviewDetailFoot}>
                    <span>
                      <Hash size={13} /> {item.tag.toLowerCase()}
                    </span>
                    <span>
                      <Globe2 size={13} /> Public idea
                    </span>
                  </div>
                </article>
              </div>
            </div>
            <div className={twStPreviewCaption}>
              <span>
                Real possibilities. Example ideas. Your collection is up next.
              </span>
              <Link to="/ideas" className={buttonStyles({ variant: "ghost" })}>
                Visit the public archive <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className={`${twStPrivacy} ${twStWrap}`} data-reveal>
          <div className={twStPrivacyCopy}>
            <p className={twStEyebrow}>OPEN UP. OR KEEP IT CLOSE.</p>
            <h2>
              Your thoughts.
              <br />
              <em>Your call.</em>
            </h2>
            <p>
              Not every idea is ready for an audience.
              <br />
              Choose who gets to see each one.
            </p>
            <div
              className={twStPrivacyOptions}
              role="group"
              aria-label="Explore idea visibility"
            >
              {visibility.map(({ name, icon: Icon }, index) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={privacy === index}
                  onClick={() => setPrivacy(index)}
                >
                  <Icon size={16} />
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className={twStPrivacyVisual}>
            <div className={twStPrivacySheet} key={privacy} aria-live="polite">
              <span className={twStPrivacySymbol}>
                <PrivacyIcon size={28} />
              </span>
              <p className={twStEyebrow}>{privacyItem.label}</p>
              <h3>{privacyItem.title}</h3>
              <p>{privacyItem.text}</p>
              <span className={twStPrivacyCaption}>
                <Check size={14} />
                {privacyItem.caption}
              </span>
            </div>
            <span className={twStPrivacyNote}>a door you get to open.</span>
          </div>
        </section>

        <section className={`${twStFinalSection} ${twStWrap}`} data-reveal>
          <div className={twStFinal}>
            <span className={twStFinalSpark} aria-hidden="true">
              ✳
            </span>
            <p className={twStEyebrow}>
              IT DOESN'T HAVE TO BE THE NEXT BIG THING.
            </p>
            <h2>
              It just has to be
              <br />
              <em>worth keeping.</em>
            </h2>
            <p>Make a little room for your next idea.</p>
            <StartButton />
            <span className={twStFinalFoot}>
              A shared idea archive. Made for curious people.
            </span>
            <span className={twStFinalDoodle} aria-hidden="true">
              ↗
            </span>
          </div>
        </section>
      </main>
      <footer className={`${twStFooter} ${twStWrap}`}>
        <Link to="/" className={twStLogo}>
          <Layers3 size={20} />
          stashed.
        </Link>
        <p>A home for ideas worth coming back to.</p>
        <Link to="/ideas">
          Go explore <ArrowUpRight size={15} />
        </Link>
        <a href="#landing-content" className={twStBackTop}>
          Back to top ↑
        </a>
      </footer>
    </div>
  );
}
