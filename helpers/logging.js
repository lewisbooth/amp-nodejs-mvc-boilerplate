// Logs dynamic access requests in the format
// Wed Jul 04 2018 14:23:45 GMT+0100 (BST) GET /create-user ::ffff:127.0.0.1 test-user
exports.logging = (req, res, next) => {
  // Ignore sitemap generator
  if (req.headers['user-agent'].includes('Node/SitemapGenerator'))
    return next()
  const timestamp = new Date().toString()
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress
  console.log(`${timestamp} ${req.method} ${req.path} ${ip} ${req.user ? req.user.username : ""}`)
  if (req.method === "POST" && req.body)
    console.log(req.body)
  next()
}