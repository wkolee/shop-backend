const User = require("../models/user");
const { errorHandler } = require('../helpers/dbErrorsHandler');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');


/*
exports.signup = (req, res) => {
    //console.log("req.body", req.body);
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                err: errorHandler(err)
            });
        }
        user.salt = undefined
        user.hashed_password = undefined
        res.json({
            user
        });
    });
};
*/

exports.signup = (req, res) => {
    // console.log("req.body", req.body);
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                // error: errorHandler(err)
                error: 'Email is taken'
            });
        }
        user.salt = undefined;
        user.hashed_password = undefined;
        res.json({
            user
        });
    });
};

exports.signin = (req, res)=>{
    //find user by email
    const {email, password} = req.body
    User.findOne({email}, (err, user)=>{
        if(err || !user){
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            })
        }
        //if user find make sure the email and password match
        //create authenticate method in user model
        if(!user.authenticate(password)){
            return res.status(401).json({
                error: "Email and password don't match"
            })
        }
        //generate a sign token with user id and secrete 
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET)
        //PERSIST THE TOKEN AS 'T' in cookie with expiry date

        res.cookie('t', token, {expire: new Date() + 9999});
        //return response with user and token to frontend client
        const {_id, name, email, role} = user
        return res.json({token,  user: {_id, email, name, role}});
    });

};

exports.signout = (req, res)=>{
    res.clearCookie('t');
    res.json({message: "Signout successful"});

}

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET, 
    userProperty: "auth"
});

exports.isAuth = (req, res, next)=>{
    let user = req.profile && req.auth && req.profile._id == req.auth._id
        if(!user){
            return res.status(403).json({
                error: "Access denied"
            });
        }
    next()

};

exports.isAdmin = (req, res, next)=>{
    if(req.profile.role === 0){
        return res.status(403).json({
            error: "Access to Admin page denied "
        });

    }
    next();
};