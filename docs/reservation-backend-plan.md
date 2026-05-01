# Reservation backend plan

Option retenue : garder le site Astro statique et brancher un backend separe.

## Ce que cela change

- le site public reste heberge comme aujourd'hui
- le backend reservation est deploye a part
- la base de donnees devient la source de verite
- on peut refuser automatiquement une reservation si le service est complet

## Sequence recommandee

1. Creer une base PostgreSQL
2. Deployer ce dossier `backend/`
3. Configurer les variables d'environnement
4. Remplacer Tally par un vrai formulaire qui appelle l'API
5. Ajouter un mini back-office admin

## Hebergements simples

- Base de donnees : Supabase Postgres ou Neon
- Backend : Render, Railway ou Fly.io

## Variables d'environnement

```bash
DATABASE_URL=postgresql://...
PORT=8787
FRONTEND_ORIGIN=https://auplatane.com
ADMIN_TOKEN=un-secret-long
```

## Endpoints a utiliser cote front

- `GET /reservations/availability`
- `POST /reservations`

## Endpoints a utiliser cote admin

- `GET /admin/reservations`
- `PATCH /admin/reservations/:id/status`
- `PUT /admin/capacities`
