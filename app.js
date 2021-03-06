//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to the mongodb
mongoose.connect("DB_URI",{useNewUrlParser: true, useUnifiedTopology: true});


//**********item Schema and its model********//
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);
//**********item Schema and its model********//


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});


//**********list Schema and its model********//
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);
//**********list Schema and its model********//


const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Insertion success!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

//"/:customListName"->"/home", "/work", it is the name we typed in the web router
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err) {
      if(!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
      
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("remove success.");
        res.redirect("/");
      }
    });
  } else {
    //from the list find the name with listName, then pull the checkedItem through its id from the items array
    //items is inside of the List's shcema which means items array is one of the object of List
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

//******set up the port that run both heroku and locally */
let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
