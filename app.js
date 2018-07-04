const express = require("express")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session)
const passport = require("passport")
require("./helpers/passport")
const { promisify } = require("es6-promisify")
const expressValidator = require("express-validator")
const cookieParser = require('cookie-parser')
const compression = require("compression")
const bodyParser = require("body-parser")
const flash = require("connect-flash")
const device = require("device")
const path = require("path")

// Helper functions & middleware
const { logging } = require("./helpers/logging")
const { cacheBuster } = require("./helpers/cacheBuster")
const errorHandlers = require("./helpers/errorHandlers")

// Load routing middleware
const routes = require("./routes/routes")
const app = express()

// Enable GZIP
app.use(compression())

// Set cache headers for static content to 1 year
const maxAge = process.env.NODE_ENV === "production" ? 31536000 : 1

// Setup static file directories
// Static requests should be served by a reverse proxy in production (e.g. Nginx)
app.use(express.static(path.join(__dirname, "public"), { maxAge }))

// Load Pug templating engine
app.set("views", "views")
app.set("view engine", "pug")

// Parses POST data into req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Data validation library
app.use(expressValidator())

// Populates req.cookies with any cookies that came along with the request
app.use(cookieParser())

// Dynamic flash messages that are passed to the template 
// (e.g. "Successfully logged in" or "Incorrect login details")
app.use(flash())

// Set cookies for tracking sessions
app.use(
  session({
    secure: true,
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
)

// PassportJS handles user logins
app.use(passport.initialize())
app.use(passport.session())

// Promisify the PassportJS login API (non-blocking)
app.use((req, res, next) => {
  req.login = promisify(req.login, req)
  next()
})

// Log non-static requests with a timestamp, HTTP method, path and IP address
app.use(logging)

// Add MDS hashes to force-download new versions of scripts
app.use(cacheBuster)

// Expose variables and functions for use in Pug templates
app.use((req, res, next) => {
  // Parses the User Agent into desktop, phone, tablet, phone, bot or car
  res.locals.device = device(req.headers['user-agent']).type
  // Pass success/error messages into the template
  res.locals.flashes = req.flash()
  // Expose the current user data if logged in
  res.locals.user = req.user || null
  // Expose the URL path
  res.locals.currentPath = req.path
  // Expose the requested query strings
  res.locals.query = req.query
  // Detect production mode
  if (process.env.NODE_ENV === "production")
    res.locals.production = true
  next()
})

// Load the routes
app.use("/", routes)

// 404 if no routes are found
app.use((req, res) => {
  if (req.accepts("html") && res.status(404)) {
    // Avoid spamming 404 console errors when sitemap is generated
    if (!req.headers['user-agent'].includes('Node/SitemapGenerator')) {
      console.error(`🚫  🔥  Error 404 ${req.method} ${req.path}`)
    }
    res.render("404")
  }
})

// Flashes Mongoose errors
app.use(errorHandlers.flashValidationErrors)

// Render error template and avoid stacktrace leaks
app.use(errorHandlers.productionErrors)

module.exports = app