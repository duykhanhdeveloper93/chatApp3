pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        git branch: 'develop',
            url: 'https://github.com/duykhanhdeveloper93/chatApp3'
      }
    }

    stage('Build & Deploy') {
      steps {
        sh '''
          docker compose down
          docker compose build
          docker compose up -d
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Deploy OK – DB auto sync"
    }
    failure {
      echo "❌ Deploy FAIL"
    }
  }
}
