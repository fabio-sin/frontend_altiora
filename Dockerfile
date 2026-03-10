# ─── Stage 1 : Build Angular ───────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2 : Serve with Nginx ─────────────────────────────────────────────
FROM nginx:alpine

# Copy built files (Angular 17 outputs to browser/ subfolder)
COPY --from=build /app/dist/altiora-chatbot/browser /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
