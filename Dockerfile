FROM node:22-alpine

WORKDIR /workspace/backend

COPY package*.json ./
RUN npm install -g @nestjs/cli
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
