// Generates an XML sitemap by crawling the localhost site and replacing the URL
const generateSitemap = require("sitemap-generator")
const fs = require('fs')

// Cache sitemap for X milliseconds (3600000 = 1 hour)
const TIMEOUT = 3600000
const SITEMAP_FILE = `${process.env.PUBLIC_FOLDER}/sitemap.xml`
const LOCAL_URL = `http://localhost:${process.env.PORT || 8888}`
const PUBLIC_URL = process.env.DOMAIN_NAME || LOCAL_URL

exports.generate = () => {
  // Configure sitemap generator using the local URL
  const sitemap = generateSitemap(LOCAL_URL, {
    stripQuerystring: true,
    changeFreq: 'weekly',
    filepath: SITEMAP_FILE
  })

  // Check age of current file, if it exists
  const currentTime = new Date().getTime()
  let lastModified = fs.existsSync(SITEMAP_FILE) ?
    fs.statSync(SITEMAP_FILE).mtimeMs : 0
  const age = currentTime - lastModified

  // Regenerate sitemap if it is out of date
  if (age > TIMEOUT) {
    console.log("Generating new sitemap...")
    sitemap.start()
  }

  // When the sitemap has finished, replace the local URL with the public one
  sitemap.on('done', () => {
    fs.readFile(SITEMAP_FILE, 'utf8', (err, data) => {
      if (err)
        return console.error(err)
      var regex = new RegExp(LOCAL_URL, "g")
      var replaceURL = data.replace(regex, PUBLIC_URL)
      fs.writeFile(SITEMAP_FILE, replaceURL, 'utf8', err => {
        if (err)
          console.log(err)
        else
          console.log('🤖  Successfully created sitemap.xml')
      })
    })
  })
}