# ---- Step 1: Build ----
FROM chainguard/node:latest AS build

WORKDIR /app
COPY . .
RUN npm config set registry http://172.21.0.2:4873
RUN npm install
RUN npm run build

# # ---- Step 2: Production ----
# FROM chainguard/node:latest AS prod

# WORKDIR /app

# COPY --from=build /app/dist ./dist
# COPY --from=build /app/package*.json ./

# RUN npm i --omit=dev

# EXPOSE 8080

# ENTRYPOINT [ "node", "dist/index" ]