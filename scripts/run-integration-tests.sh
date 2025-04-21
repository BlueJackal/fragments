#!/bin/bash
# run-integration-tests.sh

# Set necessary environment variables
export TEST_TYPE=integration
export NODE_ENV=test
export AWS_REGION=us-east-1
export HTPASSWD_FILE=tests/.htpasswd
export AWS_S3_BUCKET_NAME=csimon-fragments
export AWS_DYNAMODB_TABLE_NAME=fragments
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test

# Ensure Docker containers are running
echo "Starting Docker containers..."
docker compose up -d

# Give containers time to initialize
echo "Waiting for services to start..."
sleep 5

# Run local AWS setup script
echo "Setting up local AWS resources..."
chmod +x ./scripts/local-aws-setup.sh
./scripts/local-aws-setup.sh

# Run integration tests
echo "Running integration tests..."
npm run test:integration

# Optionally, tear down containers when done
# docker compose down
