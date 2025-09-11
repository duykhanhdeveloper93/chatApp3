pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checkout code from Git'
                git branch: 'main', url: 'https://github.com/duykhanhdeveloper93/chatApp3'
            }
        }

        stage('Build & Deploy Docker') {
            steps {
                echo 'Stop existing containers if any'
                sh "docker-compose -f ${DOCKER_COMPOSE_FILE} down"

                echo 'Build and start containers'
                sh "docker-compose -f ${DOCKER_COMPOSE_FILE} up -d --build"
            }
        }
    }

    post {
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed!"
        }
    }
}
