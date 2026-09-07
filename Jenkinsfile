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
        script {
            def services = ['api-gateway', 'discovery-service', 'media-service', 'product-service', 'security-service', 'user-service']
            services.each { svc ->
                dir(svc) {
                    sh 'chmod +x mvnw'
                    sh 'sh ./mvnw clean test'
                }
            }
        }
    }
}

        stage('Docker Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
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

    post {
        success {
            echo "✅ Build réussi"
        }
        failure {
            echo "❌ Build échoué"
        }
    }
}