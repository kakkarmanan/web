const express = require("express");

const app = express();

app.get("/",function(req,res){
  res.send("Hello!!");
});

app.get("/contact",function(req,res){
  res.send("Contact me at 1234");
});

app.get("/about",function(req,res){
  res.send("<h1>Manan Kakkar<h1><lb><h1>I am a student</h1>)")
});

app.get("/hobbies",function(req,res){
  res.send("<h1>NO HOBBIES<h1>");
});

app.listen(3000, function(){
  console.log("server satrted");
});
