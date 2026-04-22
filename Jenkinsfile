pipeline {
  agent any

  options {
    timeout(time: 15, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '5'))
  }

  environment {
    // Vercel Token from CODING CI environment variables (set in project settings)
    // VERIFY: Token is stored in CODING project CI settings, NOT in this file
    NPM_CACHE = "${WORKSPACE}/.npm"
  }

  stages {
    stage('Checkout') {
      steps {
        echo 'Fetching latest code...'
        checkout scm
      }
    }

    stage('Setup Node.js') {
      steps {
        echo 'Setting up Node.js 18...'
        sh 'node --version'
        sh 'npm --version'
      }
    }

    stage('Install Dependencies') {
      steps {
        echo 'Installing dependencies...'
        sh 'npm ci --prefer-offline || npm install'
      }
    }

    stage('Build') {
      steps {
        echo 'Building production bundle...'
        sh 'npm run build'
      }
    }

    stage('Verify Build') {
      steps {
        echo 'Verifying build output...'
        sh 'test -f dist/index.html && echo "dist/index.html OK" || (echo "ERROR: dist/index.html not found!" && exit 1)'
        sh 'test -f dist/bundle.*.js && echo "bundle.js OK" || (echo "ERROR: bundle.js not found!" && exit 1)'
      }
    }

    stage('Deploy to Vercel') {
      steps {
        echo 'Deploying to Vercel (production)...'
        sh '''
          npx vercel deploy --prod --yes \
            --token $VERCEL_TOKEN \
            --cwd "${WORKSPACE}"
        '''
      }
    }
  }

  post {
    success {
      echo 'Deployment completed successfully!'
      // Optionally notify via webhook or other channels
    }
    failure {
      echo 'Build or deployment failed. Check logs above.'
    }
    always {
      cleanWs()
    }
  }
}
