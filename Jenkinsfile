def BACKEND_SERVICES = [
    'api-gateway',
    'discovery-service',
    'media-service',
    'product-service',
    'security-service',
    'user-service',
    'order-service'
]


pipeline {

    agent any

    environment {
              IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    options {

        buildDiscarder(
            logRotator(
                numToKeepStr: '20'
            )
        )

        disableConcurrentBuilds()

        timestamps()

        timeout(
            time: 30,
            unit: 'MINUTES'
        )

        preserveStashes(buildCount: 10)

    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Secrets') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'cloudinary-url',
                        variable: 'CLOUDINARY_URL'
                    ),
                    file(
                        credentialsId: 'jwt-private-key',
                        variable: 'JWT_PRIVATE_KEY'
                    ),
                    file(
                        credentialsId: 'jwt-public-key',
                        variable: 'JWT_PUBLIC_KEY'
                    ),
                    file(
                        credentialsId: 'frontend-ssl-cert',
                        variable: 'FRONTEND_SSL_CERT'
                    ),
                    file(
                        credentialsId: 'frontend-ssl-key',
                        variable: 'FRONTEND_SSL_KEY'
                    )
                ]) {
                    sh './scripts/prepare-secrets.sh'
                }
            }
        }

        stage('Backend Unit & Integration Tests') {
            steps {
                script {
                    def tests = [:]
                    BACKEND_SERVICES.each {  service -> tests[service] = {
                        dir("backend/${service}") {
                            sh './mvnw clean test'
                        }
                    }
                }
                tests.failFast = true 
                parallel tests
                }
            }
        }

stage('Backend SonarQube Analysis') {
    steps {
        script {

            def analyses = [:]

            BACKEND_SERVICES.each { service ->

                analyses[service] = {

                    dir("backend/${service}") {

                        echo "🔎 SonarQube: ${service}"

                        withSonarQubeEnv('SonarQube') {
                            sh """
                                ./mvnw org.sonarsource.scanner.maven:sonar-maven-plugin:sonar \
                                -Dsonar.projectKey=buy-01-${service} \
                                -Dsonar.projectName=buy-01-${service} \
                                -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                            """
                        }

                        timeout(time: 5, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }

            analyses.failFast = true

            parallel analyses
        }
    }
}

        stage('Frontend Unit & Integration Tests') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh "npm test -- --watch=false --include='src/**/*.spec.ts'"
                }
            }
        }


        stage('Frontend SonarQube Analysis') {
            steps {
                dir('frontend') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            npx sonar-scanner \
                            -Dsonar.projectKey=buy-01-frontend \
                            -Dsonar.projectName=buy-01-frontend \
                            -Dsonar.sources=src \
                            -Dsonar.tests=src \
                            -Dsonar.test.inclusions=**/*.spec.ts \
                            -Dsonar.exclusions=**/*.spec.ts,**/node_modules/**,**/dist/** \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        '''
                    }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "🐳 Build Backend"
                dir('backend') {
                    sh '''
                        IMAGE_TAG=$IMAGE_TAG docker compose build
                    '''
                }
                echo "🐳 Build Frontend"
        
                dir('frontend') {
                    sh 'docker build -t frontend-app:${IMAGE_TAG} .'
                }

                sh 'echo "${IMAGE_TAG}" > image-tag.txt'
                
                stash(
                    name: 'docker-image-tag',
                    includes: 'image-tag.txt'
                )
            }
        }

        stage('End-to-End Tests') {
            steps {
                script {
                    dir('backend') {
                        sh '''
                            IMAGE_TAG=$IMAGE_TAG docker compose up \
                                --no-build -d --wait --wait-timeout 420

                            attempts=0
                            status=000
                            while [ "$attempts" -lt 60 ]; do
                                status=$(curl --silent --insecure --max-time 1 \
                                    --output /dev/null --write-out '%{http_code}' \
                                    --request POST --header 'Content-Type: application/json' \
                                    --data '{}' \
                                    https://docker:8888/api/auth/register 2>/dev/null || true)
                                if [ "$status" = 400 ]; then
                                    break
                                fi
                                attempts=$((attempts + 1))
                                if [ "$((attempts % 10))" -eq 0 ]; then
                                    echo "Waiting for auth route through API Gateway (attempt $attempts/60, HTTP $status)"
                                fi
                                sleep 1
                            done

                            if [ "$status" != 400 ]; then
                                echo "Auth route did not become ready through the API Gateway within 2 minutes (expected HTTP 400, got $status)"
                                exit 1
                            fi
                        '''
                    }

                    dir('frontend') {
                        sh '''
                            IMAGE_TAG=$IMAGE_TAG docker compose up \
                                --no-build -d --wait --wait-timeout 420
                        '''

                        sh '''
                            npm run e2e
                        '''
                    }
                }
            }
        }

        stage('Deploy Backend') {
            when {
                branch 'main'
            }
            steps {
                script {
                    unstash 'docker-image-tag'
                    def deployTag = readFile('image-tag.txt').trim()
                    echo "📦 Version à déployer : ${deployTag}"
                    try {
                        sh "IMAGE_TAG=${deployTag} bash ./scripts/deploy-backend.sh"
                    } catch (err) {
                        sh "IMAGE_TAG=${deployTag} bash ./scripts/rollback-backend.sh"
                        error("❌ Déploiement Backend échoué — rollback exécuté")
                    }
                }
            }
        }

        stage('Deploy Frontend') {
            when {
                branch 'main'
            }
            steps {
                script {
                    unstash 'docker-image-tag'
                    def deployTag = readFile('image-tag.txt').trim()
                    echo "📦 Version Frontend à déployer : ${deployTag}"
                    try {
                        sh "IMAGE_TAG=${deployTag} bash ./scripts/deploy-frontend.sh"
                    } catch (err) {
                        sh "IMAGE_TAG=${deployTag} bash ./scripts/rollback-frontend.sh"
                        error("❌ Déploiement Frontend échoué — rollback exécuté")
                    }
                }
            }
        }

        stage('cleanUp') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh './scripts/cleanup-images.sh'
                }
            }
        }
    }

    post {
        always {
            junit(
                allowEmptyResults: true,
                testResults:
                    'backend/*/target/surefire-reports/*.xml, frontend/test-results/*.xml'
            )
        }
        success {
            echo "✅ Build réussi"
            emailext(
                subject: "✅ Jenkins SUCCESS - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body:"""Build réussi.
                        Job: ${env.JOB_NAME}
                        Build: #${env.BUILD_NUMBER}
                        Branch: ${env.BRANCH_NAME}
                        Commit: ${env.GIT_COMMIT}
                        URL Jenkins:${env.BUILD_URL}""",

                to: "mohssinaynaou874@gmail.com"
            )
        }

        failure {
            echo "❌ Build échoué"
            emailext(
                subject: "❌ Jenkins FAILURE - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body:"""Build échoué.
                        Job: ${env.JOB_NAME}
                        Build: #${env.BUILD_NUMBER}
                        Branch: ${env.BRANCH_NAME}
                        Commit: ${env.GIT_COMMIT}
                        URL Jenkins:${env.BUILD_URL}""",

                to: "mohssinaynaou874@gmail.com"
            )
        }
    }
}