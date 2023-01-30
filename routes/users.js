const { query } = require('express');
const express = require('express');
const router = express.Router();
let mysql = require('mysql');
const bcrypt = require('bcrypt');
const flash = require('connect-flash')
const e = require('express');


let db = mysql.createConnection({
    host: '54.245.149.137',
    user: 'server',
    password: 'keyboardPass1.',
    database: 'keyboardApp'
});

db.connect(function(err){
    if(err) {
        return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySql server.');
})


router.post('/add', async (req, res) => {
    let result = await checkUsername(req.body.username)
    if (result.length == 0){
        if (req.body.password === req.body.password1){
            if (req.body.password.length >= 8){
                bcrypt.hash(req.body.password, 10, function(err, hash){
                    let sql = 'INSERT INTO users(username, hash) VALUES (?);'
                    let values = [req.body.username, hash];
                    db.query(sql, [values], function (err, result) {
                        if (err) throw err;
                        console.log("Number of records inserted: " + result.affectedRows);
                    });
                    req.flash('message', 'Successfully Registered')
                    res.redirect('/login');
                    console.log("New user has been added");
                })
            } else {
                req.flash('message', 'Password Must Be 8 or More Characters')
                res.redirect('/register')
            }
        } else {
            req.flash('message', 'Passwords Do Not Match')
            res.redirect('/register')
        }
    } else {
        req.flash('message', 'Username Already Exists')
        res.redirect('/register')
    }
})

router.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username.length > 0){
        if (password.length > 0){
            let result = await checkUsername(username)
            if (result.length > 0){
                let hash = await getHash(username);
                console.log(hash)
                let result = await verifyUser(password, hash[0].hash)
                console.log(result)
                if (result){
                    await login(username);
                } else if (!result) {
                    req.flash('message', 'Incorrect')
                    console.log('1')
                    res.redirect('/login')
                }
            } else {
                req.flash('message', 'Username Does Not Exist')
                console.log('2')
                res.redirect('/login')
            }
        } else {
            req.flash('message', 'Please Enter a Password')
            console.log('3')
            res.redirect('/login')
        }
    } else {
        req.flash('message', 'Please Enter a Username')
        console.log('4')
        res.redirect('/login')
    }

    function verifyUser(password, hash){
        return new Promise ((resolve, reject) => {
            bcrypt.compare(password, hash, function(err, result){
                if (err){
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
    }
    function getHash(username) {
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT hash FROM users WHERE username = ?',
                [username],
                function (err, result){
                    if (err){
                        reject(err)
                    } else {
                        resolve(result)
                    }
                }
            )
        })
    }

    function login(username){
        return new Promise ((resolve, reject) =>{
            db.query(
                'SELECT * FROM users WHERE username = ?',
                [username],
                (error, results) => {
                    if (error) {
                        reject(error);
                    }
                    if (results.length > 0) {
                        req.session.isAuth = true;
                        req.session.user = username;
                        req.session.user_id = results[0].user_id;
                        req.session.dailyTrial = results[0].DailyTrial;
                        res.redirect('/dashboard');
                        console.log('login successful');
                        console.log("user route" + req.session.user)
                        req.session.save
                        resolve();
                    } else {
                        console.log('login failed');

                        resolve();
                    }
                }    
            )
        }) 
    }
});

function checkUsername(username){
    return new Promise ((resolve, reject) => {
        db.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            function(err, result){
                if (err){
                    reject(err)
                } else {
                    resolve(result)
                    }
                }
            )
        })
    }


module.exports = router;
