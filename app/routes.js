module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
      console.log(req.user)
        db.collection('messages').find({user: req.user.local.email}).toArray((err, result) => {
          let workFiltered = result.filter((task) => task.tag == 'work')
          let fitnessFiltered = result.filter((task) => task.tag == 'fitness')
          let mental = result.filter((task) => task.tag == 'mental-health')
          let home = result.filter((task) => task.tag == 'home')
          let rcWork = result.filter((task) => task.tag == 'rc-work')
console.log(workFiltered)
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            workFiltered,
            home,
            mental,
            fitnessFiltered,
            rcWork
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out.')
        });
        res.redirect('/');
    });

// message board routes ===============================================================

app.post('/dates', (req, res) => { 
  console.log(req.body)
  db.collection('messages').insertOne({name:req.body.name, tag: req.body.tag, user: req.user.local.email, completed: false},
  (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database', result)
    res.redirect('/profile')
  })
})

app.put('/dates', (req, res) => {
  db.collection('messages').findOneAndUpdate({name: req.body.name.trim()}, {
    $set: {
      completed: true
    }
  }, (err, result) => {
    if (err) return res.send(err)
    res.redirect('/profile')
  })
})

    app.delete('/dates', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name.trim(),}, (err, result) => {
        
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
