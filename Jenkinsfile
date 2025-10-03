pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/duykhanhdeveloper93/chatApp3'
            }
        }

        stage('Build Backend & Frontend') {
            steps {
                sh 'docker-compose -f docker-compose.yml build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose -f docker-compose.yml down'
                sh 'docker-compose -f docker-compose.yml up -d'
            }
        }
    }
}
