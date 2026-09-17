pipeline {
    agent any

    environment {
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
        // PREPARE SECRETS
        // ============================================================

        stage('Prepare Secrets') {
            steps {
                withCredentials([
                    string(credentialsId: 'cloudinary-url', variable: 'CLOUDINARY_URL'),
                    file(credentialsId: 'jwt-private-key', variable: 'JWT_PRIVATE_KEY'),
                    file(credentialsId: 'jwt-public-key', variable: 'JWT_PUBLIC_KEY')
                ]) {
                    sh '''
                        echo "===== Préparation des secrets ====="

                        # Security Service
                        mkdir -p backend/security-service/src/main/resources/certs
                        rm -f backend/security-service/src/main/resources/certs/pri.pem
                        rm -f backend/security-service/src/main/resources/certs/pub.pem
                        cp "$JWT_PRIVATE_KEY" backend/security-service/src/main/resources/certs/pri.pem
                        cp "$JWT_PUBLIC_KEY" backend/security-service/src/main/resources/certs/pub.pem

                        # API Gateway
                        mkdir -p backend/api-gateway/src/main/resources/certs
                        rm -f backend/api-gateway/src/main/resources/certs/pub.pem
                        cp "$JWT_PUBLIC_KEY" backend/api-gateway/src/main/resources/certs/pub.pem

                        # Media Service
                        rm -f backend/media-service/src/main/resources/env.properties
                        cat > backend/media-service/src/main/resources/env.properties <<EOF
CLOUDINARY_URL=$CLOUDINARY_URL
EOF

                        echo "===== Vérification ====="
                        test -f backend/security-service/src/main/resources/certs/pri.pem && echo "✅ security pri.pem OK"
                        test -f backend/security-service/src/main/resources/certs/pub.pem && echo "✅ security pub.pem OK"
                        test -f backend/api-gateway/src/main/resources/certs/pub.pem && echo "✅ gateway pub.pem OK"
                        test -f backend/media-service/src/main/resources/env.properties && echo "✅ media env.properties OK"
                    '''
                }
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
        // FRONTEND TESTS & BUILD
        // ============================================================

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm test -- --watch=false'
                }
            }
        }

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
        // BACKUPS (Placés AVANT les déploiements)
        // ============================================================

        stage('Backup Current Docker Images') {
            when { branch 'main' }
            steps {
                sh '''
                    echo "===== Backup des images Docker actuelles ====="
                    docker tag backend-api-gateway:latest backend-api-gateway:previous || true
                    docker tag backend-discovery-service:latest backend-discovery-service:previous || true
                    docker tag backend-media-service:latest backend-media-service:previous || true
                    docker tag backend-product-service:latest backend-product-service:previous || true
                    docker tag backend-security-service:latest backend-security-service:previous || true
                    docker tag backend-user-service:latest backend-user-service:previous || true
                    echo "✅ Images précédentes sauvegardées"
                '''
            }
        }

        stage('Backup Current Frontend Build') {
            when { branch 'main' }
            steps {
                dir('frontend') {
                    sh '''
                        if [ -d "dist" ]; then
                            echo "===== Backup du build Frontend actuel ====="
                            rm -rf dist-previous
                            cp -r dist dist-previous
                            echo "✅ Build précédent sauvegardé"
                        fi
                    '''
                }
            }
        }

        // ============================================================
        // DEPLOY BACKEND
        // ============================================================

        stage('Deploy Backend') {
            when { branch 'main' }
            steps {
                script {
                    withCredentials([
                        usernamePassword(credentialsId: 'mongo-creds', usernameVariable: 'MONGO_USERNAME', passwordVariable: 'MONGO_PASSWORD'),
                        string(credentialsId: 'ssl-password', variable: 'SSL_PASSWORD'),
                        string(credentialsId: 'cloudinary-url', variable: 'CLOUDINARY_URL'),
                        file(credentialsId: 'jwt-private-key', variable: 'JWT_PRIVATE_KEY'),
                        file(credentialsId: 'jwt-public-key', variable: 'JWT_PUBLIC_KEY')
                    ]) {
                        try {
                            echo "🚀 Déploiement de la nouvelle version Backend..."

                            dir('backend') {
                                sh 'docker compose up -d'
                                sleep 30

                                sh '''
                                    if docker compose ps | grep -q "unhealthy\\|Exited"; then
                                        echo "❌ Un container est unhealthy ou arrêté"
                                        exit 1
                                    fi
                                '''
                            }

                            echo "✅ Backend déployé avec succès"

                        } catch (err) {
                            echo "❌ Déploiement Backend échoué"
                            echo "🔄 Rollback vers les images Docker précédentes..."

                            dir('backend') {
                                sh '''
                                    echo "Arrêt de la version défaillante..."
                                    docker compose down

                                    echo "Restauration des tags précédents..."
                                    docker tag backend-api-gateway:previous backend-api-gateway:latest || true
                                    docker tag backend-discovery-service:previous backend-discovery-service:latest || true
                                    docker tag backend-media-service:previous backend-media-service:latest || true
                                    docker tag backend-product-service:previous backend-product-service:latest || true
                                    docker tag backend-security-service:previous backend-security-service:latest || true
                                    docker tag backend-user-service:previous backend-user-service:latest || true

                                    echo "Redémarrage avec les images précédentes..."
                                    docker compose up -d
                                '''
                            }

                            echo "✅ Rollback Docker Backend terminé"
                            error("❌ Déploiement Backend échoué — rollback Docker exécuté")
                        }
                    }
                }
            }
        }

        // ============================================================
        // DEPLOY FRONTEND
        // ============================================================

        stage('Deploy Frontend') {
            when { branch 'main' }
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

                                    sleep 5

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
                            echo "🔄 Rollback vers le build Frontend précédent..."

                            dir('frontend') {
                                sh '''
                                    pkill -f "ng serve" || true

                                    if [ -d "dist-previous" ]; then
                                        echo "Restauration des fichiers de build..."
                                        rm -rf dist
                                        cp -r dist-previous dist

                                        export JENKINS_NODE_COOKIE=dontKillMe

                                        nohup npx ng serve \
                                            --ssl \
                                            --host 0.0.0.0 \
                                            --port 4200 \
                                            > ng-serve.log 2>&1 &

                                        sleep 5

                                        if pgrep -f "ng serve" > /dev/null; then
                                            echo "✅ Ancienne version Frontend restaurée instantanément"
                                        else
                                            echo "❌ Impossible de relancer Angular"
                                            exit 1
                                        fi
                                    else
                                        echo "⚠️ Aucun backup dist-previous disponible"
                                    fi
                                '''
                            }

                            echo "✅ Rollback Frontend terminé"
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
            emailext(
                subject: "✅ Jenkins SUCCESS - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """Build réussi.
                         Job: ${env.JOB_NAME}
                         Build: #${env.BUILD_NUMBER}
                         Branch: ${env.BRANCH_NAME}
                         Commit déployé: ${env.GIT_COMMIT}
                         URL Jenkins:${env.BUILD_URL}""",
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
                         Consulte les logs Jenkins: ${env.BUILD_URL}""",
                to: "mohssinaynaou874@gmail.com"
            )
        }
    }
}