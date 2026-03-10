# Altiora Chatbot — Angular 17

Interface de chatbot RH connectée à l'API `api-poc-altiora`.

## Stack
- **Angular 17** — standalone components + signals
- **Backend** : `http://localhost:8000` (api-poc-altiora)
- **Web Speech API** — STT (fr-FR) + TTS natif navigateur
- **Docker / Nginx** — prêt production

---

## Prérequis

Le backend doit tourner sur `http://localhost:8000` :
```bash
cd api-poc-altiora
docker compose up -d
curl http://localhost:8000/health   # → {"status":"ok"}
```

---

## Lancer en développement

```bash
npm install
npm start
# → http://localhost:4200
# Le proxy Angular redirige /api/* → http://localhost:8000/*
```

---

## Build + Docker (production)

```bash
# Build Angular
npm run build

# Docker
docker build -t altiora-chatbot .
docker run -p 8080:80 altiora-chatbot
# → http://localhost:8080
```

> ⚠️ En production Docker, l'API doit être accessible depuis le navigateur client.
> Configurez la variable `BASE` dans `src/app/services/api.service.ts` ou
> utilisez un reverse proxy nginx pour `/api → http://backend:8000`.

---

## Authentification

En mode démo, l'utilisateur remplit un formulaire :

| Champ | Valeur |
|-------|--------|
| Nom complet | ex: Jean Dupont |
| Email | ex: jean.dupont@altiora.com |
| Département | RH / FINANCE / ENGINEERING / DIRECTION |
| Niveau d'accès | `public` ou `restricted` |

Ces valeurs deviennent les headers HTTP envoyés à l'API :
- `x-user-name`, `x-user-email`, `x-user-department`, `x-user-max-classification`

En production, ils seront extraits du **JWT Azure AD** par le middleware backend.

---

## Endpoints utilisés

| Endpoint | Usage |
|----------|-------|
| `GET /health` | — |
| `POST /chat` | Envoi message → réponse LLM + sources CVs |
| `GET /session` | Chargement historique au login |
| `DELETE /session` | Nouveau chat — efface Redis |

---

## Structure

```
src/app/
├── models/
│   ├── user.model.ts       UserProfile, Classification
│   ├── api.model.ts        ChatResponse, CVResult, SessionHistory
│   └── message.model.ts    Message (avec sources)
├── services/
│   ├── auth.service.ts     État utilisateur + headers HTTP
│   ├── api.service.ts      Appels HTTP réels vers le backend
│   ├── chat.service.ts     État du chat (signals)
│   └── speech.service.ts   STT / TTS Web Speech API
└── components/
    ├── login/              Page de connexion (formulaire + faux Azure AD)
    ├── sidebar/            Sidebar avec session active + conversations passées
    ├── chat/               Zone de messages + sources CVs + saisie
    └── search-modal/       Recherche dans les conversations
```
