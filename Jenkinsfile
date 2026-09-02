// =============================================================================
//  buy-01 -- Pipeline CI/CD du BACKEND (microservices Spring Boot)
//
//  Enchainement : preparation -> build -> tests JUnit -> images Docker
//                 -> deploiement -> health check -> rollback si echec
//                 -> notifications e-mail / Slack
//
//  Prerequis Jenkins : JDK nomme "jdk17" (Manage Jenkins > Tools), agent portant
//  le label "backend" avec docker + docker compose, utilisateur jenkins dans le
//  groupe docker. Tout est detaille dans la procedure d'installation.
// =============================================================================

// Ordre de demarrage : discovery en premier, gateway en dernier.
// (pas de "def" : les variables du binding restent visibles depuis les fonctions)
ALL_SERVICES = ['discovery-service', 'security-service', 'user-service',
                'product-service', 'media-service', 'api-gateway']

// Services retenus pour ce build (parametre SERVICES : 'all' ou liste virgulee).
def targetServices(List all) {
    String wanted = (params.SERVICES ?: 'all').trim()
    if (!wanted || wanted.equalsIgnoreCase('all')) {
        return all
    }
    def asked = wanted.split(',').collect { it.trim() }.findAll { it }
    def unknown = asked - all
    if (unknown) {
        error "Service(s) inconnu(s) : ${unknown.join(', ')}. Attendu : ${all.join(', ')} ou 'all'"
    }
    return asked
}

// --- Health check : une reponse HTTP < 500 prouve que le service ecoute -------
// (401/403/404 comptent comme "debout" : les endpoints sont proteges par Spring
// Security, et discovery-service/security-service n'exposent pas actuator).
HEALTH_SCRIPT = '''
cd "$BACKEND_DIR"
wait_one() {
    name="$1"; url="$2"; i=1
    while [ "$i" -le "$HEALTH_RETRIES" ]; do
        # curl ecrit deja 000 quand la connexion echoue : on ne rajoute rien.
        code=$(curl -s -k -o /dev/null -m 5 -w '%{http_code}' "$url" 2>/dev/null)
        case "$code" in ''|*[!0-9]*) code=0 ;; esac
        if [ "$code" -gt 0 ] && [ "$code" -lt 500 ]; then
            echo "  [OK] $name -> HTTP $code"
            return 0
        fi
        sleep "$HEALTH_DELAY"; i=$((i + 1))
    done
    echo "  [KO] $name injoignable ($url) apres $((HEALTH_RETRIES * HEALTH_DELAY))s"
    docker compose logs --tail=40 "$name" 2>&1 || true
    return 1
}
echo "Health check des services backend"
wait_one discovery-service http://localhost:8761/                 || exit 1
wait_one security-service  http://localhost:8084/                 || exit 1
wait_one user-service      http://localhost:8081/actuator/health   || exit 1
wait_one product-service   http://localhost:8082/actuator/health   || exit 1
wait_one media-service     http://localhost:8083/actuator/health   || exit 1
wait_one api-gateway       https://localhost:8888/actuator/health  || exit 1
'''

// --- Rollback : on remet en ligne les images sauvegardees avant le build ------
// Code de sortie 2 = aucune version precedente disponible (premier deploiement).
ROLLBACK_SCRIPT = '''
cd "$BACKEND_DIR"
missing=0
for svc in $ALL_SVC; do
    if ! docker image inspect "$ROLLBACK_REPO/$svc:previous" >/dev/null 2>&1; then
        echo "pas d'image de secours pour $svc"
        missing=1
    fi
done
if [ "$missing" = 1 ]; then
    echo "ROLLBACK IMPOSSIBLE (aucun deploiement precedent) -> arret des services applicatifs"
    docker compose stop $ALL_SVC || true
    exit 2
fi
for svc in $ALL_SVC; do
    docker tag "$ROLLBACK_REPO/$svc:previous" "$COMPOSE_PROJECT-$svc:latest"
done
docker compose up -d --force-recreate --no-build $ALL_SVC
docker compose ps
'''

// Retourne 0 si tous les services repondent, 1 sinon (pas d'exception : le
// rollback a besoin du code retour pour verifier la version restauree).
def healthCheckStatus() {
    return sh(returnStatus: true, script: HEALTH_SCRIPT)
}

def rollback() {
    def rc = sh(returnStatus: true, script: ROLLBACK_SCRIPT)
    if (rc == 2) {
        env.ROLLBACK_RESULT = 'IMPOSSIBLE (aucune version precedente) - services applicatifs arretes'
    } else if (rc != 0) {
        env.ROLLBACK_RESULT = 'EN ECHEC (voir la console)'
    } else {
        env.ROLLBACK_RESULT = (healthCheckStatus() == 0)
            ? 'REUSSI - version precedente de nouveau en ligne'
            : 'EFFECTUE mais la version precedente ne repond pas'
    }
}

// --- Notifications : e-mail (Email Extension) + Slack (Slack Notification) ----
// Encapsulees : un plugin non installe ne doit pas casser le build.
def notifyBuild(String result) {
    String env_ = params.ENVIRONMENT ?: 'dev'
    String rb = env.ROLLBACK_RESULT ? "<p><b>Rollback :</b> ${env.ROLLBACK_RESULT}</p>" : ''
    String subject = "[${result}] ${env.JOB_NAME} #${env.BUILD_NUMBER} (${env_})"
    String body = """
        <p><b>Resultat :</b> ${result}</p>
        <p><b>Environnement :</b> ${env_} &nbsp;|&nbsp; <b>Services :</b> ${env.SELECTED ?: 'n/a'}</p>
        <p><b>Branche :</b> ${env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'n/a'} &nbsp;|&nbsp; <b>Commit :</b> ${env.GIT_SHORT ?: 'n/a'}</p>
        ${rb}
        <p><a href="${env.BUILD_URL}">Build</a> |
           <a href="${env.BUILD_URL}testReport/">Rapport de tests</a> |
           <a href="${env.BUILD_URL}console">Console</a></p>
    """.stripIndent()

    try {
        emailext(subject: subject, body: body, mimeType: 'text/html',
                 to: (params.NOTIFY_EMAIL?.trim() ? params.NOTIFY_EMAIL.trim() : '$DEFAULT_RECIPIENTS'),
                 recipientProviders: [developers(), requestor()],
                 attachLog: result != 'SUCCESS', compressLog: true)
    } catch (err) {
        echo "Notification e-mail ignoree : ${err.message}"
    }

    String color = (result == 'SUCCESS') ? 'good' : (result == 'UNSTABLE') ? 'warning' : 'danger'
    try {
        slackSend(color: color,
                  message: "${subject}\n${env.BUILD_URL}" +
                           (env.ROLLBACK_RESULT ? "\nRollback : ${env.ROLLBACK_RESULT}" : ''))
    } catch (err) {
        echo "Notification Slack ignoree : ${err.message}"
    }
}

pipeline {

    // Builds distribues : le label est parametrable (voir AGENT_LABEL).
    agent { label params.AGENT_LABEL ?: 'backend' }

    tools {
        jdk 'jdk17'   // Manage Jenkins > Tools > JDK installations (nom exact)
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'],
               description: 'Environnement cible du deploiement')
        string(name: 'SERVICES', defaultValue: 'all',
               description: "Services a traiter : 'all' ou liste (ex: user-service,product-service)")
        booleanParam(name: 'RUN_TESTS', defaultValue: true,
                     description: 'Executer les tests JUnit')
        booleanParam(name: 'DEPLOY', defaultValue: true,
                     description: 'Construire les images Docker et deployer')
        string(name: 'AGENT_LABEL', defaultValue: 'backend',
               description: "Label de l'agent Jenkins qui execute le build")
        string(name: 'NOTIFY_EMAIL', defaultValue: '',
               description: 'Destinataires e-mail (vide = destinataires par defaut de Jenkins)')
    }

    options {
        timestamps()
        disableConcurrentBuilds()                 // un seul deploiement a la fois
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '3'))
    }

    triggers {
        pollSCM('H/2 * * * *')   // filet de securite si le webhook GitHub ne passe pas
    }

    environment {
        BACKEND_DIR     = 'backend'
        COMPOSE_PROJECT = 'backend'          // docker compose nomme les images <projet>-<service>
        ROLLBACK_REPO   = 'buy01-rollback'   // copie des images avant deploiement
        HEALTH_RETRIES  = '36'               // 36 x 5s = 3 min max par service
        HEALTH_DELAY    = '5'
    }

    stages {
        stage('Preparation') {
            steps {
                script {
                    env.ALL_SVC   = ALL_SERVICES.join(' ')
                    env.SELECTED  = targetServices(ALL_SERVICES).join(' ')
                    env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    currentBuild.displayName = "#${env.BUILD_NUMBER} ${params.ENVIRONMENT} ${env.GIT_SHORT}"
                    currentBuild.description = "services : ${env.SELECTED}"
                }
                sh '''
                    echo "Commit   : $(git log -1 --pretty='%h - %an - %s')"
                    echo "Services : $SELECTED"
                    java -version
                    docker compose version
                    chmod +x backend/*/mvnw
                '''
            }
        }

        stage('Build') {
            steps {
                script {
                    // failFast : une erreur de compilation arrete tout de suite le build.
                    def branches = [failFast: true]
                    targetServices(ALL_SERVICES).each { svc ->
                        branches[svc] = {
                            dir("${env.BACKEND_DIR}/${svc}") {
                                sh './mvnw -B -ntp clean package -DskipTests'
                            }
                        }
                    }
                    parallel branches
                }
            }
        }
        stage('Tests JUnit') {
            when { expression { params.RUN_TESTS } }
            steps {
                // MongoDB est requis : les @SpringBootTest chargent le contexte Spring Data.
                sh '''
                    cd "$BACKEND_DIR"
                    docker compose up -d mongodb
                    i=1
                    until docker compose exec -T mongodb mongosh --quiet --eval 'db.adminCommand({ping:1})' >/dev/null 2>&1; do
                        [ "$i" -ge 30 ] && { echo "MongoDB de test indisponible"; exit 1; }
                        i=$((i + 1)); sleep 2
                    done
                    echo "MongoDB de test pret sur localhost:27017"
                '''
                script {
                    // Pas de failFast ici : on veut le rapport JUnit complet de tous les services.
                    def branches = [failFast: false]
                    targetServices(ALL_SERVICES).each { svc ->
                        branches[svc] = {
                            dir("${env.BACKEND_DIR}/${svc}") {
                                withEnv(["CI_TEST_DB=${svc}-ci"]) {
                                    sh '''
                                        # Les identifiants Mongo viennent de backend/.env (ou de l'environnement Jenkins).
                                        if [ -f "$WORKSPACE/$BACKEND_DIR/.env" ]; then
                                            set -a; . "$WORKSPACE/$BACKEND_DIR/.env"; set +a
                                        fi
                                        : "${MONGO_USERNAME:?absent de backend/.env et de l environnement Jenkins}"
                                        # Les services pointent sur l'hote docker "mongodb" : on redirige vers localhost.
                                        export SPRING_DATA_MONGODB_URI="mongodb://$MONGO_USERNAME:$MONGO_PASSWORD@localhost:27017/$CI_TEST_DB?authSource=admin"
                                        ./mvnw -B -ntp test
                                    '''
                                }
                            }
                        }
                    }
                    parallel branches
                }
            }
            post {
                always {
                    // Un test rouge => stage FAILED => le pipeline s'arrete avant le deploiement.
                    junit testResults: 'backend/*/target/surefire-reports/*.xml', allowEmptyResults: false
                }
            }
        }

        stage('Archivage des jars') {
            steps {
                archiveArtifacts artifacts: 'backend/*/target/*.jar', fingerprint: true, onlyIfSuccessful: true
            }
        }
        stage('Images Docker') {
            when { expression { params.DEPLOY } }
            steps {
                sh '''
                    cd "$BACKEND_DIR"
                    # Sauvegarde des images actuellement en ligne : c'est la base du rollback.
                    for svc in $ALL_SVC; do
                        if docker image inspect "$COMPOSE_PROJECT-$svc:latest" >/dev/null 2>&1; then
                            docker tag "$COMPOSE_PROJECT-$svc:latest" "$ROLLBACK_REPO/$svc:previous"
                            echo "snapshot -> $ROLLBACK_REPO/$svc:previous"
                        fi
                    done
                    docker compose build $SELECTED
                '''
            }
        }

        stage('Validation prod') {
            when { expression { params.DEPLOY && params.ENVIRONMENT == 'prod' } }
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    input message: 'Deployer cette version en production ?', ok: 'Deployer'
                }
            }
        }

        stage('Deploiement') {
            when { expression { params.DEPLOY } }
            steps {
                script {
                    try {
                        sh '''
                            cd "$BACKEND_DIR"
                            docker compose up -d --remove-orphans
                            docker compose ps
                        '''
                        if (healthCheckStatus() != 0) {
                            error 'Health check echoue : au moins un service ne repond pas'
                        }
                        echo "Deploiement reussi sur l'environnement ${params.ENVIRONMENT}"
                    } catch (err) {
                        echo "Deploiement en echec (${err.message}) -> rollback"
                        rollback()
                        error "Deploiement echoue. Rollback : ${env.ROLLBACK_RESULT}"
                    }
                }
            }
        }
    }

    post {
        always {
            script { notifyBuild(currentBuild.currentResult) }
        }
        cleanup {
            // Supprime uniquement les images intermediaires non taguees.
            sh 'docker image prune -f >/dev/null 2>&1 || true'
        }
    }
}
