# CI/CD — Jenkins + Docker + Ngrok + GitHub + JUnit

## 📌 Objectif

Mettre en place une chaîne CI/CD locale reliant GitHub à un pipeline Jenkins qui build, teste et déploie des microservices via Docker.

```
GitHub → Webhook → Ngrok → Jenkins → Maven → JUnit → Docker → Microservices
```

---

## 🧠 Concept fondamental : 4 couches

```
┌─────────────────────────────────────┐
│  1. SOURCE                          │
│  Developer → Git → GitHub           │
└────────────────┬────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  2. TRIGGER                         │
│  GitHub → Webhook → Ngrok → Jenkins │
└────────────────┬────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  3. CI/CD                           │
│  Jenkins → Maven → JUnit → Docker   │
└────────────────┬────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  4. APPLICATION                     │
│  Docker Compose → Microservices     │
│  Gateway / Eureka / Services / DB   │
└─────────────────────────────────────┘
```

**Phrase-clé à mémoriser :**
> GitHub déclenche → Webhook informe → Ngrok transporte → Jenkins orchestre → Maven compile → JUnit teste → Docker construit → Compose déploie.

---

## 🧩 Rôle de chaque élément

| Élément | Rôle |
|---|---|
| **GitHub** | Stocke le code source + les Pull Requests |
| **Webhook** | Le déclencheur — prévient Jenkins qu'un événement (push/PR) a eu lieu |
| **Ngrok** | Crée un tunnel Internet → `localhost:8080` (ne fait *que* transporter) |
| **Jenkins** | L'orchestrateur — le "cerveau" du pipeline |
| **Jenkinsfile** | Décrit les étapes du pipeline (as code) |
| **Maven** | Compile le projet Java |
| **JUnit** | Exécute les tests — sert de barrière avant le build/déploiement |
| **Docker CLI** | Le client Docker (présent dans Jenkins) — envoie les commandes |
| **Docker Engine** | Exécute réellement les commandes (dans le conteneur `jenkins-docker`) |
| **Docker Compose** | Lance plusieurs conteneurs ensemble (microservices + bases de données) |
| **Microservices** | L'application finale en production |

---

## 🔌 Comment la communication se passe (technique)

### Docker CLI ↔ Docker Engine
Ce sont deux programmes séparés qui communiquent via une **API REST/HTTP** — pas de magie locale. Comme Jenkins et le Docker Engine sont dans deux conteneurs différents, la communication passe par le réseau plutôt que par le socket local `/var/run/docker.sock`.

### Le réseau Docker (DNS interne)
```bash
docker network create jenkins
```
En lançant `jenkins-docker` avec `--network-alias docker`, Docker crée une entrée DNS interne : le nom `docker` pointe vers l'IP du conteneur — d'où `DOCKER_HOST=tcp://docker:2376`.

### Le port 2376 (API Docker en TCP)
`docker:dind` expose son API Docker en TCP sur le port 2376. Chaque commande (`docker build`, `docker run`...) devient un appel HTTP (`POST /build`, etc.) reçu et exécuté par le Docker Engine distant.

### mTLS (mutual TLS)
Exposer l'API Docker sur le réseau est risqué, donc TLS mutuel est obligatoire :
- Le serveur (Engine) prouve son identité au client
- Le client (Jenkins) prouve aussi la sienne au serveur
- Sans certificat client valide → connexion refusée, même port ouvert

Variables clés côté Jenkins :
```
DOCKER_HOST=tcp://docker:2376     → où envoyer les requêtes
DOCKER_CERT_PATH=/certs/client    → où trouver ses certificats
DOCKER_TLS_VERIFY=1               → force la vérification TLS
```

### Webhook/Ngrok (HTTP classique)
GitHub envoie un `POST` HTTP vers l'URL publique Ngrok. Ngrok maintient un tunnel persistant vers l'agent local, qui relaie la requête vers `localhost:8080`. Jenkins expose un endpoint `/github-webhook/` qui parse le JSON et déclenche le job.

---

## 🛠️ Étapes d'installation

### 1. Créer le réseau Docker
```bash
docker network create jenkins
```

### 2. Lancer Docker-in-Docker (le moteur)
```bash
docker run \
  --name jenkins-docker \
  --rm \
  --detach \
  --privileged \
  --network jenkins \
  --network-alias docker \
  --env DOCKER_TLS_CERTDIR=/certs \
  --volume jenkins-docker-certs:/certs/client \
  --volume jenkins-data:/var/jenkins_home \
  docker:dind \
  --storage-driver overlay2
```

### 3. Construire l'image Jenkins personnalisée

`Dockerfile` :
```dockerfile
FROM jenkins/jenkins:2.568.3-jdk21

USER root

# Installation des prérequis et du CLI Docker
RUN apt-get update && apt-get install -y lsb-release ca-certificates curl && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Installation de Node.js, Angular CLI et Chromium pour les tests
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs chromium && \
    npm install -g @angular/cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

USER jenkins

# Installation des plugins Jenkins nécessaires
RUN jenkins-plugin-cli --plugins "blueocean docker-workflow json-path-api"
```

```bash
docker build -t myjenkins-blueocean:2.568.3-1 .
```

### 4. Lancer Jenkins
```bash
docker run \
  --name jenkins-blueocean \
  --restart=on-failure \
  --detach \
  --network jenkins \
  --env DOCKER_HOST=tcp://docker:2376 \
  --env DOCKER_CERT_PATH=/certs/client \
  --env DOCKER_TLS_VERIFY=1 \
  --publish 8080:8080 \
  --publish 50000:50000 \
  --volume jenkins-data:/var/jenkins_home \
  --volume jenkins-docker-certs:/certs/client:ro \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  myjenkins-blueocean:2.568.3-1
```
→ Jenkins accessible sur `http://localhost:8080`

### 5. Installer et authentifier Ngrok
```bash
cd ~
curl -O https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
mkdir -p ~/.local/bin
mv ngrok ~/.local/bin/
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
ngrok config add-authtoken <TON_TOKEN>
```

### 6. Créer le tunnel Ngrok
```bash
ngrok http 8080
```
→ génère une URL publique type `https://xxxxx.ngrok-free.app`

### 7. Configurer le Webhook GitHub
Dans **Repository → Settings → Webhooks → Add webhook** :
```
https://xxxxx.ngrok-free.app/github-webhook/
```

### 8. Écrire le Jenkinsfile
```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh './mvnw clean test'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t product-service .'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}
```

---

## 📂 Les volumes Jenkins

| Volume | Chemin monté | Rôle |
|---|---|---|
| `jenkins-data` | `/var/jenkins_home` | Jobs, plugins, configurations, credentials, workspaces |
| `jenkins-docker-certs` | `/certs/client` | Certificats TLS pour communiquer avec Docker Engine |

---

## 🔄 Flow complet d'une Pull Request

```
Developer
   ↓ git push
GitHub
   ↓ Webhook
Ngrok
   ↓
Jenkins (Checkout → Maven → JUnit)
   ↓
   ├── JUnit ❌ → Pipeline FAILED (stop)
   └── JUnit ✅ → Docker Build → Docker Image → Docker Compose → Microservices
```

---

## ⚡ Points essentiels à ne jamais oublier

1. **Docker CLI ≠ Docker Engine** : le CLI est un client, l'Engine exécute réellement — ils communiquent en HTTP/TLS, pas par magie locale.
2. **`--network-alias docker`** crée une entrée DNS interne au réseau `jenkins`, c'est ce qui rend `tcp://docker:2376` valide.
3. **mTLS** : authentification dans les deux sens (client ET serveur) avant toute communication Docker.
4. **Ngrok ne lance rien** : il ne fait que transporter le trafic HTTP entre Internet et `localhost:8080`.
5. **JUnit est une barrière** : en cas d'échec, le pipeline s'arrête avant le Docker Build.
6. Séparer Jenkins et le Docker Engine dans deux conteneurs distincts = **isolation/sécurité** — éviter qu'un pipeline compromis contrôle directement la machine hôte.

---

## 🌿 Best Practice — Tester la PR + `main` avant ET après le merge

Objectif : couvrir le cycle complet — valider le code avant la fusion, puis valider `main` après la fusion réelle.

### 1. Discover branches
**→ `All branches`**

Garantit que `main` est toujours scannée et rebuildée indépendamment des PR — c'est ce qui couvre la phase **après le merge**.

### 2. Discover pull requests from origin
**→ `Merging the pull request with the current target branch revision`**

Simule le merge et build ce résultat — donc détecte les problèmes **avant** de fusionner réellement. Couvre la phase **avant le merge**.

⚠️ Éviter `Both` sauf besoin réel de tester aussi la PR isolée — ça double les builds sans forcément apporter de valeur ici.

### 3. Couvrir "après le merge" concrètement
- `All branches` couvre déjà `main`
- Vérifier que le Webhook GitHub envoie bien l'événement **push** (pas seulement `pull_request`) — dans **GitHub → Settings → Webhooks**, cocher *"Just the push event"* ou *"Send me everything"*

Résultat : dès que la PR est mergée dans `main`, GitHub envoie un `push` → Jenkins redétecte `main` → rebuild automatique.

### Résumé

| Phase | Configuration | Résultat |
|---|---|---|
| **Avant merge** | Discover PR → `Merging with target branch` | Teste PR + `main` fusionnés virtuellement |
| **Après merge** | Discover branches → `All branches` + Webhook sur `push` | Rebuild automatique de `main` après le merge réel |

### Bonus — Jenkinsfile : distinguer PR vs `main`

Utiliser `env.CHANGE_ID` (présent seulement pour les PR) pour éviter par exemple de déployer à chaque PR :

```groovy
stage('Deploy') {
    when {
        expression { env.CHANGE_ID == null } // seulement sur main, pas sur PR
    }
    steps {
        sh 'docker compose up -d'
    }
}
```