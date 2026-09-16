# 🛒 Buy-01 - Plateforme E-Commerce Microservices

**Buy-01** est une application web e-commerce moderne, scalable et basée sur une architecture distribuée en microservices. Le projet intègre une communication asynchrone guidée par les événements (Event-Driven Architecture) via Apache Kafka, un API Gateway réactif avec authentification JWT/RSA, ainsi qu'une interface utilisateur moderne développée sous Angular.

---

## 🌟 Architecture & Fonctionnalités Clés

- **Architecture Microservices** : Découpage clair par domaines métier (Security, User, Product, Media, Discovery).
- **Service Discovery** : Registre de services géré par **Netflix Eureka Discovery Server**.
- **API Gateway réactif** : Point d'entrée unique gérant le routage, le filtrage de la sécurité et la propagation des tokens JWT.
- **Sécurité Asymétrique RSA / JWT** : Signature et vérification des jetons d'accès JWT via paires de clés RSA (Public/Private Keys).
- **Communication Event-Driven (Apache Kafka)** : Publication et consommation d'événements asynchrones entre services (`UserCreatedEvent`, `MediaCreatedEvent`, etc.).
- **Gestion des Médias via Cloudinary** : Stockage cloud d'images/médias avec synchronisation asynchrone des références produits/profils.
- **Base de Données MongoDB** : Persistance NoSQL flexible pour chaque microservice.
- **CI/CD Pipeline** : Automatisation complète du build, des tests et du déploiement via **Jenkins**, **Docker** et **Docker Compose**.

---

## 🏗️ Structure du Projet

```text
buy-01-main/
├── backend/
│   ├── api-gateway/         # Gateway Spring Cloud (Port 8888) - Routage & Sécurité JWT
│   ├── discovery-service/   # Serveur Eureka Discovery (Port 8761)
│   ├── security-service/    # Microservice d'Authentification (Port 8080) - RSA, JWT, Refresh Tokens
│   ├── user-service/        # Microservice Gestion des Utilisateurs (Port 8080)
│   ├── product-service/     # Microservice Gestion du Catalogue Produits (Port 8080)
│   ├── media-service/       # Microservice Médias & Cloudinary (Port 8080)
│   └── docker-compose.yml   # Orchestration Docker (MongoDB, Kafka, Microservices)
├── frontend/                # Application Single Page (SPA) développée avec Angular
├── Jenkinsfile              # Pipeline de CI/CD automatisé Jenkins
└── Mr-Jenkins.md            # Guide de configuration du serveur CI/CD Jenkins
```

---

## 🛠️ Stack Technique

### **Backend**
- **Framework** : Java 17+, Spring Boot 3, Spring Cloud Gateway, Spring Data MongoDB, Spring Security
- **Messaging / Event Broker** : Apache Kafka
- **Service Discovery** : Spring Cloud Netflix Eureka
- **Stockage Cloud** : Cloudinary API
- **Sécurité** : JWT, Clés RSA (PKCS8 / X.509)

### **Frontend**
- **Framework** : Angular 17+ / TypeScript
- **Tests** : Jasmine & Karma

### **DevOps & Infrastructure**
- **Conteneurisation** : Docker, Dockerfiles multi-stage
- **Orchestration** : Docker Compose
- **CI/CD** : Jenkins Automation Server

---

## 🚀 Guide de Démarrage Rapide

### **Préréquis**
- **Java 17 JDK** ou version ultérieure
- **Node.js** (v18+) et **Angular CLI**
- **Docker** et **Docker Compose**

---

### **1. Démarrage des Services via Docker Compose**

Pour lancer l'ensemble de l'infrastructure backend (Bases de données MongoDB, Kafka, et tous les microservices Spring Boot) :

```bash
cd backend
docker-compose up --build -d
```

---

### **2. Ports & Endpoints des Services**

| Service | Port | Description / URL |
| :--- | :--- | :--- |
| **Eureka Discovery** | `8761` | [http://localhost:8761](http://localhost:8761) |
| **API Gateway** | `8888` | Entrypoint principal : [http://localhost:8888](http://localhost:8888) |
| **Security Service** | `8080` | Authentification & Clés RSA |
| **User Service** | `8080` | Gestion des profils utilisateurs |
| **Product Service** | `8080` | Catalogue produits |
| **Media Service** | `8080` | Upload & gestion d'images |
| **Frontend Angular** | `4200` | Interface utilisateur SPA |

---

### **3. Démarrage du Frontend (Angular)**

Dans un nouveau terminal :

```bash
cd frontend
npm install
ng serve --open
```
L'application frontend sera accessible sur `http://localhost:4200`.

---

## ⚙️ Configuration CI/CD (Jenkins)

Le fichier `Jenkinsfile` inclut un pipeline de livraison continue structuré de la manière suivante :
1. **Checkout** : Récupération du code source.
2. **Build Backend** : Compilation Maven et exécution des tests unitaires (`JUnit 5`, `Mockito`).
3. **Build Frontend** : Validation et build Angular.
4. **Dockerization** : Création des images Docker et déploiement automatisé.

Consultez le fichier [`Mr-Jenkins.md`](./Mr-Jenkins.md) pour les détails relatifs à la configuration des agents Jenkins.