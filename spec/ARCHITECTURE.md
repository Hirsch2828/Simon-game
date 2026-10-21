# Architecture

> The technical architecture required to build the product, based on the PRD. Include only components the product actually needs, and keep the design as simple as possible. Do not include milestones, development phases, tasks, or timelines here — those belong in MILESTONES.md.

## 1. Selected Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| <e.g. Frontend> | <technology> | <what it is used for> |
| <e.g. Backend — remove if not needed> | <technology> | <what it is used for> |
| <e.g. Database — remove if not needed> | <technology> | <what it is used for> |
| Source code | Git repository on GitHub | Code storage and version history |

### Key technology decisions
<A brief explanation of the main technology choices and the reasons behind them — suitability for the product, simplicity, reliability, costs, and maintenance. Add sources supporting significant decisions.>

### Risks and limitations
<Significant risks, limitations, or considerations associated with the selected technologies, if any.>

## 2. System Architecture

> Include only the subsections relevant to the product.

### System structure
<The overall system structure, the main components, and the responsibilities of each.>

### Modules and layers
<The division into modules and logical layers, and the relationships between them.>

### Frontend and Backend
<The frontend and backend architecture, where applicable.>

### Data Model
<The main data entities, their relationships, and how data is stored — database or local storage, where required.>

### APIs and integrations
<Key interfaces, communication between components, and integrations with external services, where required.>

### Data Flow
<The flow of data and operations between the main system components.>

### Authentication, authorization, security, and privacy
<According to the product requirements.>

### Infrastructure, Hosting, Deployment, and Configuration
> Recommended defaults when internet deployment is required: frontend only → GitHub Pages; frontend + backend → Vercel; frontend + backend + database → Vercel + Supabase (PostgreSQL). Choose differently only for a significant technical reason, and explain it briefly.
>
> When Supabase is selected: define two separate projects — one for Development (development and testing) and one for Production (the live site and real data). The user is not a programmer, so do not rely on a local Supabase or on installing Docker; development and testing run against the Development project in the cloud.

<Where relevant: how the source code is hosted on GitHub and how the automated build and deployment work. If a database is required — how the application connects to it, how database migrations are managed, and how access credentials are stored securely.>

<If separate Development and Production environments are defined: which environment connects to which project and where its access credentials are stored (the local machine connects to Development only); the procedure for applying database migrations — first to Development, and to Production only after the user's approval, including who applies them and when; which settings are not carried over by migrations and must be configured separately in each project; and the relevant current plan limitations. Remove if not needed.>

### Additional key technical decisions
<Any other key technical decisions required to implement the product.>
