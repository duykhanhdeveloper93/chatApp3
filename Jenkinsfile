pipeline {
    agent any

    triggers {
        // Trigger tự động từ GitHub webhook (sẽ config sau)
        githubPush()
    }

    stages {
        stage('Checkout develop') {
            steps {
                checkout scmGit(
                    branches: [[name: 'develop']],
                    userRemoteConfigs: [[url: 'https://github.com/duykhanhdeveloper93/chatApp3.git']]
                )
                // Optional: In branch để confirm
                sh 'git branch --show-current'
            }
        }

        stage('Build & Deploy') {
            steps {
                dir('.') {  // Chạy ở root repo
                    sh '''
                        docker compose down --remove-orphans || true
                        docker compose build --no-cache || true  # --no-cache để rebuild sạch nếu cần
                        docker compose up -d
                        docker compose ps  # Check status
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline kết thúc - Check logs nếu fail"
        }
        success {
            echo "✅ Deploy OK – App chatApp3 updated trên develop!"
        }
        failure {
            echo "❌ Deploy FAIL – Kiểm tra console output"
        }
    }
}