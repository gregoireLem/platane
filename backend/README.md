# Backend reservations

Ce dossier contient un backend separe pour gerer les reservations du site Au Platane.

## Stack

- `Express` pour l'API HTTP
- `Prisma` pour l'acces base de donnees
- `PostgreSQL` pour stocker reservations et capacites
- `Zod` pour valider les requetes

## Endpoints

### Public

- `GET /health`
- `GET /content/editorial`
- `GET /reservations/availability?date=2026-05-01&service=soir`
- `POST /reservations`

Exemple de payload :

```json
{
  "name": "Albert",
  "phone": "0600000000",
  "email": "albert@example.com",
  "reservationDate": "2026-05-01",
  "reservationTime": "19:30",
  "service": "soir",
  "partySize": 4,
  "message": "Terrasse si possible"
}
```

### Admin

Les routes admin utilisent une session HTTP-only creee par `POST /admin/login`.

- `POST /admin/login`
- `POST /admin/logout`
- `GET /admin/me`
- `GET /admin/content`
- `PUT /admin/content/editorial`
- `POST /admin/events`
- `PUT /admin/events/:id`
- `DELETE /admin/events/:id`
- `POST /admin/gallery`
- `PUT /admin/gallery/:id`
- `DELETE /admin/gallery/:id`
- `GET /admin/reservations`
- `PATCH /admin/reservations/:id/status`
- `PUT /admin/capacities`
- `GET /admin/schedules`
- `PUT /admin/schedules`

Exemple de login :

```json
{
  "username": "admin",
  "password": "mot-de-passe"
}
```

Exemple mise a jour statut :

```json
{
  "status": "CONFIRMED",
  "notes": "Client rappelle pour une chaise bebe"
}
```

Exemple capacite :

```json
{
  "date": "2026-05-01",
  "service": "soir",
  "capacity": 40,
  "isClosed": false,
  "note": "Salle privee reservee"
}
```

## Demarrage local

1. Copier `backend/.env.example` vers `backend/.env`
2. Renseigner `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` et `FRONTEND_ORIGINS`
3. Installer les dependances dans `backend/`
4. Generer Prisma puis lancer les migrations
5. Lancer le serveur

Commandes :

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Mise en ligne

Le backend peut etre deploye sur Render, Railway ou Fly.io.
Le script `npm start` applique les migrations Prisma avec `prisma migrate deploy` avant de lancer l'API.

Variables a configurer en production :

```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
PORT=8787
FRONTEND_ORIGINS=https://auplatane.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=un-mot-de-passe-tres-long
ADMIN_SESSION_SECRET=un-secret-de-session-tres-long-et-unique
```

Une fois le backend publie, recopiez son URL publique dans le front Astro via :

```bash
PUBLIC_RESERVATION_API_URL=https://votre-backend.example.com
```

L'interface d'administration du site appellera alors ce backend public.

## Comportement metier

- Capacite par defaut : `30` pour midi, `40` pour soir
- Les reservations `PENDING` et `CONFIRMED` bloquent deja des places
- Une reservation `DECLINED`, `CANCELLED` ou `NO_SHOW` ne bloque plus de places

## Brancher le front Astro

Le formulaire du site doit appeler `POST /reservations` au lieu de Tally.
Le front peut aussi appeler `GET /reservations/availability` pour afficher un message du type "complet" avant soumission.
