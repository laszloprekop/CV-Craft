# CV Craft - Product Vision & Planning

*Created: 2026-03-17*

## Grand Vision

CV Craft evolves from a markdown CV editor into an **AI career agent** — the CV is the output artifact, but the real product is: *"I tell the system who I am professionally, what I want, and it finds opportunities, prepares materials, and tracks my pipeline."*

### Tiered Model

| Tier | Features |
|------|----------|
| **Free** | Markdown CV editor, live preview, PDF export, template customization |
| **AI Tickets** | Pay-per-use AI CV generation tailored to specific job ads |
| **Premium Agent** | AI job discovery, auto-matching, CV + cover letter generation, application tracking |

### Full User Journey (Premium Vision)

1. User creates an account, optionally buys AI CV tickets
2. User enters **stem data** — structured career records (work experience, projects, technologies, achievements)
3. Optionally pays for AI processing of uploaded/linked career records
4. Sets job/role preferences (area, profession, level, salary expectations, openness to partial matches)
5. AI periodically searches job sources using preferences, emails user when matches found
6. If user responds as interested, AI scrapes more job details + key company/role metadata
7. AI prepares a custom-tailored CV and cover letter, notifies user
8. User logs in, reviews metadata, tweaks CV/CL, exports or sends directly
9. User can export as web page (GitHub Pages, self-hosted, etc.)
10. User tracks application progress (response received, interview meetings, outcomes)

---

## Strategic Analysis

### Strengths

- **Natural upgrade funnel:** Free (editor) -> Paid (AI generation) -> Premium (job matching + auto-apply)
- **Switching cost moat:** Once users invest time entering structured career history, they stay
- **Retention hook:** Follow-up tracking turns a one-shot tool into daily-use app
- **Niche differentiator:** Markdown-native, GitHub Pages export appeals to technical audience

### Risks & Concerns

#### 1. Job Scraping is Legally Fraught
Scraping job boards (LinkedIn, Indeed) is actively fought by those platforms. Options:
- Partner with job board APIs (expensive, gatekept)
- Use aggregators (Adzuna, The Muse, etc.)
- User-initiated scraping only ("paste the job ad URL") — lower legal risk

**The "AI periodically searches and emails you" model is essentially a recruitment platform — a massive scope jump from a CV tool.**

#### 2. AI Cost Structure May Not Close
Each CV generation = LLM call with substantial context (stem CV + job ad + company research). Margin depends on context size and model choice. **Per-CV cost modeling is critical before pricing.**

#### 3. AI-Generated Cover Letters Are Becoming Detectable
ATS systems are starting to filter AI-generated content. The AI should provide strong drafts, not finished products — position as augmentation, not automation.

#### 4. Crowded Competitor Landscape
Teal, Kickresume, Resume.io, Rezi, and dozens more already have AI features. Potential differentiators:
- Superior AI tailoring (hard to sustain as models commoditize)
- Full pipeline (job discovery -> apply -> track) — few do this well
- Developer/technical audience focus (markdown-native, GitHub Pages export)
- Design quality of PDF output (current rendering is already strong)

---

## Planning Workstreams

### Workstream 1: Business Viability
- [ ] Competitor analysis (features, pricing, market position)
- [ ] Cost model: AI API costs per CV generation vs. ticket pricing
- [ ] Legal review: job scraping, data privacy (GDPR — storing career data), AI content liability
- [ ] Target audience definition: who specifically, and why would they pay?
- [ ] MVP pricing model

### Workstream 2: Product Definition
- [ ] User journey maps for each tier (free, AI tickets, full agent)
- [ ] Data model design: stem CV structure, job ads, generated CVs, application tracking
- [ ] Feature matrix: what's in free vs. paid, what's phase 1 vs. later
- [ ] Auth & user management requirements
- [ ] Deployment architecture (hosting, database, auth provider, payment)

### Workstream 3: Free Tier Finalization (can start now)
- [ ] Gap analysis: what's missing from current editor for production-readiness
- [ ] User accounts & auth (even for free tier)
- [ ] Data persistence strategy (currently SQLite — won't scale to multi-user)
- [ ] Deployment target (Vercel? Railway? VPS?)
- [ ] Domain, branding, landing page
- [ ] Design revamp (modern look, clean visual hierarchy, no Tailwind fingerprints)

---

## Recommended Sequencing

**Ship the free tier first.** It validates demand, builds an audience, and gives a live product to iterate on. AI features and job matching layer on top once the foundation is solid and demand is validated.

Business evaluation (Workstream 1) should run in parallel but not block free tier work.

---

## Open Questions

1. **Free tier first or full data model upfront?** Ship free now, or architect for paid features from the start?
2. **Deployment target?** Affects database choice, auth approach, cost structure
3. **Planning tools?** Structured docs in repo vs. external tool (Notion, Linear, etc.)
4. **Design scope?** Design only the free tier, or design full vision UI with paid features shown but locked?
