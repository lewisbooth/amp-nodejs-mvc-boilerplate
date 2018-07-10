// Automatically generates cache-busting JS & CSS links using an MD5 hash
// e.g. <link src="main.css?v=7815696ecbf1c96e6894b779456d330e">

const { hashFile } = require("./hashFile")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "../public")
const FOLDERS = ["css", "js"]
const FILE_TYPES = /\.css|\.js/
const DEBOUNCE = 200

let debounce = false

const hashes = {}

function generateHashes() {
  if (debounce) return
  debounce = true
  let filesToHash = []
  FOLDERS.forEach(folder => {
    // Absolute path to folder
    const folderPath = path.join(ROOT, folder)
    // Build array of files in folder
    fs.readdirSync(folderPath)
      .filter(file => file.match(FILE_TYPES))
      .forEach(file => filesToHash.push([folder, file]))
    // Watch for changes and regenerate cache
    fs.watch(folderPath, generateHashes)
  })
  filesToHash.forEach(file => {
    const [directory, filename] = file
    const md5 = hashFile(path.join(ROOT, directory, filename))
    // Create a full URL with hash that will work in-browser
    const url = `/${directory}/${filename}?v=${md5}`
    hashes[filename] = url
  })
  setTimeout(() => debounce = false, DEBOUNCE)
}

generateHashes()

// Expose the hashes for use in view templates
exports.cacheBuster = (req, res, next) => {
  res.locals.hashes = hashes
  next()
}