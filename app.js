//Imports
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from 'lodash';
//Using express and defining port 
const app = express();
const port = 3000;
//Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//Connecting to mongoDb and creating MyTodo Db
mongoose.connect("mongodb+srv://tommackaill:OZ8y7GhChAZ14gxi@cluster0.tjxkdva.mongodb.net/MyTodo");
//Creating the template schema
const itemsSchema = {
    name: String
};
//Creating a collection using the itemSchema
const Item = mongoose.model("Item", itemsSchema);
//Creating 3 default items to be rendered and storing them in an array
const item1 = new Item({
    name: "Welcome to your todo list!"
  });
const item2 = new Item({
    name: "Hit the + button to add a new item."
  });
const item3 = new Item({
    name: "Hit this to delete an item."
  });
const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemsSchema]
  };
  
const List = mongoose.model("List", listSchema );
  




//The root, when a user hits up this route this code gets triggered.
//We look inside the Item collection and if it is empty we insert the defaultItems
//-- array into the Item collection and then redirect where this time it will be created
//--so then the else block gets called and renders list.ejs with the found items to be used.
//
app.get("/", (req, res) => {
    Item.find({}).then((items) => {
        if(items.length === 0){
            Item.insertMany(defaultItems).then( () => {
                console.log("Successfully saved default items to DataBase")
            }).catch((err) => {
                console.log(err)
            });
            res.redirect("/")
        } else {
            res.render("list.ejs", {listTitle: "Today", newListItems: items})
        }
    });
});

//When the user hits up a custom endpoint this route gets hit up.
//We grab the input from the URL and store in variable
//Go into the List collection and find the customListName(user input)
//--if we get back data then foundList will exist and we render the properties of what was found.
//If it doesnt exist then we create a new list and then save it to DB and then redirect to custom route.
//The first time a user creates custom list the else block initiates first
//--as it does not exist yet.
//Then the if block executes and renders over info.
app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then((foundList) => {
        if(foundList){
            res.render("list.ejs", {listTitle: foundList.name, newListItems: foundList.items})
        } else {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName)
        }
    });


});

//When user sends post request this route gets hit up.
//itemName stores the value of user input
//listName stores the value of the custom list the user is coming from(See get request)
//if the user is comming from the defualt("Today")list then save the item into Db as usual.
//Else find the custom list and push the item created below into it.
//Save into DB and redirect to custom endpont.
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/")
    } else {
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
          })
    }
});

//When the user makes a post request hitting up this /delete route this code initiates
//Grab hold of the item id from the checkbox user has chosen, we do this by adding a value field
//--and inserting the item._id and also a javascript onChange method
//If the listName is "Today" then the user is coming from defualt list and 
//--we find item by id and remove passing in checked id and redirect to root.
//Else user is comming from custom endpoint 
//We tap into listName and pull items with id that was checked passing in checkedItemId.
//We then redirect to the endpoint the user came from.
app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
  
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId)
        .then(() => {
          console.log(checkedItemId + " has been deleted from DB")
          res.redirect("/");
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(()=>{
            console.log("Successfully updated");
            res.redirect("/" + listName);
          })
    }


});










app.listen(port, function() {
    console.log("Server started on port 3000");
  });
  