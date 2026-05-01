# Au Platane

Site Astro pour le restaurant **Au Platane**.

## Lancer le projet

```bash
npm install
npm run dev
```

## Modifier le menu

Le site peut fonctionner de 2 façons.

### Option 1. Google Sheets

C’est l’option recommandée si vous ne voulez **pas utiliser Git** pour modifier le menu.

Le site sait lire une Google Sheet publique avec 3 onglets :

1. `Settings`
2. `Formules`
3. `Carte`

Il faut ensuite renseigner une seule variable d’environnement côté hébergement :

```bash
PUBLIC_GOOGLE_SHEET_ID=votre_id_google_sheet
```

Colonnes attendues :

#### Onglet `Settings`

| key | value |
| --- | --- |
| title | Menu du moment |
| period | Semaine du 24 avril |
| updated_at | 24 avril 2026 |
| intro | Carte courte et de saison |
| note | La carte change selon le marché |
| note | Une option végétarienne est disponible |

#### Onglet `Formules`

| name | price | description | active |
| --- | --- | --- | --- |
| Formule déjeuner | 24 € | Entrée, plat, dessert | 1 |
| Pause salon de thé | 8 € | Boisson chaude et douceur | 1 |

#### Onglet `Carte`

| section | item | price | description | active |
| --- | --- | --- | --- | --- |
| Entrées | Oeufs mimosa | 8 € | Paprika fumé et herbes fraîches | 1 |
| Entrées | Velouté de saison | 9 € | Huile d’olive et croûtons dorés | 1 |
| Plats | Volaille rôtie | 18 € | Jus réduit et pommes grenaille | 1 |
| Desserts | Tarte fine | 8 € | Fruits du jour | 1 |

Une fois la feuille publiée, vous modifiez simplement la Google Sheet et le site affiche les changements sans passer par Git.

### Option 2. Fichier local de secours

Si la Google Sheet n’est pas encore configurée, le site utilise [`src/data/menu.ts`](./src/data/menu.ts).

Vous pouvez y changer :

- `period` pour la semaine ou le jour affiché
- `updatedAt` pour la date de mise à jour
- `formulas` pour les formules
- `sections` pour les entrées, plats, desserts, boissons

## Publier la Google Sheet

Dans Google Sheets :

1. créez la feuille avec les 3 onglets
2. remplissez les colonnes indiquées ci-dessus
3. utilisez `Fichier > Partager > Publier sur le Web`
4. laissez la feuille accessible publiquement en lecture

## Variables d’environnement

Un exemple est fourni dans [`.env.example`](./.env.example).

Pour les reservations avec backend :

```bash
PUBLIC_RESERVATION_API_URL=http://127.0.0.1:8787
```

En production, cette variable doit pointer vers l'URL publique du backend reservations.
Le workflow GitHub Pages du projet la renseigne actuellement avec :

```bash
https://platane-production.up.railway.app
```

## Déploiement recommandé

Le plus simple :

1. stocker le code sur GitHub
2. connecter le dépôt à Vercel ou Netlify
3. laisser le déploiement automatique se faire à chaque mise à jour

### Pourquoi pas GitHub Pages seul ?

GitHub Pages fonctionne pour un site Astro statique, mais c’est moins pratique si vous voulez :

- un formulaire de contact réellement relié à un service d’envoi
- des previews automatiques par branche
- une configuration plus simple pour l’équipe

### Recommandation

- **GitHub** pour stocker le code
- **Vercel** ou **Netlify** pour l’hébergement

## Réservations avec backend

Le projet contient maintenant un backend separé dans [`backend/`](./backend) pour gerer :

- les demandes de reservation
- la capacite midi / soir
- le statut des reservations
- une page d'administration sur `/admin`

En local :

1. lancer le backend
2. lancer le front Astro
3. ouvrir `/admin`

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

```bash
npm run dev
```

L'URL du backend utilisee par le front se regle avec :

```bash
PUBLIC_RESERVATION_API_URL=http://127.0.0.1:8787
```

En production sur GitHub Pages, cette URL est injectee dans [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

Si vous voulez, la prochaine étape peut être :

- brancher un vrai formulaire d’envoi
- ajouter vos photos réelles
- connecter la Google Sheet réelle au site
