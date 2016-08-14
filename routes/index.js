var express = require('express');
var router = express.Router();
var passport = require('passport');
var Status = require('../models/status');
var User = require('../models/user');
var busboy = require('connect-busboy');
var fs = require('fs');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Whitter!!' });
});

router.get('/login', function(req,res){
  res.render('login', {message: req.flash('loginMessage')});
});

router.post('/login', passport.authenticate('user-login', {
  successRedirect: '/myprofile',
  failureRedirect: '/login',
  failureFlash: true,
}));

router.get('/signup', function(req,res){
  res.render('signup', {message: req.flash('signupMessage')});
});

router.post('/signup', passport.authenticate('user-signup', {
  successRedirect: '/myprofile',
  failureRedirect: '/signup',
  failureFlash: true,
}));

router.get('/myprofile', isLoggedIn, function(req, res){
  console.log('Loading all statuses for user', req.user);
  // Use our status model to find everything via find
  Status.find({'username': req.user.username},function(err, allStatus){
      if (err) res.send(err);
      //console.log(allStatus);
      res.render('profile', {user: req.user, statuses: allStatus});
  });
})

router.post('/delete', isLoggedIn, function(req, res){
  console.log('Deleting status', req.body.statusid);
  Status.remove({_id:  req.body.statusid}, function(err,statusDeleted){
        if (err) res.send(err);
          res.redirect('/myprofile');
  });
})

router.post('/newstatus', isLoggedIn, function(req,res){
    // Move this logic to status model or create different model
    console.log('Posting to status api with status %j', req.body.status);
    var status = new Status(); // new instance of status model - as we are adding to the DSB
    status.status = req.body.status // set the status to status that comes from request
    status.username = req.user.username;
    //save our new status object
    status.save(function(err){
     if (err) res.send(err);
        res.redirect('/myprofile');
    });
})

router.post('/saveStatus', isLoggedIn, function(req,res){
    console.log('Updating status %j with new status %j',req.body.statusid,req.body.editedStatus);
    Status.findById(req.body.statusid, function(err, statusToUpdate){
      if (err) res.send(err);
      //once we have a valid response update the nextStatus attribute to status passed in
      console.log(statusToUpdate);
      statusToUpdate.status = req.body.editedStatus;
       //save our callback object
      statusToUpdate.save(function(err){
        if (err) res.send(err);
        console.log('Status updated');
        res.redirect('/myprofile');
      });
    });
});

router.post('/editUser', isLoggedIn, function(req,res){
  console.log('Updating user %j details', req.user);
  console.log();
  console.log('----------------------------');
  User.findById(req.user._id, function(err, userToUpdate){
     console.log(userToUpdate);
     userToUpdate.name = req.body.realName;
     userToUpdate.description = req.body.userDescription;

     userToUpdate.save(function(err){
       if (err) res.send(err);
       console.log('User details updated');
       res.json({ success: true });
     });
  });
});

router.post('/uploadHeaderPic', isLoggedIn, function(req,res){
   req.pipe(req.busboy);
   var fstream;
   var userFileLocation
   req.busboy.on('file', function (fieldname, file, filename) {
      console.log("Uploading" + filename);
      userFileLocation = '/img/' + filename;
      fstream = fs.createWriteStream(process.env.PWD + '/public/img/' + filename);
      file.pipe(fstream);
      fstream.on('close', function() {
         console.log("Upload finished of " + filename);
         User.findById(req.user._id, function(err, userToUpdate){
             userToUpdate.headerImage = userFileLocation;
             userToUpdate.save(function(err){
             if (err) res.send(err);
                console.log('User details updated');
                res.status(200).send(userFileLocation);
             });
         });

      });
   });   
});

router.post('/uploadProfilePic', isLoggedIn, function(req,res){
   req.pipe(req.busboy);
   var fstream;
   var userFileLocation
   req.busboy.on('profileFileUpload', function (fieldname, file, filename) {
      console.log("Uploading" + filename);
      userFileLocation = '/img/' + filename;
      fstream = fs.createWriteStream(process.env.PWD + '/public/img/' + filename);
      file.pipe(fstream); 
      fstream.on('close', function() {
         console.log("Upload finished of " + filename);
         User.findById(req.user._id, function(err, userToUpdate){
             userToUpdate.profileImage = userFileLocation;
             userToUpdate.save(function(err){
             if (err) res.send(err);
                console.log('User details updated');
                res.status(200).send(userFileLocation);
             });
         });

      });
   });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;

function isLoggedIn(req, res, next){
  if (req.isAuthenticated())
     return next();
  res.redirect('/');
}
