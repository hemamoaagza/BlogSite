const bodyParser = require("body-parser");
const express= require ("express");
const app = express();
const mongoose = require("mongoose");
const md5 = require("md5");
const _ = require('lodash');
const cookieParser = require('cookie-parser');
const jwt =require("jsonwebtoken");
const session = require("express-session");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs')


// mongoose section
// mongodb+srv://hemaelmoaagza:hema1909tato@blogsite.v3sd5jo.mongodb.net/blogDB
const Schema = mongoose.Schema;
const mongouri= "mongodb+srv://hemaelmoaagza:hema1909tato@blogsite.v3sd5jo.mongodb.net/blogDB";

mongoose.connect(mongouri).then((res)=>{
    console.log("mongodDB Connected")
})



// session section 



app.use(cookieParser())

// cookies saved 

const secret= "MoaagzaFBI"


const isAuth=(req,res,next)=>{

    const token=req.cookies.token;
    try{
        const user = jwt.verify(token,secret);
        req.user= user;
        next();
    }catch(err){
        console.log("auth failed")
        res.clearCookie("token");
        return res.redirect("/");
    }
}


const blogSchema =new Schema ({
    title : String,
    content :String
});
const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
    },
    password:String,
    email:String,
    NotSecurepassword:String
});

// the database files

const blog= mongoose.model("post", blogSchema)
const User= mongoose.model("User",userSchema)







// sign up & login section


app.get ("/signup", (req,res)=>{
    
    
    res.render("pages/users/signup")




})

app.post("/signup",async function(req,res){
const {US,PS,EM}=req.body;


if (!US || !PS || !EM ){
    res.redirect("/accountfailure")
    return;
}else {

    let user= await User.findOne({userName:US});

if(user){
    return res.redirect("/accountfailure")
}

const newuser= new User ({
        userName:US,
        email: EM,
        password: md5(PS),
        NotSecurepassword: PS,
    })
    
newuser.save();

res.redirect("/accountsuccess")

}


})

app.get("/", (req,res)=>{

    res.render("pages/users/login")
})


app.post("/login", async (req,res)=>{


    const UserName= req.body.US
    const password = md5(req.body.PS)
    
    try {
    


    // check if is not filled

    if (!UserName || !password ){
        res.redirect("/accountfailure")
        return;
    } else {

        const user = await User.findOne({userName:UserName});

        if(!user){
            res.redirect("/accountfailure")
        }
        if(user.password === password){

            const token= jwt.sign(user.toJSON(),secret,{expiresIn:"1h"});
            
            res.cookie("token",token,{
                httpOnly:true,
                secure:true,
                
            });
            
            res.redirect("/mainpage")
            
        }else{
            res.redirect("/accountfailure")
        }


    }
        
    }catch (reason){
        console.log(`err : ${reason}`)
    }
    
    console.log("logged in")
    

})

app.get("/logout",(req,res)=>{
   
    res.status(202).clearCookie('token')
    res.redirect("/")
    

    

})



// accounts alerts 


app.get("/accountsuccess",function(req,res){
    res.render("pages/users/success")


});
app.get("/accountfailure",function(req,res){
    res.render("pages/users/failure")

})

app.post("/accountfailure", (req,res)=>{

    res.redirect("/")
})
app.post("/accountsuccess", (req,res)=>{

    res.redirect("/mainpage")
})



// Home section 

app.get("/mainpage",isAuth, async function(req,res){
    

        try {
        const foundItems = await blog.find();
        res.render("pages/mainpage", { posts: foundItems });
        } catch (error) {
          // Handle the error
        console.error(error);
        res.status(500).send('An error occurred');
        }
    

});


// navbar 

app.get("/compose",isAuth,function(req,res){
    res.render("pages/compose")


});

app.get("/about",isAuth,function(req,res){
    res.render("pages/about")


});
app.get("/contact",isAuth,function(req,res){
    res.render("pages/contact")


});

// site alerts & redirects

app.get("/success",function(req,res){
    res.render("pages/success")


});
app.get("/failure",function(req,res){
    res.render("pages/failure")


});


app.post("/success",function(req,res){
    res.redirect("/mainpage")
})
app.post("/failure",function(req,res){
    res.redirect("/compose")
})


// site content & compose

app.get("/posts/:topics",isAuth,function(req,res){
    const requestedTopic = _.lowerCase (req.params.topics);
    console.log(requestedTopic)
    blog.find({title:requestedTopic}).then(function(founditems){
        
        founditems.forEach(function(post){
            console.log(post)
    
        
                res.render("pages/post" , {title :post.title , content : post.content , posts:founditems})
                
        
            

    })
    
    })
    

});

app.post("/",function(req,res){

    const post = {
        title: req.body.TN ,
        content : req.body.PN
    }
    const data =[]

    data.push(_.lowerCase(post.title))

    if(data  == ""){

        
        res.redirect("/failure")
    }else if(post.content==""){
        res.redirect("/failure")
    }
    
    else{
        blog.findOne({title:data[0]}).then(function(err,foundtitle){
        
            if(!err){
                
                if(!foundtitle){
                    
                    const RDATA = new blog ({
                        title: _.lowerCase(post.title),
                        content: post.content
                    })
                    RDATA.save();
                    
                }} else{
                    console.log("Title Header not available")
                    
                }
            })
        
        
        
            res.redirect("/success")
        
        
    
}
})


app.post("/delete", function(req,res){
    


    const itemID = req.body.button;

    blog.findByIdAndDelete(itemID).then(function(err){
        if(err){
            console.log(err)
        }else{
            console.log("sucess removing item")
        }
    })

    // blog.findByIdAndUpdate(itemID,{content:"its moaagza"}).then(function(err){
    //     if (!err){
    //         console.log("Success Updating selecting items")
    //     }
    // })
    res.redirect("/mainpage")


})

app.listen(3000, function(){
    console.log("server started on port 3000")
})