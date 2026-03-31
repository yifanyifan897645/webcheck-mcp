FROM apify/actor-node:20

COPY package*.json ./
RUN npm install --include=dev

COPY src/ ./src/
COPY tsconfig.json ./
RUN ./node_modules/.bin/tsc
RUN npm prune --omit=dev

CMD ["node", "dist/main.js"]
