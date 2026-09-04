# Buy Marketplace

Application de marketplace composée d'un frontend Angular et d'un backend en microservices Spring Boot.

## Architecture

Le frontend communique avec l'API Gateway. Les services backend utilisent Eureka pour la découverte, MongoDB pour la persistance et Kafka pour les échanges asynchrones.

```text
Angular :4200
    |
API Gateway :8888
    |
    +-- Security Service :8084
    +-- User Service     :8081
    +-- Product Service  :8082
    +-- Media Service    :8083
    |
    +-- Eureka Discovery :8761
    +-- MongoDB           :27017
    +-- Kafka             :9092
```

## Prerequis

- Docker et Docker Compose
- Node.js et npm
- Java 17 pour lancer les services en dehors de Docker

## Demarrage

### 1. Configurer MongoDB

Depuis le dossier `backend`, créer un fichier `.env` :

```env
MONGO_USERNAME=admin
MONGO_PASSWORD=change-me
```

### 2. Demarrer le backend

```bash
cd backend
docker compose up -d --build
```

Vérifier l'état des conteneurs :

```bash
docker compose ps
```

Afficher les logs d'un service :

```bash
docker compose logs -f api-gateway
docker compose logs -f product-service
```

Arrêter les conteneurs :

```bash
docker compose down
```

Pour supprimer également les données MongoDB, utiliser `docker compose down -v`.

### 3. Demarrer le frontend

Dans un autre terminal :

```bash
cd frontend
npm install
npm start
```

L'application est ensuite disponible à l'adresse [http://localhost:4200](http://localhost:4200).

## Fonctionnalites principales

- Consultation des produits depuis la page d'accueil
- Inscription et connexion utilisateur
- Consultation et modification du profil
- Tableau de bord vendeur protégé par authentification
- Création, modification et suppression de produits
- Ajout et prévisualisation d'images produit
- Communication frontend via l'API Gateway sur le port `8888`

## Routes frontend

| Route | Accès |
| --- | --- |
| `/` | Public |
| `/register` | Public |
| `/login` | Public |
| `/profile` | Utilisateur connecté |
| `/dashboard` | Vendeur connecté |

## Tests et build

Frontend :

```bash
cd frontend
npm test
npm run build
```

Chaque microservice backend peut être testé et construit avec Maven :

```bash
cd backend/product-service
./mvnw test
./mvnw package
```

## Services et ports

| Service | Port |
| --- | ---: |
| Frontend Angular | `4200` |
| API Gateway | `8888` |
| Eureka Discovery | `8761` |
| User Service | `8081` |
| Product Service | `8082` |
| Media Service | `8083` |
| Security Service | `8084` |
| Kafka | `9092` |
| MongoDB | `27017` |