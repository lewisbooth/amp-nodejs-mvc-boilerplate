const mongoose = require("mongoose");
const mongo = require("./helpers/mongo");
const sitemap = require("./helpers/sitemap");
const cron = require("node-cron");
const ip = require("ip");

// Load environment variables
require("dotenv").config({ path: "variables.env" });

// Expose an easy path to root directory for scripts that are nested in folders
process.env.ROOT = __dirname;

// Initiate the database connection
mongoose.connect(process.env.DATABASE, {
  autoReconnect: true,
  reconnectTries: 100,
  reconnectInterval: 5000
}, err => {
  if (err) {
    console.error("🚫 Error connecting to MongoDB");
    console.error(err.message)
  } else {
    console.log("Connected to MongoDB")
  }
});

// Use better promises for Mongo queries
mongoose.Promise = global.Promise;

// Load the MongoDB models
require("./models/User");

// Schedule daily backups at 4am
// Manual database management is available using helpers/mongo-backup.js and helpers/mongo-restore.js
cron.schedule("0 4 * * *", () => {
  mongo.backup()
});

// Generate a fresh sitemap 
// Skipped if sitemap is < 1 hour old
sitemap.generate()

// Schedule daily sitemaps at 5am
cron.schedule("0 5 * * *", () => {
  sitemap.generate()
});

// Load server scripts
const app = require("./app");
app.set("port", process.env.PORT || 8888);

// Initiate the server
const server = app.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
  if (process.env.NODE_ENV === "production") {
    console.log("⚡  Production Mode ⚡");
  } else {
    console.log("🐌  Development Mode 🐌 ");
  }
  console.log("Local address: " + ip.address());
});
