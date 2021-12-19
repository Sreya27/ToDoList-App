//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item ({
  name:"Welcome to your to do list"
});

const item2 = new Item ({
  name: "Welcome2"
});

const item3 = new Item ({
  name: "Welcome3"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);



// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

  Item.find({}, function(err,results)
  {
    if(results.length===0)
    {
      Item.insertMany(defaultItems, function(err)
      {
        if(err)
        {
            console.log(err);
        }
        else{
           console.log("Successfully saved your items to the database");
        }
     });
     res.redirect("/");
  }
    else{
      res.render("list", {listTitle: "Today", newListItems: results});
    }
    
  });

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,results)
  {
    if(!err)
    {
      if(!results){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        //show an existing list

        res.render("list", {listTitle: results.name, newListItems: results.items})
      }
    }
  });

  
  
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName=="Today") {
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today")
  {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err)
      {
        console.log(err);
      }
      else{
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}, function(err, foundList){
      if(!err)
      {
        res.redirect("/"+listName);
      }
    });
  }

  
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
