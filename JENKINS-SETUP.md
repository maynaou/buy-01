# Configuration Jenkins — buy-01 (e-commerce microservices)

Ce document explique comment Jenkins a été installé et configuré pour le pipeline CI/CD du projet `buy-01` (6 services Spring Boot + frontend Angular).

## 1. Prérequis

- Docker installé sur la machine
- Un compte GitHub avec accès au repo `maynaou/buy-01`
- Un compte [ngrok](https://dashboard.ngrok.com/) (gratuit) pour exposer Jenkins à Internet

## 2. Installation de Jenkins (Docker-in-Docker)

Cette approche permet à Jenkins de lancer lui-même des builds Docker (pour construire les images des 6 services) depuis l'intérieur d'un conteneur.

### 2.1 Créer le réseau Docker dédié

```bash
docker network create jenkins
```

### 2.2 Lancer le conteneur Docker-in-Docker

Ce conteneur fournit un démon Docker isolé, utilisable uniquement par Jenkins :

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
  --publish 2376:2376 \
  docker:dind
```

### 2.3 Construire l'image Jenkins personnalisée

Jenkins a besoin du CLI Docker et du plugin Blue Ocean. Créer un fichier `Dockerfile` :

```dockerfile
FROM jenkins/jenkins:2.568.3-jdk17
USER root
RUN apt-get update && apt-get install -y lsb-release
RUN curl -fsSLo /usr/share/keyrings/docker-archive-keyring.asc \
  https://download.docker.com/linux/debian/gpg
RUN echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/usr/share/keyrings/docker-archive-keyring.asc] \
  https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
RUN apt-get update && apt-get install -y docker-ce-cli
USER jenkins
RUN jenkins-plugin-cli --plugins "blueocean docker-workflow"
```

Puis construire l'image :

```bash
docker build -t myjenkins-blueocean:2.568.3-1 .
```

### 2.4 Lancer le conteneur Jenkins

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
  myjenkins-blueocean:2.568.3-1
```

Jenkins est ensuite accessible sur `http://localhost:8080`.

## 3. Premier démarrage — mot de passe admin (résumé)

1. Ouvrir `http://localhost:8080` dans le navigateur
2. Jenkins demande un mot de passe de déblocage → le récupérer avec :
   ```bash
   docker exec jenkins-blueocean cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. Coller ce mot de passe dans la page
4. Cliquer **Install suggested plugins**
5. Créer le compte admin définitif (nom d'utilisateur + mot de passe de ton choix)

## 4. Créer un item — Multibranch Pipeline (résumé)

1. Dashboard Jenkins → **New Item**
2. Nom de l'item → sélectionner **Multibranch Pipeline** → **OK**
3. Section **Branch Sources** → **Add** → **GitHub**
4. Renseigner le repo : `maynaou/buy-01` + les credentials GitHub (voir section 5)
5. Dans **Behaviours**, ajouter **Discover pull requests from origin** (strategy: *The current pull request revision*)
6. **Save** → Jenkins scanne le repo et crée automatiquement une branche de build pour `main` (là où se trouve le `Jenkinsfile`)

## 5. Connexion à GitHub

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens (classic)** → **Generate new token**
   - Scopes : `repo`, `admin:repo_hook`
2. Dans Jenkins : **Manage Jenkins → System → GitHub → Add GitHub Server**
   - Credentials → **Add** → type **Secret text** → coller le token
   - Cocher **Manage hooks**
   - **Test connection**

## 6. Exposer Jenkins avec ngrok

Jenkins tourne en local — GitHub doit pouvoir l'atteindre depuis Internet.

```bash
# Récupérer le token sur https://dashboard.ngrok.com/
ngrok config add-authtoken <TON_TOKEN>
ngrok http 8080
```

Copier l'URL générée (`https://xxxx.ngrok-free.dev`) dans **Manage Jenkins → System → Jenkins Location → Jenkins URL**.

⚠️ Avec le plan gratuit, cette URL change à chaque redémarrage de ngrok — il faut la remettre à jour à chaque fois.

## 7. Webhook GitHub

Avec **Manage hooks** coché (étape 5), Jenkins crée le webhook automatiquement lors du scan (**Scan Multibranch Pipeline Now**).

Vérification manuelle : GitHub → repo → **Settings → Webhooks**, une entrée doit pointer vers :
```
https://<url-ngrok>/github-webhook/
```
avec les events **Pushes** et **Pull requests** actifs.

## 8. Test

1. Pousser un commit sur `main`, ou ouvrir une Pull Request
2. GitHub → **Settings → Webhooks → Recent Deliveries** → vérifier une réponse `200`
3. Jenkins → le build démarre automatiquement en quelques secondes
