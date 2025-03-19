# This file is used for making our docker container.
# Docker lets us push our entire working environment onto the cloud.

# Use node version 22.12.0
# We want to make sure our image as close to our development environment as possible
# If we update the version in our dev environment, we can update this version accordingly

# We're using apline to cut down on file size while keeping all the features we need
FROM node:22.12.0-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
# This layer will be cached unless package.json changes
COPY package*.json ./
RUN npm ci --only=production --no-audit

FROM node:22.12.0-alpine

# This is our app metadata
LABEL maintainer="Chris Simon <Chris.m.simon1@gmail.com>"
LABEL description="Fragments node.js microservice"

# From node best practices (https://docs.docker.com/build/building/best-practices/)
# Create a non-root user to run the application
RUN addgroup -S nodeapp && \
    adduser -S -G nodeapp nodeapp

# Set working directory owned by non-root user
WORKDIR /app
RUN chown -R nodeapp:nodeapp /app

# / / / /
#
# A NOTE ABOUT SECRETS
#
# We don't want to include secrets, or define things that will
# always be different inside of our dockerfile. Amazon cognito
# variables for example should never be included in a Dockerfile
# since they'll always be different with our current setup and
# non-elastic ip
#
# / / / /

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Copy package.json files to the production stage
COPY --chown=nodeapp:nodeapp package*.json ./

# Copy only production dependencies from the build stage
COPY --from=build --chown=nodeapp:nodeapp /app/node_modules /app/node_modules

# Copy application code
COPY --chown=nodeapp:nodeapp ./src ./src
COPY --chown=nodeapp:nodeapp ./tests/.htpasswd ./tests/.htpasswd

# Switch to non-root user
USER nodeapp

# Expose the port the app runs on
EXPOSE 8080

# Start the container by running our server
CMD ["npm", "start"]
