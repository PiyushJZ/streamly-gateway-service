FROM chainguard/node:latest

WORKDIR /app

COPY . .

EXPOSE 8080

ENTRYPOINT [ "node", "dist/index" ]