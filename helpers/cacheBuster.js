// Automatically generates cache-busting JS & CSS links using an MD5 hash
// e.g. <link src="main.css?v=7815696ecbf1c96e6894b779456d330e">

const { hashFile } = require("./hashFile")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "../public")
const FOLDERS = ["css", "js"]
const FILE_TYPES = /\.css|\.js/

const hashes = {}

function generateHashes(regenerate = false) {
  let filesToHash = []
  FOLDERS.forEach(folder => {
    const folderPath = path.join(ROOT, folder)
    // Build array of files in each folder
    fs.readdirSync(folderPath)
      .filter(file => file.match(FILE_TYPES))
      .forEach(file => filesToHash.push([folder, file]))
    // Watch for changes on each folder and regenerate cache
    fs.watch(folderPath, () =>
      generateHashes({ regenerate: true }))
  })
  filesToHash.forEach(file => {
    const [directory, filename] = file
    const hash = hashFile(path.join(ROOT, directory, filename))
    // Create a full URL with hash that will work in-browser
    const url = `/${directory}/${filename}?v=${hash}`
    hashes[filename] = url
  })
  if (regenerate)
    console.log("Change detected – file hashes regenerated")
}

generateHashes()

// Pass the hashes for use in templates
exports.cacheBuster = (req, res, next) => {
  res.locals.hashes = hashes
  next()
}