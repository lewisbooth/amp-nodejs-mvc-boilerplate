const mongoose = require("mongoose")
const User = mongoose.model("User")
const passport = require('passport')
const crypto = require('crypto')
const { promisify } = require('es6-promisify')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Incorrect email or password',
  successRedirect: '/',
  successFlash: 'You are logged in'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'Success! You are logged out')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next()
  req.flash('error', 'You must be logged in to view this page')
  res.redirect(`/login?redirect=${encodeURIComponent(req.path)}`)
}

exports.validateRegister = (req, res, next) => {
  req.checkBody('email', 'That email address is not valid').isEmail()
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  })
  req.checkBody('password', 'Password cannot be blank!').notEmpty()
  const errors = req.validationErrors()
  if (errors) {
    req.flash('error', errors.map(err => err.msg))
    res.render('create-user', {
      title: "Create User",
      description:
        "Creates a user with no validation"
      , flashes: req.flash()
    })
    return
  }
  next()
}

exports.createUser = (req, res, next) => {
  const user = new User({
    email: req.body.email
  })
  const register = User.register(user, req.body.password, err => {
    if (err) {
      req.flash("error", "Email is already taken")
      console.log(err.message)
      res.render('create-user', {
        title: "Create User",
        description:
          "Creates a user with no validation"
        , flashes: req.flash()
      })
      return
    }
    req.flash("success", "User successfully created")
    next()
  })
}