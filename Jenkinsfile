pipeline {
    agent any

    environment {
        // Fichier persistant dans le volume Jenkins
        LAST_GOOD_COMMIT_FILE = "${JENKINS_HOME}/last-good-commit.txt"
    }

    stages {

        // ============================================================
        // CHECKOUT
        // ============================================================

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ============================================================
        // BACKEND TESTS
        // ============================================================

        stage('Backend Tests') {
            steps {
                script {
                    def services = [
                        'api-gateway',
                        'discovery-service',
                        'media-service',
                        'product-service',
                        'security-service',
                        'user-service'
                    ]

                    services.each { svc ->
                        dir("backend/${svc}") {
                            sh './mvnw clean test'
                        }
                    }
                }
            }
        }

        // ============================================================
        // FRONTEND TESTS
        // ============================================================

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm test -- --watch=false'
                }
            }
        }

        // ============================================================
        // FRONTEND BUILD
        // ============================================================

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        // ============================================================
        // DOCKER BUILD
        // ============================================================

        stage('Docker Build') {
            steps {
                dir('backend') {
                    sh 'docker compose build'
                }
            }
        }

        // ============================================================
        // DEPLOY BACKEND
        // ============================================================

        stage('Deploy Backend') {

            when {
                branch 'main'
            }

   steps {
        script {
            withCredentials([
                usernamePassword(credentialsId: 'mongo-creds', usernameVariable: 'MONGO_USERNAME', passwordVariable: 'MONGO_PASSWORD'),
                string(credentialsId: 'ssl-password', variable: 'SSL_PASSWORD')
            ]) {
                try {

                    echo "🚀 Déploiement de la nouvelle version Backend..."

                    dir('backend') {
                        sh 'docker compose up -d'
                    }

                    echo "✅ Backend déployé avec succès"

                } catch (err) {

                    echo "❌ Déploiement Backend échoué"
                    echo "🔄 Rollback Backend..."

                    def lastGoodCommit = sh(
                        script: """
                            if [ -f "${LAST_GOOD_COMMIT_FILE}" ]; then
                                cat "${LAST_GOOD_COMMIT_FILE}"
                            else
                                echo ""
                            fi
                        """,
                        returnStdout: true
                    ).trim()

                    if (lastGoodCommit) {
                        echo "↩️ Dernier commit Backend fonctionnel : ${lastGoodCommit}"

                        dir('backend') {
                            sh 'docker compose down'
                            sh "git checkout ${lastGoodCommit} -- ."
                            sh 'docker compose build'
                            sh 'docker compose up -d'
                        }

                        echo "✅ Rollback Backend terminé"
                    } else {
                        echo "⚠️ Aucun ancien commit disponible pour le rollback Backend"

                        dir('backend') {
                            sh 'docker compose down'
                        }
                    }

                    error("❌ Déploiement Backend échoué — rollback exécuté")
                }
            }
        }
    }
        }

        // ============================================================
        // DEPLOY FRONTEND
        // ============================================================

        stage('Deploy Frontend') {

            when {
                branch 'main'
            }

            steps {
                script {
                    withCredentials([string(credentialsId: 'ssl-password', variable: 'SSL_PASSWORD')]) {
                    try {

                        echo "🚀 Déploiement de la nouvelle version Frontend..."

                        dir('frontend') {

                            sh '''
                                echo "Arrêt de l'ancienne version Angular..."

                                pkill -f "ng serve" || true

                                export JENKINS_NODE_COOKIE=dontKillMe

                                echo "Démarrage de la nouvelle version Angular..."

                                nohup npx ng serve \
                                    --ssl \
                                    --host 0.0.0.0 \
                                    --port 4200 \
                                    > ng-serve.log 2>&1 &

                                echo "Angular lancé en arrière-plan"

                                sleep 5

                                echo "===== Angular logs ====="
                                cat ng-serve.log
                                echo "========================"

                                echo "Vérification du processus Angular..."

                                if pgrep -f "ng serve" > /dev/null; then
                                    echo "✅ Angular fonctionne correctement"
                                else
                                    echo "❌ Angular ne fonctionne pas"
                                    exit 1
                                fi
                            '''
                        }

                        echo "✅ Frontend déployé avec succès"

                    } catch (err) {

                        echo "❌ Déploiement Frontend échoué"
                        echo "🔄 Rollback Frontend..."

                        // Récupérer le dernier commit fonctionnel
                        def lastGoodCommit = sh(
                            script: """
                                if [ -f "${LAST_GOOD_COMMIT_FILE}" ]; then
                                    cat "${LAST_GOOD_COMMIT_FILE}"
                                else
                                    echo ""
                                fi
                            """,
                            returnStdout: true
                        ).trim()

                        if (lastGoodCommit) {

                            echo "↩️ Dernier commit Frontend fonctionnel : ${lastGoodCommit}"

                            dir('frontend') {

                                // Arrêter la nouvelle version
                                sh '''
                                    pkill -f "ng serve" || true
                                '''

                                // Restaurer les fichiers du dernier commit fonctionnel
                                sh "git clean -fd"
                                sh "git checkout ${lastGoodCommit} -- ."

                                // Réinstaller les dépendances
                                sh 'npm ci'

                                // Relancer l'ancienne version
                                sh '''
                                    export JENKINS_NODE_COOKIE=dontKillMe

                                    nohup npx ng serve \
                                        --ssl \
                                        --host 0.0.0.0 \
                                        --port 4200 \
                                        > ng-serve.log 2>&1 &

                                    sleep 5

                                    cat ng-serve.log

                                    if pgrep -f "ng serve" > /dev/null; then
                                        echo "✅ Ancienne version Frontend restaurée"
                                    else
                                        echo "❌ Impossible de restaurer le Frontend"
                                        exit 1
                                    fi
                                '''
                            }

                            echo "✅ Rollback Frontend terminé"

                        } else {

                            echo "⚠️ Aucun ancien commit disponible pour le rollback Frontend"

                            dir('frontend') {
                                sh 'pkill -f "ng serve" || true'
                            }
                        }

                        error("❌ Déploiement Frontend échoué — rollback exécuté")
                    }
                }
              }
            }
        }
    }

    // ================================================================
    // POST
    // ================================================================

    post { 

        always {
            junit allowEmptyResults: true, testResults: 'backend/*/target/surefire-reports/*.xml, frontend/test-results/*.xml'
        }

        success {

            echo "✅ Build réussi"

            // Sauvegarder le commit qui vient d'être déployé
            sh """
                mkdir -p "\$(dirname "${LAST_GOOD_COMMIT_FILE}")"
                git rev-parse HEAD > "${LAST_GOOD_COMMIT_FILE}"
            """

            echo "💾 Dernier commit fonctionnel sauvegardé"

            emailext(
                subject: "✅ Jenkins SUCCESS - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """Build réussi.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Branch: ${env.BRANCH_NAME}

Commit déployé:
${env.GIT_COMMIT}

URL Jenkins:
${env.BUILD_URL}
""",
                to: "mohssinaynaou874@gmail.com"
            )
        }

        failure {

            echo "❌ Build échoué"

            emailext(
                subject: "❌ Jenkins FAILURE - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """Build échoué.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Branch: ${env.BRANCH_NAME}

Consulte les logs Jenkins:
${env.BUILD_URL}
""",
                to: "mohssinaynaou874@gmail.com"
            )
        }
    }
}
