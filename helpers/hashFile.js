const fs = require("fs")
const path = require("path")
const md5 = require("md5")

exports.hashFile = filePath => {
  const file = fs.readFileSync(filePath)
  return md5(file)
}