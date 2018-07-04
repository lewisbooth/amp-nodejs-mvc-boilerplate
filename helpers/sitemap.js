// Generates an XML sitemap by crawling the localhost site and replacing the URL

const generateSitemap = require("sitemap-generator")
const path = require('path')
const fs = require('fs')

// 1 hour expiry
const TIMEOUT = 3600000
const FILE = path.join(__dirname, '../public/sitemap.xml')
const LOCAL_URL = "http://localhost:" + process.env.PORT || 8888
const PUBLIC_URL = process.env.PUBLIC_URL || LOCAL_URL

exports.generate = () => {
  // Generate a sitemap using the local URL
  const sitemap = generateSitemap(LOCAL_URL, {
    stripQuerystring: true,
    changeFreq: 'weekly',
    filepath: FILE
  })

  const currentTime = new Date().getTime()
  let lastModified = 0

  if (fs.existsSync(FILE))
    lastModified = fs.statSync(FILE).mtimeMs

  // Regenerate sitemap if it is out of date
  if (currentTime - lastModified > TIMEOUT) {
    console.log("Generating new sitemap...")
    sitemap.start()
  }

  // When the sitemap has finished, replace the local URL with the public one
  sitemap.on('done', () => {
    fs.readFile(FILE, 'utf8', (err, data) => {
      if (err)
        return console.log(err)
      var regex = new RegExp(LOCAL_URL, "g")
      var replaceURL = data.replace(regex, PUBLIC_URL)
      fs.writeFile(FILE, replaceURL, 'utf8', err => {
        if (err)
          console.log(err)
        else
          console.log('🤖  Successfully created sitemap.xml')
      })
    })
  })
}