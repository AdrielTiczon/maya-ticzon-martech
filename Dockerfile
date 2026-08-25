FROM node:26-alpine

WORKDIR /app

# Install deps first so this layer is cached unless package.json changes
COPY package*.json ./
RUN npm install

# App source is also bind-mounted by docker-compose for hot-reload,
# but we copy it here too so the image works standalone (e.g. `docker build` + `docker run`)
COPY . .

EXPOSE 3000

CMD ["npx", "tsx", "watch", "index.ts"]