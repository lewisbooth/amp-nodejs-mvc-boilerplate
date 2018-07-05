//   Catch Errors Handler
//   With async/await, you need some way to catch errors
//   Instead of using try{} catch(e) {} in each controller, we wrap the function in
//   catchErrors(), catch and errors they throw, and pass it along to our express middleware with next()
exports.catchErrors = fn => {
  return function (req, res, next) {
    return fn(req, res, next).catch(next)
  }
}


// 404 Not Found Error Handler
exports.notFound = (req, res, next) => {
  if (req.accepts("html") && res.status(404)) {
    const err = new Error("Page Not Found")
    err.status = 404
    // Avoid spamming 404 console errors when sitemap is generated
    if (!req.headers['user-agent'].includes('Node/SitemapGenerator'))
      console.error(`🚫  🔥  Error 404 ${req.method} ${req.path}`)
    next(err)
  }
}


// MongoDB Validation Error Handler
// Detect if there are mongodb validation errors that we can nicely show via flash messages
exports.flashValidationErrors = (err, req, res, next) => {
  if (!err.errors)
    return next(err)
  // validation errors look like
  const errorKeys = Object.keys(err.errors)
  errorKeys.forEach(key => console.log("🔥🔥🔥  " + err.errors[key].message))
  req.flash("error", "An error occured, please try again.")
  res.redirect("back")
}

// Development Error Handler
// In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
exports.developmentErrors = (err, req, res, next) => {
  err.stack = err.stack || ""
  const errorDetails = {
    message: err.message,
    status: err.status,
    stackHighlighted: err.stack.replace(
      /[a-z_-\d]+.js:\d+:\d+/gi,
      "<mark>$&</mark>"
    )
  }
  res.status(err.status || 500)
  res.format({
    // Based on the `Accept` http header
    "text/html": () => {
      res.render("error", errorDetails)
    }, // Form Submit, Reload the page
    "application/json": () => res.json(errorDetails) // Ajax call, send JSON back
  })
}

// Production Error Handler
// No stacktraces are leaked to user
exports.productionErrors = (err, req, res, next) => {
  console.log(err)
  res.status(err.status || 500)
  res.render("error", {
    status: err.status,
    message: err.message,
    error: {}
  })
}
