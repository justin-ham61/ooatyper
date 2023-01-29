const { query } = require('express');
const express = require('express');
const router = express.Router();
let mysql = require('mysql');
const bcrypt = require('bcrypt');
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
        if (req.body.password === req.body.password1 && req.body.password.length >= 8){
            bcrypt.hash(req.body.password, 10, function(err, hash){
                let sql = 'INSERT INTO users(username, hash) VALUES (?);'
                let values = [req.body.username, hash];
                db.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    console.log("Number of records inserted: " + result.affectedRows);
                });
                res.redirect('/login');
                console.log("New user has been added");
            }
            )
        }
    } else {
        res.redirect('/register')
    }
})

router.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let result = await checkUsername(username)
    if (result.length > 0){
        if (username.length > 1){
            let hash = await getHash(username);
            console.log(hash)
            bcrypt.compare(password, hash[0].hash, function(err, result){
                if (result){
                    login(username);
                } else {
                    res.redirect('/login')
                }
            })
        } else {
            res.redirect('/login')
        }

    } else {
        res.redirect('/login')
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
