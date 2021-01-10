const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const { json } = require('body-parser');
const app =  express();

//const customerRoutes = require('./api/routes/customers');



app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

//app.use('/customers',customerRoutes);

//Initialising connection string
var dbConfig = {
    user:  "sa",
    password: "########",
    server: "IN5CG9010BLY",
    database: "ETA",
    options: {
        "enableArithAbort": true,
        "encrypt":false
    }
};

//Function to connect to database and execute query
//var executeQuery = function(req, res,callback){             
    function executeQuery(req, res,callback){             
     sql.connect(dbConfig, function (err) {
        if (err) {   
            console.log("Error while connecting database :- " + err);
            //res.send(err);
            res.json({success:false, message:err});
        }
        else {
            console.log('Database Connected...');
          // create Request object
          var request = new sql.Request();
          // query to the database
          request.query(req, function (err, data) {
            if (err) {
              console.log("Error while querying database :- " + err);
              res.json({success:false, message:err});
              }
              else {
                console.log('Query executed successfully...');
                callback(data.recordset);
                res.json({
                    //success: true, 
                    data:data.recordset
                });
              }
          });
        }
    });           
}

app.get('/api/teams',(req, res) => {
    var query = "select Assignee_ID, Assignee_Name from Mst_Assignee";
    console.log(query);
    executeQuery(query,res, function(data){
        console.log(data)
    });
    //console.log('within teams- '+executeQuery);
})

app.post('/upload',(req,res) => {
    //console.log('success');
    //console.log(req.body);
    var jsdata = req.body;
    //console.log(jsdata);
    for(var i = 0; i< jsdata.length; i++){
        var obj = jsdata[i];
        var query = "exec [dbo].[UploadExcelETAdetails] '" + obj.Incident_ID + "','"+ obj.Interaction_No + "','" 
        + obj.Open_Time +"','" + obj.Status +"','"+ obj.Assignment +"','"+
        obj.Assignee +"','"+ obj.Brief_Description +"',"+ obj.Ageing_Days
        
        console.log('query '+query);
        executeQuery (query,res);
    }

    // var query = "exec [dbo].[UploadExcelETAdetails] '" + req.body.Incident_ID + "','"+ req.body.Interaction_No + "','" 
    // + req.body.Open_Time +"','" + req.body.Status +"','"+ req.body.Assignment +"','"+
    // req.body.Assignee +"','"+ req.body.Brief_Description +"',"+ req.body.Ageing_Days

    // console.log('query '+query);
    //executeQuery (query,res);
})

app.post('/api/report',(req, res) => {
    console.log('success');
    //var objrpt = req.body.selectedId;
    var query = "exec [dbo].[GetUploadedExcelETADetails] "+ req.body.selectedId
    console.log('query '+query);
    executeQuery(query, res, (data) => {
        console.log(data);
    });
    //console.log(objrpt);
})



//GET ALL ACTIVE USERS FOR PATHWAYS
app.get("/employee", function(req, res){
    var query = "select * from Tbl_Employee";
    console.log(query);
    executeQuery(query, res);
});

//GET ONE USER
app.get("/employee/:id/", function(req, res){
    var query = "select * from Tbl_Employee where Id = " + req.params.id;
    executeQuery(query, res);
  });

  //POST API
 app.post("/etadetails", function(req , res){
                var query = "exec [dbo].[InsertOrUpdateETAdetails] '" + req.body.Incident_ID + "','"+ req.body.Interaction_ID + "','" 
                + req.body.OpenTime +"'," + req.body.Status +","+ req.body.Assignment_Group +","+
                req.body.Assignee +",'" + req.body.Title +"',"+ req.body.Ageing_Days +","+ req.body.App_EM +","+ req.body.App_PM +","
                + req.body.Mission +","+ req.body.Country +",'"+ req.body.Remarks +"','"+ req.body.ETA +"',"
                + req.body.RevisedETA_Count +",'"+ req.body.ReasonForDelay +"',"+ req.body.IsPurge +","+ req.body.IsActive + ",'" 
                +req.body.CreateDate+"','"+ req.body.ModifyDate +"'"
                 
                console.log(query);
                executeQuery (query,res);
});

//PUT API
 app.put("/employee/:id/", function(req , res){
    var query = "exec InsertOrUpdateEmployee '" + req.body.firstname + "','"+
    req.body.middlename + "','" + req.body.lastname +"','" + req.body.dob +"','"+ req.body.designation +"','"+
    req.body.reportingto +"'," + req.body.salary +","+ req.params.id

                //res.json({query: query});
                executeQuery (query,res);
});

// DELETE API
 app.delete("/employee/:id/", function(req , res){
                var query = "DELETE FROM [Tbl_Employee] WHERE Id= " + req.params.id
                executeQuery (query,res);
});


// app.use((req, res, next) => {
//     res.status(200).json({
//         message:"hello!"
//     });
// });

module.exports = app;