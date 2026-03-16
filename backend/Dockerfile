# 로컬 개발용: Node 22 LTS
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "run", "dev"]
