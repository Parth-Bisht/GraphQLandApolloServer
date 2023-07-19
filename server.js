import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
} from "apollo-server-core";
import typeDefs from "./schemaGql.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import express from "express";
import http from "http";

const app = express();
const httpServer = http.createServer(app);

if (process.env.NODE_ENV != "production") {
  dotenv.config();
}
const port = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to mongodb");
});

mongoose.connection.on("error", (err) => {
  console.log("error connecting", err);
});

import "./models/Quotes.js";
import "./models/User.js";

import resolvers from "./resolvers.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: {
    maxSize: 100,
  },
  context: ({ req }) => {
    const { authorization } = req.headers;
    if (authorization) {
      const { userId } = jwt.verify(authorization, process.env.JWT_SECRET);
      return { userId };
    }
  },
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    process.env.NODE_ENV != "production"
      ? ApolloServerPluginLandingPageGraphQLPlayground()
      : ApolloServerPluginLandingPageDisabled(),
  ],
});

// if (process.env.NODE_ENV == "production") {
// app.use(express.static("client/build"));
// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
// });
// }

await server.start();
server.applyMiddleware({
  app,
  path: "/graphql",
});
httpServer.listen({ port }, () => {
  console.log(`Server ready at ${port} ${server.graphqlPath}`);
});
