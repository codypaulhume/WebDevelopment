import express from "express";
const app = express();
const port = 3000;

const titles=[];
const bodys=[];
const list = [];

import bodyParser from "body-parser";

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/", (req, res) => {res.render("index.ejs");});

app.post("/submit", (req, res) => {
    class singlePost{
        constructor(){
            this.title = req.body["title"]
            this.body = req.body["body"];
        }
    }
    const newPost = new singlePost();
    list.push(newPost);
    res.render("index.ejs",{list});
});

app.get("/delete/:id", (req, res) => { 
        var theID = req.params.id;
        list.splice(theID,1);
        res.render("index.ejs");
    });

    app.get("/edit/:id", (req, res) => { 
        var theID = req.params.id;
        res.render("edit.ejs", {list, theID});
    });

    app.post("/edited/:id", (req, res) => {
        var theID = req.params.id;
        var newTitle = req.body["title"];
        var newBody = req.body["body"];
        list[theID].title = newTitle;
        list[theID].body = newBody;
        res.render("index.ejs",{list});
    });
    
app.listen(port, () => {
console.log(`Listening on port ${port}`);
});