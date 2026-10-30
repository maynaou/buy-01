# 🔎 SonarQube — Analyse de qualité du code

SonarQube est intégré au pipeline CI/CD de **Buy-01** pour analyser automatiquement la qualité et la sécurité du code avant le déploiement.

```text
GitHub
   ↓
Jenkins
   ↓
Tests
   ↓
JaCoCo / LCOV
   ↓
SonarQube
   ↓
Quality Gate
   ↓
Deploy
```

---

## 🏗️ Projets analysés

Chaque microservice backend possède son propre projet SonarQube :

| Service             | Projet SonarQube           |
| ------------------- | -------------------------- |
| `api-gateway`       | `buy-01-api-gateway`       |
| `discovery-service` | `buy-01-discovery-service` |
| `security-service`  | `buy-01-security-service`  |
| `user-service`      | `buy-01-user-service`      |
| `product-service`   | `buy-01-product-service`   |
| `media-service`     | `buy-01-media-service`     |
| `frontend`          | `buy-01-frontend`          |

SonarQube permet ainsi de suivre séparément les métriques de chaque composant.

---

## 🧪 Backend — Maven + JaCoCo

Les tests Java sont exécutés avec Maven :

```bash
./mvnw clean test
```

**Surefire** génère les rapports de tests :

```text
target/surefire-reports/*.xml
```

**JaCoCo** mesure la couverture du code et génère :

```text
target/site/jacoco/jacoco.xml
```

Le pipeline transmet ensuite ce rapport à SonarQube :

```bash
-Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

### Flow

```text
Maven Test
    │
    ├── Surefire → JUnit XML → Jenkins
    │
    └── JaCoCo → jacoco.xml → SonarQube
```

---

## 🖥️ Frontend — Angular

Les tests Angular sont exécutés avec :

```bash
npm ci
npm test -- --watch=false
```

La couverture est générée dans :

```text
coverage/lcov.info
```

SonarQube utilise ce fichier avec :

```bash
-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```

---

## 🔍 Analyse SonarQube

### Backend

Le scanner Maven est utilisé :

```bash
./mvnw org.sonarsource.scanner.maven:sonar-maven-plugin:sonar
```

Chaque service utilise une clé différente :

```text
buy-01-api-gateway
buy-01-user-service
buy-01-product-service
...
```

### Frontend

Le scanner SonarQube est exécuté avec :

```bash
npx sonar-scanner
```

Configuration principale :

```text
sonar.sources=src
sonar.exclusions=**/node_modules/**,**/dist/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

---

## 🚦 Quality Gate

Le **Quality Gate** permet de définir les conditions minimales que le code doit respecter.

Exemple de conditions utilisées :

```text
New Code Issues          = 0
New Code Coverage        >= 80%
New Code Duplication     <= 3%
Security conditions      respectées
```

Après l'analyse, Jenkins attend le résultat :

```groovy
timeout(time: 5, unit: 'MINUTES') {
    waitForQualityGate abortPipeline: true
}
```

### Résultat

```text
              SonarQube
                  │
            Quality Gate
             /         \
            /           \
        PASSED          FAILED
          │                │
          ▼                ▼
     Pipeline           Pipeline
     continue             stop
```

`waitForQualityGate` ne lance pas les tests et ne calcule pas la couverture. Il attend simplement le résultat produit par SonarQube.

---

## 📊 Quality Profile vs Quality Gate

### Quality Profile

Définit **les règles d'analyse**.

```text
Quality Profile
      ↓
Rules
      ↓
Bugs / Vulnerabilities / Code Smells
```

### Quality Gate

Définit **les conditions de validation**.

```text
Analysis
   ↓
Metrics
   ↓
Quality Gate
   ↓
Passed / Failed
```

> **Quality Profile = quelles règles appliquer ?**
> **Quality Gate = est-ce que le résultat respecte les conditions ?**

---

## 🔐 Intégration avec Jenkins

Jenkins utilise la configuration SonarQube définie sous le nom :

```text
SonarQube
```

Dans le pipeline :

```groovy
withSonarQubeEnv('SonarQube') {
    sh '...'
}
```

Puis :

```groovy
waitForQualityGate abortPipeline: true
```

Le pipeline suit donc cette logique :

```text
Jenkins
   │
   ▼
Run Tests
   │
   ▼
Generate Coverage
   │
   ▼
Sonar Scanner
   │
   ▼
SonarQube
   │
   ▼
Quality Gate
   │
   ├── PASSED → Continue
   │
   └── FAILED → Stop
```

---

## 📁 Rapports importants

| Rapport                  | Généré par             | Utilisé par |
| ------------------------ | ---------------------- | ----------- |
| `surefire-reports/*.xml` | Maven Surefire         | Jenkins     |
| `jacoco.xml`             | JaCoCo                 | SonarQube   |
| `lcov.info`              | Angular/Karma Coverage | SonarQube   |

---

## 🧠 Points essentiels

1. **Surefire** → résultats des tests Java.
2. **JaCoCo** → couverture des tests Java.
3. **LCOV** → couverture frontend Angular.
4. **Sonar Scanner** → analyse et transmet les résultats à SonarQube.
5. **SonarQube** → analyse, stocke les métriques et calcule le Quality Gate.
6. **`waitForQualityGate`** → Jenkins attend le résultat du Quality Gate.
7. **Quality Gate FAILED** → le pipeline s'arrête lorsque `abortPipeline: true`.
8. **SonarQube ne remplace pas les tests** : les tests sont exécutés avant l'analyse.

---

## 🧩 Résumé

```text
Tests
  │
  ├── JUnit/Surefire ──────→ Jenkins
  │
  └── Coverage ────────────→ SonarQube
                                │
                                ▼
                           Code Analysis
                                │
                                ▼
                           Quality Gate
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                      PASSED         FAILED
                         │             │
                         ▼             ▼
                     Continue         Stop
```

> **Jenkins orchestre le pipeline, Surefire produit les résultats des tests, JaCoCo/LCOV produisent la couverture, SonarQube analyse le code et le Quality Gate valide les conditions de qualité.**
