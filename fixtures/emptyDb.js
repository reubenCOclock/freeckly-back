const mongoose = require("mongoose");

require("dotenv").config();

const databaseURL = process.env.MONGODB_URI;

mongoose.connect(databaseURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const emptyCollections = () => {
  // Don't use listCollection to skip
  // system.indexes MLabs specific collection
  const toPurgeIfExists = [
    "offers",
    "likes",
    "productdetails",
    "products",
    "users"
  ];

  mongoose.connection.once("open", function() {
    console.log("MongoDB connected using Mongoose.");
    for (let i = 0; i < toPurgeIfExists.length; i++) {
      const collectionName = toPurgeIfExists[i];
      mongoose.connection.db.dropCollection(collectionName, () => {
        if (i === toPurgeIfExists.length - 1) {
          mongoose.connection.close();
          console.log("close the purge connection");
        }
      });
    }
  });
};

emptyCollections();
