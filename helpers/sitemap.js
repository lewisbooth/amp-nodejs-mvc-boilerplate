const generateSitemap = require("sitemap-generator");
const path = require('path')
const fs = require('fs')

// 1 hour expiry
const timeout = 3600000
const sitemapFile = path.join(__dirname, '../public/sitemap.xml')
const localURL = "http://localhost:" + process.env.PORT || 8888

exports.generate = () => {
  // Generate a sitemap using the local URL
  const sitemap = generateSitemap(localURL, {
    stripQuerystring: true,
    changeFreq: 'weekly',
    filepath: sitemapFile
  });

  const currentTime = new Date().getTime()
  let lastModified = 0
  if (fs.existsSync(sitemapFile)) {
    lastModified = fs.statSync(sitemapFile).mtimeMs;
  }

  // Check if file already exists and is up to date
  if (currentTime - lastModified < timeout) {
    console.log('Sitemap is up to date')
    return
  } else {
    // If it's not up to date, generate a new one
    console.log("Generating new sitemap...")
    sitemap.start();
  }

  // When the sitemap has finished, replace the local URL with the public one
  sitemap.on('done', () => {
    fs.readFile(sitemapFile, 'utf8', (err, data) => {
      if (err) return console.log(err);
      var regex = new RegExp(localURL, "g")
      var replacedURL = data.replace(regex, process.env.PUBLIC_URL);
      fs.writeFile(sitemapFile, replacedURL, 'utf8', err => {
        if (err) {
          return console.log(err)
        } else {
          console.log('🤖  Successfully created sitemap.xml')
        }
      });
    });
  });
}