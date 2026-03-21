import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
 await mongoose.connect(process.env.MONGODB_URI, {
  dbName: "DropMe",
});

  console.log("[db] connected");
}
