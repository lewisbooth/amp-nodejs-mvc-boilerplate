// Throw error if database is not connected

exports.checkDB = (req, res, next) => {
  if (process.env.CONNECTED === "true")
    return next()
  console.log("Database not connected")
  res.status(500)
  res.render("error", {
    status: 500,
    message: "Database not connected"
  })
}