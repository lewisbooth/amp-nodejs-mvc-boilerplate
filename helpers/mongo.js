require("dotenv").config({ path: "variables.env" })
const mongoBackup = require("mongodb-backup")
const mongoRestore = require("mongodb-restore")
const tar = require("tar")
const fs = require("fs")
const mkdirp = require("mkdirp")
const rmdir = require("rmdir")
const S3 = require("./S3")

// Restore database from S3, giving user a choice of most recent backups
exports.restore = async () => {
  console.log("Restoring files")
  // Create backup folder
  mkdirp.sync("mongodb/temp")
  // Offers the user a choice of S3 backups to download
  const downloadFile = await S3.downloadIndex(
    process.env.S3_BACKUP_BUCKET_NAME,
    'mongodb/temp'
  )
  if (!downloadFile)
    return
  // Extract the tarball into a temp folder
  tar.x({
    file: downloadFile,
    cwd: "mongodb/temp"
  }).then(err => {
    if (err)
      return console.log("Error extracting tarball \n" + err)
    if (!fs.existsSync("mongodb/temp/mongodb"))
      return console.log("No database backup found in tarball")
    const dbName = process.env.DATABASE.split("/").pop()
    // Restore database if a backup was in the tarball
    mongoRestore({
      drop: true,
      uri: process.env.DATABASE,
      root: `mongodb/temp/mongodb/backup/${dbName}`,
      callback: err => {
        if (err)
          return console.log("Error restoring database \n" + err)
        console.log("Successfully restored database")
        // Remove temp folder
        rmdir('mongodb/temp', err => {
          if (err)
            console.log("Error deleting temp folder \n" + err)
          else
            console.log("Cleaned up temp folder")
        })
      }
    })
  })
}

exports.backup = () => {
  console.log("Backing up files")
  // Create backup folder
  mkdirp.sync("mongodb")
  // Format timestamp to weekday-month-date-year-hour-min-sec
  // E.g thu-feb-15-2018-10-11-01 
  const timestamp = new Date()
    .toString()
    .toLowerCase()
    .split(" ")
    .splice(0, 5)
    .join("-")
    .split(":")
    .join("-")
  // Dump database into local backup folder
  mongoBackup({
    uri: process.env.DATABASE,
    root: "mongodb/backup",
    callback: err => {
      if (err)
        return console.log(err)
      console.log("Successfully backed up database to mongodb/backup")
      // Tarball the database dump
      tar.c({ file: `mongodb/${timestamp}.tgz` },
        ["./mongodb/backup"]
      ).then(_ => {
        // Upload the tarball to S3
        S3.upload(
          process.env.S3_BACKUP_BUCKET_NAME,
          `mongodb/${timestamp}.tgz`
        )
        // Restrict S3 bucket to 30 entries
        S3.cleanBucket(process.env.S3_BACKUP_BUCKET_NAME, 30)
        // Clean up temp folder
        rmdir('mongodb/backup', err => {
          if (err)
            console.log("Error deleting temp folder \n" + err)
        })
      })
    }
  })
}