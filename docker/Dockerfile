# ISSUE: Using 'latest' tag — not reproducible
FROM node:latest

# ISSUE: Running as root (no USER instruction)
#############
# ISSUE: Setting secrets as build args — visible in image history
ARG DB_PASSWORD=SuperSecret123!
ARG JWT_SECRET=my-super-secret-jwt-key-do-not-share
ARG AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
ARG AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ISSUE: Secrets baked into environment variables in the image layer
ENV DB_PASSWORD=$DB_PASSWORD
ENV JWT_SECRET=$JWT_SECRET
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV NODE_ENV=production

WORKDIR /app

# ISSUE: Copies everything including .env, .git, node_modules — no .dockerignore
COPY . .

# ISSUE: npm install instead of npm ci for reproducible builds
# ISSUE: Installs devDependencies in production
RUN npm install

# ISSUE: No health check defined
# ISSUE: No multi-stage build — final image includes build tools and source

# ISSUE: Exposing multiple ports without documentation
EXPOSE 3000
EXPOSE 22
EXPOSE 9229

# ISSUE: Using npm start instead of direct node command (extra process)
# ISSUE: No signal handling (PID 1 problem)
CMD ["npm", "start"]
