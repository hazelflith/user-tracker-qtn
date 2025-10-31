FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY server ./server

ENV PORT=3008
ENV MONGO_URI=mongodb://quantum:oiZZ8pRQPaGKkidAxnv0@192.168.166.6:27017/
ENV MONGO_DB=user-tracker
ENV MONGO_COLLECTION=products

EXPOSE 3008

CMD ["node", "server/index.cjs"]
