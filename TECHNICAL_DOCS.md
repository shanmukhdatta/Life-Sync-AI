# LifeSync AI — Technical Documentation

> Complete code walkthrough for developers, judges, and contributors.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Frontend Deep Dive](#frontend-deep-dive)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Security Model](#security-model)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Animation System](#animation-system)
7. [Testing Strategy](#testing-strategy)
8. [Performance Decisions](#performance-decisions)
9. [Accessibility Implementation](#accessibility-implementation)
10. [Extending LifeSync AI](#extending-lifesync-ai)

---

## System Architecture

LifeSync AI follows a **clean separation** between presentation, API, and service layers:

```
Browser (React SPA)
    │
    │ HTTP/JSON (Vite proxy → /api/*)
    ▼
FastAPI (Python)
    │
    ├── Routers          → HTTP routing, request validation, response shaping
    │
    ├── Services         → Business logic, Google API calls (real or mock)
    │   ├── GmailService
    │   ├── CalendarService
    │   ├── GeminiService
    │   ├── DriveService
    │   └── TasksService / SheetsService / MapsService
    │
    └── Config           → Pydantic Settings, environment variables
```

### Why This Architecture?

**Problem:** Google API integrations can fail in tests, change their interfaces, or require live credentials you may not have. 

**Solution:** Every service module has a parallel `Mock*` class that satisfies the exact same interface. Routers receive either the real or mock service based on a single `USE_MOCK` flag, which is automatically `True` when API keys aren't configured.

This satisfies the **Dependency Inversion Principle** (SOLID) — high-level routers don't depend on concrete Google API implementations.

---

## Frontend Deep Dive

### `src/index.css` — The Design Foundation

This file defines the entire visual language of LifeSync AI:

**Glass Card System:**
```css
.glass-card {
  background: rgba(255,255,255,0.04);      /* nearly invisible white tint */
  backdrop-filter: blur(20px) saturate(180%); /* frosted glass effect */
  border: 1px solid rgba(255,255,255,0.08); /* razor-thin white border */
  border-radius: 20px;
  transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1); /* Apple easing */
}
.glass-card:hover {
  background: rgba(255,255,255,0.07);       /* slightly brighter on hover */
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 0 40px rgba(255,255,255,0.04), 0 0 80px rgba(255,255,255,0.02);
  transform: translateY(-4px);              /* subtle lift */
}
```

**Why `cubic-bezier(0.23, 1, 0.32, 1)`?**  
This is Apple's easing curve. It starts fast and decelerates smoothly — much more natural than `ease-out`. Used consistently across ALL transitions for cohesion.

**Why `rgba(255,255,255,0.04)`?**  
On a pure black background, even 4% white opacity creates a perceptible glass panel. Going higher than 0.08 makes it look like a grey box, not glass. The difference is subtle but critical to the premium feel.

**Orb Animation:**
```css
@keyframes orbFloat1 {
  0%, 100% { transform: translateX(-60px) translateY(-40px); }
  25%       { transform: translateX(30px) translateY(-60px); }
  50%       { transform: translateX(60px) translateY(40px); }
  75%       { transform: translateX(-30px) translateY(60px); }
}
```
The orbs move in a smooth loop through 4 waypoints — this avoids the mechanical "bounce" of a simple back-and-forth sine wave. Two orbs move in opposite phase to create organic visual tension.

**Concentric Rings:**
```css
@keyframes ringExpand {
  0%   { transform: scale(0.3); opacity: 0.4; }
  100% { transform: scale(2.5); opacity: 0; }
}
.ring { animation: ringExpand 4s ease-out infinite; }
```
Each ring fades out as it expands, creating a perpetual "pulse" effect from the center. Staggered `animation-delay` (0.6s each) ensures they're always at different points in the cycle.

---

### `src/hooks/useCountUp.js` — Animated Stat Counter

```javascript
const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting && !animated.current) {
      setInView(true)
      animated.current = true  // never re-animate
    }
  },
  { threshold: 0.15 }  // trigger when 15% visible
)
```

**Key decisions:**
- `animated.current = true` uses a ref (not state) to prevent re-renders
- `threshold: 0.15` — trigger early, before fully visible, so the counter is partway through when user focuses on it
- **easeOut cubic**: `1 - Math.pow(1 - progress, 3)` — fast start, smooth landing. Numbers feel "heavy" as they settle.
- Uses `requestAnimationFrame` not `setInterval` — smoother, synced with display refresh rate

---

### `src/components/Navbar.jsx`

The navbar has **scroll-aware styling** — on scroll, the background darkens and the bottom border brightens:

```javascript
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20)
  window.addEventListener('scroll', onScroll)
  return () => window.removeEventListener('scroll', onScroll)
}, [])
```

Applied with inline styles (not Tailwind classes) because fractional opacity values like `rgba(0,0,0,0.85)` can't be expressed in Tailwind without custom config:

```javascript
style={{
  background: scrolled ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
  transition: 'all 300ms ease',
}}
```

**Mobile menu** uses `AnimatePresence` to animate in/out:
```jsx
<AnimatePresence>
  {mobileOpen && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}  // exit animation on unmount
    >
```

`AnimatePresence` is essential here — without it, Framer Motion can't animate an element as it unmounts from the DOM.

---

### `src/components/Hero.jsx`

**Grain texture** — defined in CSS as a `::before` pseudo-element using an SVG `feTurbulence` filter embedded as a data URI:
```css
.grain-overlay::before {
  background-image: url("data:image/svg+xml,...feTurbulence...");
  opacity: 0.025;
  pointer-events: none;  /* critical — don't block clicks */
}
```

**Page load animation sequence** — each element has a progressively larger delay:
```javascript
const fadeUp = (delay = 0, y = 24) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] },
})
// Badge: delay 0.1, Hero H1: delay 0.2, Subtitle: delay 0.35, CTAs: delay 0.5
```

This creates a cascading reveal that feels intentional and guides the eye from top to bottom.

---

### `src/components/Personas.jsx` — 3D Tilt Effect

The most technically complex frontend component:

```javascript
const handleMouseMove = (e) => {
  const rect = cardRef.current.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const mouseX = e.clientX - centerX   // distance from card center
  const mouseY = e.clientY - centerY
  // Normalize to [-1, 1] range, then scale to ±8 degrees
  rotateX.set(-(mouseY / (rect.height / 2)) * 8)
  rotateY.set((mouseX / (rect.width / 2)) * 8)
}
```

**Why `useSpring` instead of direct motion values?**
```javascript
const springX = useSpring(rotateX, { stiffness: 150, damping: 20 })
```
`useSpring` adds physical inertia — the card "lags behind" the mouse slightly and "bounces" gently when the mouse leaves. Without spring, motion is instant and feels mechanical. `stiffness: 150` is responsive but not jittery; `damping: 20` settles smoothly.

**Why `perspective: 1000` on the parent div?**  
CSS `perspective` defines the depth of the 3D space. 1000px is the "viewing distance" — anything less makes the tilt look extreme, anything more makes it subtle to the point of invisible.

---

### `src/components/Architecture.jsx` — SVG Diagram

The architecture diagram uses SVG with `<animateMotion>` for traveling dots:

```svg
<circle r="3" fill="rgba(255,255,255,0.7)">
  <animateMotion dur="2.5s" repeatCount="indefinite" begin="0.5s">
    <mpath>
      <path d="M {cx} {cy} L {pos.x} {pos.y}" />
    </mpath>
  </animateMotion>
  <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" />
</circle>
```

The circle starts invisible, becomes visible midway, then fades out — creating the illusion of a "signal" traveling from the center to each satellite. Combined with a staggered `begin` delay, pulses travel to each node at different times.

**Responsive SVG:**
```javascript
const [dims, setDims] = useState({ w: 500, h: 500 })
useEffect(() => {
  const obs = new ResizeObserver(() => setDims({...}))
  obs.observe(svgRef.current)
}, [])
```
The diagram recalculates satellite positions based on the actual container width, making it fully responsive.

---

### `src/components/ScrollProgress.jsx`

Simplest component, but technically elegant:

```javascript
const { scrollYProgress } = useScroll()
const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

return <motion.div style={{ scaleX, transformOrigin: 'left' }} />
```

`useScroll` returns a `MotionValue` (not React state) that updates on every scroll frame without causing re-renders. `useTransform` maps the 0→1 scroll range to a 0→1 scale value. `transformOrigin: 'left'` makes the bar grow from left to right.

---

## Backend Deep Dive

### `config.py` — Pydantic Settings

```python
class Settings(BaseSettings):
    google_client_id: str = ""
    
    class Config:
        env_file = ".env"
```

**Pydantic Settings** automatically reads from environment variables and `.env` file. Type validation is automatic — if you put a non-string where a string is expected, it raises a clear error at startup, not at runtime.

The `scopes_list` property converts the comma-separated env var into a list:
```python
@property
def scopes_list(self) -> List[str]:
    return [s.strip() for s in self.google_scopes.split(",")]
```

---

### `services/gmail_service.py` — The Pattern

Every service follows this exact pattern:

```python
class GmailService:      # Real: calls Google API
    def __init__(self, credentials: Credentials):
        self.service = build("gmail", "v1", credentials=credentials)
    
    def list_messages(self, max_results=20, query="") -> List[Dict]:
        # Real Google API call
        result = self.service.users().messages().list(...).execute()
        return [self._get_message_summary(m["id"]) for m in result["messages"]]

class MockGmailService:  # Mock: returns hard-coded realistic data
    MOCK_EMAILS = [...]
    
    def list_messages(self, max_results=20, query="") -> List[Dict]:
        return self.MOCK_EMAILS[:max_results]  # same interface, no API call
```

**Why `_get_message_summary` is private:**  
Prefixing with `_` signals it's an implementation detail. Only `list_messages` and other public methods are the contract — the mock doesn't need to implement `_get_message_summary`.

**Body extraction with MIME recursion:**
```python
def _extract_body(self, payload: Dict) -> str:
    if payload.get("mimeType") == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    
    for part in payload.get("parts", []):
        text = self._extract_body(part)   # recursive — handles nested MIME
        if text:
            return text
    return ""
```

Gmail messages are nested MIME trees. `text/plain` might be at depth 1 (simple email) or depth 3 (multipart/mixed → multipart/alternative → text/plain). Recursion handles all cases.

**Why `+ "=="` in base64 decode?**  
Google's API uses URL-safe base64 without padding. Python's `base64.urlsafe_b64decode` requires padding. Adding `"=="` and letting Python truncate the excess is the standard fix.

---

### `services/gemini_service.py` — AI Integration

**JSON response handling:**
```python
def _parse_json_response(self, text: str) -> Any:
    # Strip markdown code fences Gemini sometimes adds
    clean = re.sub(r"```(?:json)?\n?", "", text).replace("```", "").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return None  # caller handles None gracefully
```

LLMs sometimes wrap JSON in markdown fences (` ```json `). This strips them before parsing.

**Structured prompts — why they work:**
```python
prompt = f"""Return ONLY valid JSON:
{{
  "top_priorities": [...],
  "greeting": "...",
}}"""
```

Key principles:
1. **"Return ONLY valid JSON"** — prevents preamble like "Sure! Here's the JSON:"
2. **Provide the exact schema** — Gemini fills it in, rather than inventing structure
3. **Use concrete examples** — `"tag": "Urgent|Health Goal|Needs Reply|Can Delegate"` shows the enum
4. **Cap input** — `email_body[:1500]` prevents exceeding context window for simple tasks

---

### `routers/dashboard_router.py` — Async Parallel Calls

The most performance-critical endpoint:

```python
@router.get("/briefing")
async def morning_briefing(token_data = Depends(get_current_token_data)):
    gmail_svc, calendar_svc, gemini_svc = _get_services(token_data)
    loop = asyncio.get_event_loop()
    
    # These run SIMULTANEOUSLY — not one after another
    email_task = loop.run_in_executor(None, lambda: gmail_svc.list_messages(10))
    calendar_task = loop.run_in_executor(None, lambda: calendar_svc.get_today_summary())
    
    emails, calendar = await asyncio.gather(email_task, calendar_task)
    
    # Gemini runs AFTER because it needs both results as input
    briefing = await loop.run_in_executor(None, lambda: gemini_svc.generate_morning_briefing(emails, calendar["events"]))
```

**Why `run_in_executor`?**  
The Google API client library (`google-api-python-client`) is synchronous. Calling it directly in an `async` function would block the event loop, preventing FastAPI from handling other requests. `run_in_executor` runs it in a thread pool, keeping the event loop free.

**Why `asyncio.gather` instead of `await` twice?**  
```python
# BAD: sequential — takes T_gmail + T_calendar ms
emails = await gmail_task
calendar = await calendar_task

# GOOD: parallel — takes max(T_gmail, T_calendar) ms
emails, calendar = await asyncio.gather(email_task, calendar_task)
```

If Gmail takes 800ms and Calendar takes 600ms: sequential = 1400ms, parallel = 800ms.

---

### `routers/auth_router.py` — JWT Design

The JWT payload contains the Google token data:

```python
access_token = create_access_token(data={
    "sub": user_info["email"],
    "name": user_info["name"],
    "token_data": {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        ...
    }
})
```

**Why embed token_data in the JWT?**  
This makes the server **stateless** — no database or Redis needed to store sessions. When a request arrives, the server decodes the JWT, gets the Google credentials, and builds service instances on the spot.

**Trade-off:** JWTs can't be invalidated server-side before expiry. Mitigated by short expiry (60 min default) and the refresh flow.

**Why tokens aren't stored server-side:**  
Per the security requirements — *"all data stays in user's own Google account"*. The server never persists user credentials anywhere.

---

### `utils/auth_dep.py` — FastAPI Dependency

```python
async def get_current_token_data(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict:
    if USE_MOCK:
        return {"sub": "demo@lifesync.ai", "name": "Demo User", "token_data": {}}
    
    payload = jwt.decode(credentials.credentials, settings.secret_key, ...)
    return payload
```

**FastAPI `Depends`** injects this into every protected route:
```python
@router.get("/briefing")
async def morning_briefing(token_data: Dict = Depends(get_current_token_data)):
    # token_data is automatically validated and available here
```

When mock mode is active, every route gets mock data without any auth header — making development frictionless.

---

## Security Model

### OAuth 2.0 Minimal Scopes
LifeSync AI requests only the permissions it actually uses:

| Scope | Why Needed |
|-------|-----------|
| `gmail.readonly` | Read emails for action extraction |
| `gmail.compose` | Create draft replies (never sends without approval) |
| `calendar` | Create/read events for scheduling |
| `drive.readonly` | Surface meeting documents |
| `fitness.activity.read` | Read fitness data, never write |
| `spreadsheets` | Write expense logs and weekly scores |
| `documents` | Create meeting notes |
| `tasks` | Create and complete tasks |

**Never requested:**
- `gmail.modify` — LifeSync reads but doesn't move/delete emails via this scope
- `drive` (full) — read-only is sufficient for surfacing docs

### Data Flow Security
```
User Browser → JWT (signed, expiring) → FastAPI → Google API → Response
                                                 ↑
                              No data stored here — stateless
```

No user data ever leaves the Google ecosystem. The FastAPI server acts as an **orchestration layer**, not a data store.

---

## Data Flow Diagrams

### Morning Briefing Flow
```
GET /api/dashboard/briefing
    │
    ├── JWT decode → get Google credentials
    │
    ├── asyncio.gather([
    │       gmail.list_messages(10),      ← parallel
    │       calendar.get_today_summary()  ← parallel
    │   ])
    │
    ├── gemini.generate_morning_briefing(emails, events)
    │
    └── Response {briefing, calendar, inbox}
```

### Natural Language Command Flow
```
POST /api/ai/command { "command": "prepare for investor meeting Thursday" }
    │
    ├── Build context (events + emails) via asyncio.gather
    │
    ├── gemini.parse_natural_language_command(command, context)
    │       └── Returns { intent, tasks, calendar_blocks, emails_to_surface }
    │
    └── Response with structured workflow for frontend to execute
```

### Email Intelligence Flow
```
GET /api/email/inbox
    │
    ├── gmail.list_messages(20) → raw emails
    ├── gmail.classify_inbox(emails) → { act_now, read_later, fyi_only, delegate }
    └── gmail.find_billing_emails() → billing thread list

POST /api/email/extract-actions { email_body, from, subject }
    │
    ├── gemini.extract_action_items(body, from, subject)
    │       └── Returns [{ action, deadline, priority, duration_minutes }]
    └── Response with structured task list ready to create
```

---

## Animation System

### Easing Conventions
All animations use consistent easing:
- **Page load / scroll reveal**: `[0.23, 1, 0.32, 1]` (Apple ease-out)
- **Hover transitions**: `400ms cubic-bezier(0.23, 1, 0.32, 1)`
- **Button press**: `200ms ease` (fast, responsive)
- **Spring physics**: `stiffness: 150, damping: 20` (persona cards)
- **Cursor spring**: `stiffness: 500, damping: 50` (tight follow)

### Scroll Reveal Pattern
Every section uses the same variant structure:
```javascript
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23,1,0.32,1] } }
}

// Usage:
<motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
  {items.map(item => <motion.div variants={itemVariants}>...</motion.div>)}
</motion.div>
```

`viewport={{ once: true }}` — elements only animate in once, not every time they scroll in/out.

---

## Testing Strategy

### Three-Layer Testing

**Layer 1 — Unit tests for mock services:**
```python
class TestMockGmailService:
    def test_classify_inbox(self):
        svc = MockGmailService()
        emails = svc.list_messages()
        classified = svc.classify_inbox(emails)
        assert "act_now" in classified   # interface contract
```

**Layer 2 — API integration tests (mock mode):**
```python
def test_morning_briefing():
    resp = client.get("/api/dashboard/briefing")
    assert resp.status_code == 200
    assert "briefing" in resp.json()    # response shape contract
```

**Layer 3 — E2E (real APIs, requires credentials):**
Run manually with real `.env` configured — not part of CI.

### Why Mock-First?
- Tests run in 0.1s instead of 3-5s per test
- No credentials needed in CI/CD pipeline
- Tests never fail due to API rate limits or network issues
- Validates the interface contract without coupling to implementation

---

## Performance Decisions

### Frontend
- **Single-file components** — no code splitting needed for a single-page proposal
- **Framer Motion `once: true`** — scroll animations don't re-trigger, saving rAF cycles
- **CSS animations for orbs/rings** — GPU-composited `transform` + `opacity`, zero JS cost
- **`useMotionValue` not `useState`** — motion values don't trigger React re-renders

### Backend
- **Async parallel fetch** — Gmail + Calendar simultaneously on dashboard
- **Mock mode auto-detection** — no startup error if keys missing, immediate development
- **`max_results` caps** — Gmail limited to 20, Calendar to 30 — prevents slow responses
- **Body truncation** — `body[:2000]` before sending to Gemini prevents token waste

---

## Accessibility Implementation

Every section includes semantic HTML and ARIA:

```jsx
<section aria-labelledby="modules-heading">
  <h2 id="modules-heading">...</h2>
  
  <div role="table" aria-label="Evaluation criteria table">
    <div role="row">
      <span role="columnheader">Criterion</span>
    </div>
    <div role="row">
      <div role="cell">...</div>
    </div>
  </div>
  
  <button aria-label="Open menu">...</button>
  <div aria-hidden="true">  {/* decorative orbs */} </div>
</section>
```

**Focus styles:**
```css
:focus-visible {
  outline: 2px solid rgba(255,255,255,0.5);
  outline-offset: 2px;
}
```

Using `:focus-visible` (not `:focus`) — keyboard users see the outline, mouse users don't.

**Color contrast:** All body text uses `rgba(255,255,255,0.5)` minimum on pure black background — this is 7:1 contrast ratio, exceeding WCAG AA (4.5:1).

---

## Extending LifeSync AI

### Adding a New Google API Module

1. **Create the service file** (`backend/services/newapi_service.py`):
```python
class NewApiService:
    def __init__(self, credentials):
        self.service = build("newapi", "v1", credentials=credentials)
    
    def do_something(self) -> Dict:
        ...

class MockNewApiService:
    def do_something(self) -> Dict:
        return {"mock": "data"}
```

2. **Add the router** (`backend/routers/newapi_router.py`):
```python
router = APIRouter(prefix="/api/newapi")

@router.get("/endpoint")
async def endpoint(token_data = Depends(get_current_token_data)):
    svc = MockNewApiService() if USE_MOCK else NewApiService(creds)
    return svc.do_something()
```

3. **Register in `main.py`**:
```python
from routers.newapi_router import router as newapi_router
app.include_router(newapi_router)
```

4. **Add mock tests** in `tests/test_api.py`

5. **Add the scope** to `GOOGLE_SCOPES` in `.env.example`

### Adding a New Frontend Section

1. Create `src/components/NewSection.jsx`
2. Follow the scroll-reveal pattern with `whileInView` and `viewport={{ once: true }}`
3. Import and add to `App.jsx`

### Switching to Student Mode (v2)
The modular architecture means you can:
- Show only Calendar, Gmail, Tasks, and Gemini modules
- Hide Financial Pulse and Location Engine
- Surface assignment-specific email queries
- All without rebuilding — just conditional rendering based on a `mode` prop

---

*Technical documentation for LifeSync AI v1.0.0 — Built by Shanmukh Datta for HACK2SKILL Prompt Wars*
