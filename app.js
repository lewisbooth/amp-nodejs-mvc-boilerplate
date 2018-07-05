const express = require("express")
const app = express()
const mongoose = require("mongoose")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session)
const { promisify } = require("es6-promisify")
const expressValidator = require("express-validator")
const cookieParser = require('cookie-parser')
const compression = require("compression")
const bodyParser = require("body-parser")
const flash = require("connect-flash")
const device = require("device")
const path = require("path")

// Helper functions & middleware
const { checkDB } = require("./helpers/checkDB")
const { logging } = require("./helpers/logging")
const { truncate } = require("./helpers/truncate")
const { cacheBuster } = require("./helpers/cacheBuster")
const errorHandlers = require("./helpers/errorHandlers")
const routes = require("./routes/routes")
const passport = require("passport")
require("./helpers/passport")

// Load Pug templating engine
app.set("views", "views")
app.set("view engine", "pug")

// Enable GZIP
app.use(compression())

// Set cache headers for static content to 1 year
const maxAge = process.env.NODE_ENV === "production" ? 31536000 : 1

// Serve static files
// These should be served via reverse proxy in production (e.g. Nginx)
app.use(express.static(process.env.PUBLIC_FOLDER, { maxAge }))

// Log dynamic requests
app.use(logging)

// Throw error safely if DB is not connected
app.use(checkDB)

// Session cookies
app.use(
  session({
    secure: true,
    resave: false,
    key: process.env.KEY,
    secret: process.env.SECRET,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    })
  })
)

// Load PassportJS authentication
app.use(passport.initialize())
app.use(passport.session())

// Promisify the PassportJS login API (non-blocking)
app.use((req, res, next) => {
  req.login = promisify(req.login, req)
  next()
})

// Parse POST data into req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Parse cookies into req.cookies
app.use(cookieParser())

// Dynamic flash messages are passed to the view templates 
// (e.g. "Successfully logged in" or "Incorrect login details")
app.use(flash())

// Data validation library
app.use(expressValidator())

// Add MDS hashes to automatically version CSS/JS
app.use(cacheBuster)

// Expose variables and functions to view templates
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
  // Safely format descriptions
  res.locals.truncate = truncate
  // Detect production mode
  if (process.env.NODE_ENV === "production")
    res.locals.production = true
  next()
})

// Pass the request to routing middleware
app.use("/", routes)

// 404 if no routes handle the request
app.use(errorHandlers.notFound)

// Flash Mongoose errors
app.use(errorHandlers.flashValidationErrors)

// Error page with stacktrace during development
if (app.get('env') === 'development')
  app.use(errorHandlers.developmentErrors)

// Error page with no stacktrace in production
app.use(errorHandlers.productionErrors)

module.exports = app