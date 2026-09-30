def BACKEND_SERVICES = [
    'api-gateway',
    'discovery-service',
    'media-service',
    'product-service',
    'security-service',
    'user-service'
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

        stage('Backend Tests') {
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

stage('SonarQube Analysis') {
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

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm test -- --watch=false '
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
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**
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