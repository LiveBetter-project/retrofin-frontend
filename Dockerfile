FROM node:20-alpine AS build

WORKDIR /app

COPY s342-front/package.json s342-front/package-lock.json ./
RUN npm ci

# Copy app files
COPY s342-front/ ./

ARG REACT_APP_API_URL=/api/
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build for production.
RUN npm run build

FROM nginx:1.30.4-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

