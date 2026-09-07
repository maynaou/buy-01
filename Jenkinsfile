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
                sh 'npm install && npm test -- --watch=false --browsers=ChromeHeadless'
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
            // slackSend ou emailext ici
        }
        failure {
            echo "❌ Build échoué"
            // slackSend ou emailext ici
        }
    }
}