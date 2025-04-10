# This file is used for making our docker container.
# Docker lets us push our entire working environment onto the cloud.

# Use node version 22.12.0
# We're using alpine to cut down on file size while keeping all the features we need
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

# Set working directory
WORKDIR /app

# Set environment variables
ENV PORT=80
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Copy package.json files to the production stage
COPY package*.json ./

# Copy only production dependencies from the build stage
COPY --from=build /app/node_modules /app/node_modules

# Copy application code
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

# Expose the port the app runs on
EXPOSE 80

# Start the container by running our server
CMD ["npm", "start"]
