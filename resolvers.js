import mongoose from "mongoose";
// import { users, quotes } from "./fakedb.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const User = mongoose.model("User");
const Quote = mongoose.model("Quote");
const resolvers = {
  Query: {
    users: async () => await User.find(),
    user: async (_, { _id }) => await User.findOne({ _id }), // users.find((user) => user._id === args._id),
    quotes: async () => await Quote.find().populate("by", "_id first_name"),
    iquote: async (_, { by }) => await Quote.find({ by }), //quotes.filter((q) => q.by === args.by),
    myprofile: async (_, args, { userId }) => {
      if (!userId) throw new Error("Please login first!");
      return await User.findOne({ _id: userId });
    },
  },
  User: {
    quotes: async (ur) => await Quote.find({ by: ur._id }), // quotes.filter((quote) => quote.by === ur._id),
  },
  Mutation: {
    signupUser: async (_, { userNew }) => {
      const user = await User.findOne({ email: userNew.email });
      if (user) {
        throw new Error("User already exists with that email");
      }
      const hashedpassword = await bcrypt.hash(userNew.password, 12);
      const newUser = new User({
        ...userNew,
        password: hashedpassword,
      });
      return await newUser.save();
    },
    signinUser: async (_, { userSignin }) => {
      const user = await User.findOne({ email: userSignin.email });
      if (!user) {
        throw new Error("User does not exist");
      }
      const doMatch = await bcrypt.compare(userSignin.password, user.password);
      if (!doMatch) {
        throw new Error("Invalid password");
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      return { token };
    },
    createQuote: async (_, { name }, { userId }) => {
      if (!userId) throw new Error("Please login first!");
      const newQuote = new Quote({
        name,
        by: userId,
      });
      await newQuote.save();
      return "Quote saved successfully";
    },
    updateQuote: async (_, { quoteUpdate }, { userId }) => {
      if (!userId) throw new Error("Please login first!");
      const quote = await Quote.findOne({ _id: quoteUpdate.quoteId });
      if (!quote) throw new Error("No quote found");
      const updatedQuote = await Quote.updateOne(quote, {
        name: quoteUpdate.name,
      });
      return await Quote.findOne({ _id: quoteUpdate.quoteId });
    },
    deleteQuote: async (_, { quoteId }, { userId }) => {
      if (!userId) throw new Error("Please login first!");
      const quote = await Quote.findOne({ _id: quoteId });
      if (!quote) throw new Error("No quote found");
      await Quote.deleteOne(quote);
      return "Quote deleted successfully!";
    },
  },
};

export default resolvers;
