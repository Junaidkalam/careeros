# careeros-backend

Spring Boot MVP backend for the AI Career OS job-search platform.
See the full build plan for phasing and rationale: `job-platform-plan.md`.

## What's scaffolded here

- `pom.xml` — Spring Boot 3.3, Postgres, Spring Security, JWT (jjwt), PDFBox +
  POI (resume parsing), Jsoup (job HTML/JSON-LD extraction), Lombok.
- `entity/` — the Phase 1 schema: User, Company, Job, JobSkill, Resume,
  CandidateProfile, CandidateSkill, Application, ApplicationEvent, plus enums.
  All entities extend `BaseEntity` (UUID id + audit timestamps).
- `repository/` — one Spring Data JPA repository per entity.
- `dto/`, `service/`, `controller/` — a **complete reference vertical slice**
  for Jobs (`JobRequest` → `JobService` → `JobController`) showing the pattern
  to repeat for Resume, Application, etc.: DTOs in/out, never expose entities
  directly, business logic in the service layer, thin controllers.
- `config/JpaAuditingConfig.java` — enables the `createdAt`/`updatedAt` fields.
- `application.yml` — Postgres connection, JWT secret, file upload limits.

## What's intentionally NOT here yet

- Spring Security JWT filter chain / auth endpoints (register, login) —
  this is mission 1 for Antigravity, see below.
- Resume upload endpoint + PDFBox/POI text extraction — mission 3.
- Job URL extraction (Jsoup + JSON-LD parsing + LLM structuring) — mission 2b.
- Match-score calculation service — Phase 1, step 5 in the build plan.
- React frontend — separate `/frontend` project.

## Suggested next Antigravity missions (in order)

1. **Auth**: "Add Spring Security with JWT auth on top of the existing User
   entity: register/login endpoints, password hashing (BCrypt), a JWT filter
   that resolves `@AuthenticationPrincipal User`, and a `SecurityConfig` that
   protects `/api/**` except `/api/auth/**`. Write a test that registers,
   logs in, and calls a protected endpoint with the returned token."

2. **Job URL extraction**: "Add a `POST /api/jobs/import` endpoint that takes
   a URL, fetches the page with Jsoup, tries to find `schema.org/JobPosting`
   JSON-LD first, falls back to an LLM call on cleaned visible text if absent,
   and returns an *unsaved* `JobRequest`-shaped draft for the user to review
   and edit before calling the existing `POST /api/jobs`. Handle dead links
   and unparseable pages by returning a clear 'enter manually' response
   instead of a 500."

3. **Resume upload + parsing**: "Add `POST /api/resumes` (multipart file
   upload, PDF/DOCX via PDFBox/POI), extract raw text into the `Resume`
   entity, then call the LLM to produce a structured `CandidateProfile` +
   `CandidateSkill` list validated against a fixed JSON schema. Return it
   for user review before persisting the profile."

4. **Match score**: "Add a `MatchService` that compares a `CandidateProfile`'s
   skills against a `Job`'s `JobSkill`s (normalized string match), returns
   matched/partial/missing skill lists and a weighted 0-100 score, and wire
   it into `POST /api/applications` so a match score is stored when a job
   is marked Applied."

Each mission should end with the agent running a test before marking it done.
