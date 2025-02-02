
const express = require('express')
const app = express()
const cors = require('cors')

const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const jwt = require('jwt-simple')
const {MONGODB_URL}=require('./config/keys')
const {MONGO_URL}=require('./config/keys')
const {EMAIL}=require('./config/keys')
const {PASSWORD}=require('./config/keys')
const PORT=process.env.PORT||9000
const {RPORT}=require('./config/keys')
var fs = require('fs')

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

let productModel = require('./db/product')
app.use(cors())
let userModel = require('./db/user')
const nodemailer = require('nodemailer')
let adminModel = require('./db/admin')
app.use(bodyParser.urlencoded({ extended: false }))




app.use(bodyParser.json())
const multer = require('multer')

let dir = "./upload"
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dir)
    }, filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
})
let uploa = multer({ storage: storage }).single('attach')
app.use(express.static(__dirname + '/upload'))

if (process.env.NODE_ENV == "production") {
    app.use(express.static(__dirname+'/front/build'))
    const path=require('path')
    app.get('*',(req,res)=>{
        res.sendFile(path.resolve(__dirname,'front','build','index.html'))
                  

})}


app.listen(PORT, () => {
    console.log(`working on ${PORT}`)

})

                }
            })

        }
    })

})



app.delete("/delpro/:v", (req, res) => {
    let v = req.params.v

    productModel.deleteOne({ _id: v }, (err, data) => {
        if (err || data == null) {
            res.json({ err: 1, mssg: "something went wrong" })
        }
        else {
            res.json({ err: 0, mssg: "product is deleted successfully" })
        }

    })
})


app.post("/upprobyimage", (req, res) => {
    uploa(req, res, err => {
        if (err) {
            res.json({ "err": 1, "mssg": "image not uploaded" })
        }
        else {
            let pro = req.body.pro
            let fname = req.file.filename
            let str = ""

            str = "{" + pro + ',"image":"' + fname + '"}'
            let v = JSON.parse(str).cid

            productModel.updateOne({ _id: v }, { $set: JSON.parse(str) }, (err, data) => {
                if (err) {
                    res.json({ "err": 1, "mssg": "something went wrong" })
                }
                else {
                    res.json({ "err": 0, "mssg": "product is updated successfully" })

                }
            }
            )

        }
    })

})



app.get("/wish/:v", (req, res) => {
    let v = req.params.v

    userModel.findOne({ email: v }, (err, data) => {


        res.json(data.wish)

    })
})







app.post("/registersl", (req, res) => {
    userModel.findOneAndUpdate({ email: req.body.email }, { $set: { email: req.body.email, name: req.body.name } }, { upsert: true }, function (err, data) {

        if (err) {
            res.json({ "err": 1, "mssg": "something went wrong" })

        }
        else {
            res.json({ "err": 0, "mssg": "you are logged in ", "uid": { name: req.body.name, email: req.body.email } })


        }
    }
    )

})



app.post("/login/:s", (req, res) => {
    let s = req.params.s
    if (s == "user") {

        userModel.findOne({ email: req.body.email }, (err, data) => {

            if (err) {
                res.json({ "err": 1, "mssg": "something went wrong" })

            }
            else if (data == null) {
                res.json({ "err": 1, "mssg": "user does not exists" })

            }
            else {
                if (data.validPassword(req.body.password)) {
                    res.json({ "err": 0, "mssg": "", "uid": { name: data.name, email: req.body.email } })

                }
                else {
                    res.json({ "err": 1, "mssg": " password is  not correct" })

                }

            }
        }
        )
    }

    if (s == "admin") {

        adminModel.findOne({ "email": req.body.email, "password": req.body.password }, (err, data) => {



            if (err) {
                res.json({ "err": 1, "mssg": "something went wrong" })

            }
            else if (data == null) {
                res.json({ "err": 1, "mssg": "email or password not correct" })

            }
            else {
                res.json({ "err": 0, "mssg": "", "uid": { name: data.name, email: req.body.email } })


            }
        }
        )
    }
})



app.post("/upname", (req, res) => {
    let email = req.body.email;
    let name = req.body.name;

    userModel.updateOne({ email: req.body.email }, { $set: { name: name } }, (err, data) => {
        if (err || data.nModified == 0) {
            res.json({ "err": 1, "mssg": "something went wrong" })

        }
        else {
            res.json({ err: 0 })
        }

    }
    )
}
)



app.post("/resetpassword", async (req, res) => {
    var email = req.body.email
    await userModel.findOne({ email: email }, (err, data) => {
        if (err) {
            res.json({ "err": 1, "mssg": "something went wrong" })

        }

        else if (data == null) {
            res.json({ "err": 1, "mssg": "user does not exist" })

        }
        else {

            var payload = {
                email: data.email
            }
            var t = Date.now()
            var secret = data._id + '-' + t
            var token = jwt.encode(payload, secret)

            var transporter = nodemailer.createTransport({
                service: "Gmail",

                auth: {

                    user: EMAIL,
                    pass: PASSWORD
                }

            })
            const mailOptions = {
                to: email,
                subject: "Reset Password",
                html: `<h4>visit the given link to reset your password.Ignore if you have not attempted to reset password\
                             <a href='${RPORT}/resetpassword/` + payload.email + "/" + token + "'>Click here</Link> </h4>"
            }

            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err);

                    res.json({ err: 1, mssg: "something went wrong" })
                } else {
                    userModel.updateOne({ email: email }, { $set: { latestrespass: { ltime: t, ltoken: token } } }, (err, data) => {
                        if (err) {
                            res.json({ err: 1, mssg: "something went wrong" })
                        }
                        else {
                            res.json({ err: 0, mssg: "link has been sent to the desired email to reset password" })

                        }

                    })
                }


            })

        }
    })

})


app.post("/resetpasswordaftermail", (req, res) => {

    let email = req.body.id
    userModel.findOne({ email: email }, (err, data) => {

        if (Date.now() - data.latestrespass.ltime <= 1800000) {

            if (data.latestrespass.ltoken == req.body.token) {

                userModel.findOne({ email: email }, (err, data) => {
                    data.setPassword(req.body.npassword)
                    data.save(err => {
                        if (err) {
                            res.json({ err: 1, mssg: "something went wrong" })
                        }
                        else {
                            userModel.updateOne({ email: email }, { $set: { latestrespass: {} } }, (err, data) => {

                            })

                            res.json({ err: 0, mssg: "password reset successful" })

                        }
                    }
                    )


                })
            }
            else {
                res.json({ err: 1, mssg: "invalid link" })

            }
        }

        else {
            res.json({ err: 1, mssg: "Time limit exceeded! Request to reset password again" })
        }
    }

    )


})

app.post("/addaddress", (req, res) => {

    userModel.update({ "email": req.body.email }, { $push: { address: req.body.address } }, (err, data) => {
        if (err || data.nModified == 0) {
            res.json({ err: 1, mssg: "something went wrong" })
        }
        else {
            res.json({ err: 0 })
        }

    })


})

app.get("/getaddress/:v", (req, res) => {
    let emaile = req.params.v
    userModel.findOne({ email: emaile }, (err, data) => {

        if (err) {
            res.json({ err: 1, mssg: "somthing went wrong" })
        }
        else {

            res.json(data.address)
        }
    })
})

app.get("/deladdress/:v/:ind", async (req, res) => {
    let emaile = req.params.v
    let inde = req.params.ind

    var adid = `address.${inde}`
    await userModel.update({ email: emaile }, { $unset: { [adid]: 1 } }, (err, data) => {

    })
    await userModel.update({ email: emaile }, { $pull: { "address": null } }, (err, data) => {

    })

    res.json("")
})





app.post("/atc", async (req, res) => {
    let x = "do"
    let ide = req.body.id
    let emaile = req.body.email

    let quantitye = req.body.quantity

    await userModel.findOne({ email: emaile, "cart.id": ide }, async (err, data) => {
        if (err) {
            res.json({ err: 1, mssg: "something went wrong" })
        }
        else if (data == null) {
            userModel.updateOne({ "email": emaile }, { $push: { cart: { "id": ide, "quantity": quantitye } } }, { upsert: true }, (err, data) => {

                if (err) {
                    res.json({ err: 1, mssg: "something went wrong" })
                }
                else if (data.nModified == 0) {
                }
                else {
                    res.json({ err: 0 })


                }


            })
        }
        else {
            userModel.updateOne({ email: emaile, "cart.id": ide }, { $inc: { "cart.$.quantity": quantitye } }, (err, data) => {


                if (err || data.nModified == 0) {
                    res.json({ err: 1, mssg: "something went wrong" })
                }
                else {
                    res.json({ err: 0 })
                }

            })
        }
    })

})



app.post("/upcartq", (req, res) => {
    let ide = req.body.pid
    let emaile = req.body.email

    let quantitye = req.body.quantity


    userModel.updateOne({ "email": emaile, "cart.id": ide }, { $set: { cart: { "quantity": quantitye, id: ide } } }, (err, data) => {

        if (err || data.nModified == 0) {
            res.json({ err: 1, mssg: "something went wrong" })
        }

        else {
            res.json({ err: 0 })

        }


    })



})


app.post("/atw", async (req, res) => {
    let ide = req.body.id
    let emaile = req.body.email
    let x = "do"
    await userModel.findOne({ email: emaile, wish: ide }, (err, data) => {
        if (err) {
            res.json({ err: 1, mssg: "something went wrong" })

        }
        else if (data == null) {
            x = "add"

        }
        else {
            res.json({ err: 0, mssg: "product is already present in wishlist" })
        }


    })
    if (x == "add") {
        userModel.update({ "email": emaile }, { $push: { wish: ide } }, (err, data) => {
            if (err || data.nModified == 0) {
                res.json({ err: 1, mssg: "something went wrong" })
            }
            else {
                res.json({ err: 0, mssg: "product is added successfully to wshlist" })
            }

        })
    }
})

