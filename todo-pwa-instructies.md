# 📋 Bouw je eigen TickTick PWA — Instructiegids

> Stack: Next.js · Supabase · Tailwind CSS · Vercel · n8n API

---

## 🗺️ Overzicht

```
iPhone (PWA)
    ↓ gebruikt
Next.js app (Vercel)
    ↓ praat met
Supabase (database + auth + REST API)
    ↑ ook gebruikt door
n8n (automatische workflows)
```

---

## 1. Voorbereiding — Accounts aanmaken

Maak gratis accounts aan op:

- **GitHub** → [github.com](https://github.com) — slaat je code op
- **Supabase** → [supabase.com](https://supabase.com) — database + auth + API
- **Vercel** → [vercel.com](https://vercel.com) — publiceert je app

---

## 2. Supabase instellen

### 2a. Nieuw project aanmaken
1. Log in op Supabase
2. Klik **New Project**
3. Kies regio: **West EU (Frankfurt)** (voor AVG/GDPR)
4. Bewaar het **database wachtwoord** op een veilige plek

### 2b. Tabellen aanmaken

Ga naar **SQL Editor** in Supabase en voer dit uit:

```sql
-- Gebruikers worden automatisch beheerd door Supabase Auth

-- Lijsten (zoals "Werk", "Privé")
CREATE TABLE lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Taken
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority INT DEFAULT 0, -- 0=geen, 1=laag, 2=medium, 3=hoog
  tags TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  recurring TEXT, -- bijv. 'daily', 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (alleen jouw eigen data zichtbaar)
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen lijsten" ON lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Eigen taken" ON tasks
  FOR ALL USING (auth.uid() = user_id);
```

### 2c. API sleutels bewaren
Ga naar **Project Settings → API** en noteer:
- `Project URL` → bijv. `https://xyz.supabase.co`
- `anon public key` → lange string
- `service_role key` → voor n8n gebruik (geheim houden!)

---

## 3. Claude Code prompt — App bouwen

Ga naar [claude.ai](https://claude.ai) → Claude Code.

Maak een nieuwe GitHub repository aan (bijv. `mijn-todo-app`) en geef Claude Code deze prompt:

---

```
Bouw een PWA todo-app vergelijkbaar met TickTick.

Stack:
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (database + auth)
- TypeScript

Functionaliteit:
- Inloggen via Supabase Auth (email + wachtwoord)
- Taken aanmaken met: titel, beschrijving, deadline, prioriteit (geen/laag/medium/hoog), tags, lijst
- Lijsten/projecten beheren (naam + kleur)
- Taken filteren op: vandaag, aankomend, per lijst, per tag
- Taken als voltooid markeren
- Donkere modus

PWA vereisten:
- manifest.json met app naam, icoon, theme color
- Service worker voor offline support
- Installeerbaar op iOS via Safari

API endpoints (voor n8n integratie):
- POST /api/tasks — taak aanmaken
- GET /api/tasks — taken ophalen (query params: list_id, completed, due_before)
- PATCH /api/tasks/[id] — taak updaten
- DELETE /api/tasks/[id] — taak verwijderen
- Authenticatie via Bearer token (Supabase service role key)

Environment variables die ik zal toevoegen:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Verbind met mijn GitHub repository en zorg dat alles klaar is voor deployment op Vercel.
```

---

## 4. Vercel deployment

1. Ga naar [vercel.com](https://vercel.com) → **New Project**
2. Importeer je GitHub repository
3. Voeg **Environment Variables** toe:
   - `NEXT_PUBLIC_SUPABASE_URL` = jouw Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = jouw anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = jouw service role key
4. Klik **Deploy**

Je krijgt een URL zoals `mijn-todo-app.vercel.app`

---

## 5. Installeren op iPhone

1. Open de Vercel-URL in **Safari** op je iPhone
2. Tik op het **Deel-icoon** (vierkant met pijltje omhoog)
3. Kies **"Zet op beginscherm"**
4. De app staat nu op je homescreen als een echte app

---

## 6. n8n integratie

### Basis: taak aanmaken vanuit n8n

Gebruik een **HTTP Request** node in n8n:

```
Method: POST
URL: https://jouw-app.vercel.app/api/tasks
Headers:
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  Content-Type: application/json

Body (JSON):
{
  "title": "{{ $json.title }}",
  "description": "{{ $json.description }}",
  "due_date": "{{ $json.due_date }}",
  "priority": 2,
  "tags": ["n8n", "automatisch"],
  "list_id": "uuid-van-je-lijst"
}
```

### Voorbeeldworkflows die je kunt bouwen

| Trigger | Actie |
|---|---|
| E-mail ontvangen met label "actie" | Taak aanmaken met deadline |
| Dagelijks om 08:00 | Taken van vandaag ophalen en sturen via Teams |
| Planner-taak aangemaakt | Gespiegeld aanmaken in jouw todo-app |
| Taak voltooid in app | Notificatie sturen of archiveren elders |

### Taken ophalen in n8n

```
Method: GET
URL: https://jouw-app.vercel.app/api/tasks?completed=false&due_before=2026-04-25
Headers:
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

---

## 7. Beveiliging

Standaard is je app bereikbaar voor iedereen met de URL, maar:

- **Inloggen is verplicht** — Supabase Auth zorgt dat alleen jij bij jouw taken kan
- Niemand kan data van anderen zien (Row Level Security in stap 2b)
- De API endpoints vereisen de service role key (geheim houden)
- Deel de Vercel-URL alleen met mensen die mogen inloggen

---

## 8. Uitbreidingen (later)

Vertel Claude Code gewoon wat je wil toevoegen:

- *"Voeg herhaaltaken toe (dagelijks, wekelijks)"*
- *"Maak een Pomodoro-timer per taak"*
- *"Voeg notificaties toe via de browser Push API"*
- *"Maak een weekoverzicht dashboard"*
- *"Integreer met mijn Highberg Teams Planner via n8n"*

---

## Snelreferentie

| Wat | Waar |
|---|---|
| Code aanpassen | Claude Code → GitHub auto-sync |
| Database bekijken | Supabase → Table Editor |
| App live zien | Vercel dashboard |
| n8n flows | Jouw n8n instance |
| App op iPhone | Homescreen icoon |

---

*Gegenereerd met Claude — april 2026*
