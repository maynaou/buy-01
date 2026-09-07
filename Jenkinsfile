pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                script {
                    def services = ['api-gateway', 'discovery-service', 'media-service', 'product-service', 'security-service', 'user-service']
                    services.each { svc ->
                        dir("backend/${svc}") {
                            sh 'chmod +x mvnw'
                            sh 'sh ./mvnw clean test'
                        }
                    }
                }
            }
        }

        // stage('Frontend Tests') {
        //     steps {
        //         dir('frontend') {
        //             sh 'npm install'
        //             sh 'npm test -- --watch=false --browsers=ChromeHeadless'
        //         }
        //     }
        // }

        stage('Docker Build') {
            steps {
                dir('backend') {
                    sh 'docker compose build'
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                dir('backend') {
                    script {
                        try {
                            sh 'docker compose up -d'
                        } catch (err) {
                            sh 'docker compose down'
                            sh 'docker compose -f docker-compose.previous.yml up -d'
                            error("Déploiement échoué — rollback exécuté")
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build réussi"
        }
        failure {
            echo "❌ Build échoué"
        }
    }
}