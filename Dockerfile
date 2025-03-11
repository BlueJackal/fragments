# This file is used for making our docker container.
# Docker lets us push our entire working environment onto the cloud.

# Use node version 22.12.0
# We want to make sure our image as close to our development environment as possible
# If we update the version in our dev environment, we can update this version accordingly
FROM node:22.12.0

LABEL maintainer="Chris Simon <Chris.m.simon1@gmail.com>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce NPM spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
ENV NPM_CONFIG_COLOR=false


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

# Use /app as our working directory
# This will create an app directory if it doesn't exist, then enter it so
# that all new commands are relevant to /app
WORKDIR /app


# Copy our applicatoin's package.json and package-lock.json files into the image
# The trailing / tells docker that app is a directory and not a file
COPY package*.json /app/

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD ["npm", "start"]

# We run our service on port 8080
EXPOSE 8080
