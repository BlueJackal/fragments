#!/bin/sh

# Setup steps for working with LocalStack and DynamoDB local instead of AWS.
# Assumes aws cli is installed and LocalStack and DynamoDB local are running.

# Setup AWS environment variables
echo "Setting AWS environment variables for LocalStack"

echo "AWS_ACCESS_KEY_ID=test"
export AWS_ACCESS_KEY_ID=test

echo "AWS_SECRET_ACCESS_KEY=test"
export AWS_SECRET_ACCESS_KEY=test

echo "AWS_SESSION_TOKEN=test"
export AWS_SESSION_TOKEN=test

export AWS_DEFAULT_REGION=us-east-1
echo "AWS_DEFAULT_REGION=us-east-1"

# Wait for LocalStack to be ready, by inspecting the response from healthcheck
echo 'Waiting for LocalStack S3...'
max_retries=20
retry_count=0
while ! curl --silent http://localhost:4566/_localstack/health | grep "\"s3\": \"\(running\|available\)\"" > /dev/null; do
    retry_count=$((retry_count+1))
    if [ $retry_count -ge $max_retries ]; then
        echo "LocalStack S3 not ready after $max_retries attempts. Exiting."
        exit 1
    fi
    echo "Waiting for LocalStack S3... (Attempt $retry_count/$max_retries)"
    sleep 5
done
echo 'LocalStack S3 Ready'

# Create our S3 bucket with LocalStack
echo "Creating LocalStack S3 bucket: csimon-fragments"
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket csimon-fragments

# Setup DynamoDB Table with dynamodb-local
echo "Creating DynamoDB-Local DynamoDB table: fragments"
aws --endpoint-url=http://localhost:8000 \
dynamodb create-table \
    --table-name fragments \
    --attribute-definitions \
        AttributeName=ownerId,AttributeType=S \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=ownerId,KeyType=HASH \
        AttributeName=id,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5

# Wait until the Fragments table exists in dynamodb-local
aws --endpoint-url=http://localhost:8000 dynamodb wait table-exists --table-name fragments
