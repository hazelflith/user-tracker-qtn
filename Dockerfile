FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY server ./server

ENV PORT=3000
ENV MONGO_URI=mongodb://mongo:27017/user-tracker
ENV MONGO_DB=user-tracker
ENV MONGO_COLLECTION=products

EXPOSE 3000

CMD ["node", "server/index.cjs"]
