const cron = require("node-cron")
const mongo = require("./helpers/mongo")
const sitemap = require("./helpers/sitemap")

// Generate a fresh sitemap if expired
sitemap.generate()

// Schedule daily sitemaps at 5am
cron.schedule("0 5 * * *", () =>
  sitemap.generate())

// Schedule daily backups at 4am
// Use helpers/mongo-backup.js and helpers/mongo-restore.js for manual backups
cron.schedule("0 4 * * *", () =>
  mongo.backup())