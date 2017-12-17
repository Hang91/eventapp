//show code 644, this is the key part of email alert function
var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('eventapp', ['users','events','types','subs']);
var TypesModel = require('../models/TypeDB');
var EventsModel = require('../models/EventDB');
var UsersModel = require('../models/UserDB');
var SubsModel = require('../models/SubDB');
var AlertsModel = require('../models/AlertDB');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var email   = require('emailjs/email');
var nodemailer = require('nodemailer'); 

var ObjectId = require('mongodb').ObjectID;


var json2csv = require('json2csv');
var fs = require('fs');

function searchUsers(res, user, limit, currentPage, index)
{
    UsersModel.find({priority : 0},function(err, users){//usrs
        if(err){
            return next(err);
        }
        var totallength = users.length;
        var totalPage = Math.floor(totallength / limit);
        
        if (totallength % limit != 0) {
            totalPage += 1;
        }
        if (totalPage != 0 && currentPage > totalPage) {
            currentPage = totalPage;
        }
        //console.log("currentPage: "+currentPage);
        UsersModel.find({priority : 0}).skip((currentPage - 1) * limit).limit(limit).sort('name').exec(function(err, users1) { 
            UsersModel.find({priority : 1},function(err2, users2){//managers
                if(err2){
                    return next(err2);
                }
                //console.log(results2.length);
                UsersModel.find({priority : 2},function(err3, users3){//only one admin
                    if(err3){
                    return next(err3);
                }
                    //console.log(results3.length);
                    res.render('manage_users', { title:'Manage | Manage Users', user:user, index:index,
                        users1 : users1, users2 : users2, users3 : users3, totalPage:totalPage, currentPage:currentPage, totallength:totallength}); 
                }); 
            }); 
        });
    });
}
//manage users page - GET
//pagination
router.get('/users', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
    var limit = 10;
    var currentPage = 1;
    var index = 1;
    if(req.query.currentPage){
        currentPage = req.query.currentPage;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
    index = (currentPage - 1) * limit + 1;
    searchUsers(res, req.user, limit, currentPage, index);
});

//promote one user to manager
router.get('/users/promote', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
    var id = req.query.id;
    var limit = 10;
    var currentPage = 1;
    var index = 1;
    UsersModel.update({_id:ObjectId(id)}, {$set:{priority:1}}, function(err, user){//1 is manager
        if(err){
            res.send(err);
        }
        else {
            searchUsers(res, req.user, limit, currentPage,index);
        }    
    });
});

//demote one manager to user
router.get('/users/demote', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
    var id = req.query.id;
    var limit = 10;
    var currentPage = 1;
    var index = 1;
    UsersModel.update({_id:ObjectId(id)}, {$set:{priority:0}}, function(err, user){//0 is user
        if(err){
            res.send(err);
        }
        else {
            searchUsers(res, req.user, limit, currentPage, index);
        }    
    });
});

//click download button in manage users page 
//- GET - download using json2csv
router.get('/users/download', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
    var fields = ['userName', 'userEmail', 'name', 'type', 'city', 'state', 'country', 'region', 
        'organization', 'startDate', 'endDate', 'keywords'];
    //find all subscriptions sorted by userName
    SubsModel.find({}).sort('userName').exec(function(err, results){
        if(err){
            return res.send();
        }
        //console.log(results3.length);
        var csv = json2csv({ data: results, fields: fields });

        var fileName = 'UsersEventsSubscription.csv';

        fs.writeFile(fileName, csv, function(err) {
            if (err) {
                return res.send();
            }
            console.log('File saved');
            //download file from server to admin local
            res.download('./'+fileName);
        });
    }); 
});

//*****************   Events  ********************************
function searchEvents(res, user, limit, tab, currentPage1,currentPage2,currentPage3,index1,index2,index3)
{
    EventsModel.find({approved : 0},function(err1, results1){//to be approve
        if(err1){
            return next(err1);
        }
        var totallength1 = results1.length;
        var totalPage1 = Math.floor(totallength1 / limit);
        
        if (totallength1 % limit != 0) {
            totalPage1 += 1;
        }
        if (totalPage1 != 0 && currentPage1 > totalPage1) {
            currentPage1 = totalPage1;
        }
        EventsModel.find({approved : 0}).skip((currentPage1 - 1) * limit).limit(limit).sort('startDate').sort('city').sort('country').exec(function(err11, results11) {
        //console.log(results11.length);
                if(err11){
                    return next(err11);
                }
                EventsModel.find({approved : 1},function(err2, results2){//approve
                if(err2){
                    return next(err2);
                }
                var totallength2 = results2.length;
                var totalPage2 = Math.floor(totallength2 / limit);
                
                if (totallength2 % limit != 0) {
                    totalPage2 += 1;
                }
                if (totalPage2 != 0 && currentPage2 > totalPage2) {
                    currentPage2 = totalPage2;
                }
                //console.log(results2.length);
                EventsModel.find({approved : 1}).skip((currentPage2 - 1) * limit).limit(limit).sort('startDate').sort('city').sort('country').exec(function(err22, results22) {
                    if(err22){
                        return next(err22);
                    }
                    EventsModel.find({approved : 3},function(err3, results3){//revise
                        if(err3){
                            return next(err3);
                        }
                        var totallength3 = results3.length;
                        var totalPage3 = Math.floor(totallength3 / limit);
                        
                        if (totallength3 % limit != 0) {
                            totalPage3 += 1;
                        }
                        if (totalPage3 != 0 && currentPage3 > totalPage3) {
                            currentPage3 = totalPage3;
                        }
                        EventsModel.find({approved : 3}).skip((currentPage3 - 1) * limit).limit(limit).sort('startDate').sort('city').sort('country').exec(function(err33, results33) {
                            res.render('manage_events', { title:'Manage | Manage Events', user:user, 
                                results1 : results11, results2 : results22, results3 : results33,
                                totalPage1:totalPage1, totalPage2:totalPage2, totalPage3:totalPage3,
                                currentPage1:currentPage1,currentPage2:currentPage2,currentPage3:currentPage3, 
                                totallength1:totallength1,totallength2:totallength2,totallength3:totallength3,
                                index1:index1,index2:index2,index3:index3
                            });                            
                        });
                    }); 
                });
            }); 
        });
    });
}
//manage events page - GET
router.get('/events', ensureLoggedIn('/users/login'), isManager, function(req, res){
    //delete out-of-date events
    deleteOutDateEvents();

    var limit = 10;
    var index1 = 1;
    var index2 = 1;
    var index3 = 1;
    var currentPage1 = 1;
    var currentPage2 = 1;
    var currentPage3 = 1;
    var tab = req.query.tab;
    if(req.query.currentPage1){
        currentPage1 = req.query.currentPage1;
    }
    if(req.query.currentPage2){
        currentPage2 = req.query.currentPage2;
    }
    if(req.query.currentPage3){
        currentPage3 = req.query.currentPage3;
    }
    if (currentPage1 < 1) {
        currentPage1 = 1;
    }
    if (currentPage2 < 1) {
        currentPage2 = 1;
    }
    if (currentPage3 < 1) {
        currentPage3 = 1;
    }
    index1 = (currentPage1 - 1) * limit + 1;
    index2 = (currentPage2 - 1) * limit + 1;
    index3 = (currentPage3 - 1) * limit + 1;
    searchEvents(res, req.user, limit, tab, currentPage1, currentPage2, currentPage3, index1, index2, index3);
});


//check detail of an event
router.get('/events/details', ensureLoggedIn('/users/login'), isManager, function(req, res){
    var id = req.query.id;
    //console.log(id);
    TypesModel.find({}, function(err, types){
        if(err){
            return next(err);
        }
        EventsModel.findById(id, function(err, event){
            if(err){
                res.send(err);
            }
            res.render('events_details', {title: 'Manage | Event Details', 
                user: req.user, types:types, event:event});
        });
    });
});

//edit & approve / disapprove / ask for revision
router.post('/events/details', ensureLoggedIn('/users/login'), isManager, function(req, res){
    if(req.body.manage_event_detail == "Disapprove"){

            var id  = req.body.id;
            EventsModel.findByIdAndRemove(ObjectId(id), function(err, event){
                    if(err){
                        res.send(err);
                    }
                    else {
                        console.log("disapprove success!");
                        req.flash('success', 'Successfully disapproved!');
                        res.location('/manage/events');
                        res.redirect('/manage/events');
                        //searchEvents(res, req.user, limit, currentPage, 0, false);
                    }    
                });
    }else{
        //get form values
        var id        = req.body.id;
        var name        = req.body.name;
        var type        = req.body.type;
        var city    = req.body.city;
        var state   = req.body.state;
        var country     = req.body.country;
        var region      = req.body.region;
        var organization    = req.body.organization;
        var contact     = req.body.contact;
        var email   = req.body.email;
        var website     = req.body.website;
        var startDate   = req.body.startDate;
        var endDate = req.body.endDate;
        var deadline = req.body.deadline;
        var description = req.body.description;
        var comments = req.body.comments;
        if(typeof req.body.keywords == 'string') {
            var keywords    = req.body.keywords.split(",");
        } else {
            var keywords = null;
            console.log('keywords is not a string');
        }


        if(req.body.manage_event_detail == "Revise"){
            
            var approved = 3;//0:not check yet; 1:approve; 2:disapprove; 3.ask for revision

            var newEvent = {
                       name: name,
                       type: type,
                       region: region,//continent
                       country: country,
                       state: state,
                       city: city,
                       organization: organization,
                       contact: contact,
                       email: email,
                       website: website,
                       startDate: startDate,
                       endDate: endDate,
                       deadline: deadline,
                       description: description,
                       keywords: keywords,
                       approved: approved,
                       comments: comments
                }
            //update
            EventsModel.update({_id:ObjectId(id)}, {$set:newEvent}, function(err, doc){
                if(err){
                    res.send(err);
                }
                else{
                    console.log('ask for revision success!');
                    //success msg
                    //alertUser(newEvent);
                    informUser(req, res, id);//inform auther+flash
                    res.location('/manage/events');
                    res.redirect('/manage/events');
                }
            });
        }
        else if(req.body.manage_event_detail == "Approve"){
            var approved = 1;//0:not check yet; 1:approve; 2:disapprove; 3.ask for revision
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();

            if(dd<10) {
                dd = '0'+dd
            } 

            if(mm<10) {
                mm = '0'+mm
            } 

            today = yyyy + '-' + mm + '-' + dd;
            var newEvent = {
                       name: name,
                       type: type,
                       region: region,//continent
                       country: country,
                       state: state,
                       city: city,
                       organization: organization,
                       contact: contact,
                       email: email,
                       website: website,
                       startDate: startDate,
                       endDate: endDate,
                       deadline: deadline,
                       description: description,
                       keywords: keywords,
                       approved: approved,
                       postDate: today,
                       comments: comments,
                }
            //update
            EventsModel.update({_id:ObjectId(id)}, {$set: newEvent}, function(err, doc){
            if(err){
                console.log(err);
            }
            else{
                console.log('approve success!');
                //success msg
                informUser(req, res, id);//inform the auther+flash
                alertUser(newEvent);//inform all subscribers
                res.location('/manage/events');
                res.redirect('/manage/events');
            }
            });
        }
        else if(req.body.manage_event_detail == "Confirm"){
            req.flash('success', 'Successfully confirm!');
            res.location('/manage/events');
            res.redirect('/manage/events');
        }
    }
});

//approve an event
router.get('/events/approve', ensureLoggedIn('/users/login'), isManager, function(req, res){
    var id = req.query.id;
    var approved = 1;
    //console.log("in the approve function， id="+id);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    } 

    if(mm<10) {
        mm = '0'+mm
    } 

    today = yyyy + '-' + mm + '-' + dd;
    var newEvent = {
           approved: approved,
           postDate: today
    }
    EventsModel.update({_id:ObjectId(id)}, {$set: newEvent}, function(err, event){
        if(err){
            console.log(err);
        }
        else {            
            //email alert
            EventsModel.findById(id, function(err, event){
                if (err) {
                    console.log(err);
                } else {
                    informUser(req, res, id);
                    alertUser(event);
                    res.location('/manage/events');
                    res.redirect('/manage/events');
                }
            });                   
        }    
    });
});

//disapprove an event - delete
router.get('/events/disapprove', ensureLoggedIn('/users/login'), isManager, function(req, res){
    var id = req.query.id;
    //console.log(id);
    EventsModel.findByIdAndRemove(ObjectId(id), function(err, event){
        if(err){
            console.log(err);
        }
        else {
            req.flash('success', 'Successfully disapproved!');
            console.log("disapprove success!");
            res.location('/manage/events');
            res.redirect('/manage/events'); 
        }    
    });
});

//************   categories   **************************
//manage categories page - GET
router.get('/categories', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
	TypesModel.find({}, function(err, results){
		if(err){
			return next(err);
		}
		res.render('manage_categories', {title:'Manage | Manage Categories', user: req.user, results : results});
	});
	// var collection = db.collection('types');
	// collection.find({}).toArray(function(err, results){
	// 	res.render('manage_categories', { title:'Manage Categories', user: req.user, results : results}); 
	// });	
});

//add type
//use ajax post (use get cannot work)
router.get('/categories/add', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
	var type = req.query.type;
   //MogoDB中可以用Create方法添加数据
    TypesModel.create({type:type}, function (err) {
        if (err) res.send({result:-1});
        else {
            TypesModel.find({}, function (error, results) {
                if (error) res.send({result:-1});
                else {
                    // res.send({result:1});
                    console.log("add success!");
                    req.flash('success', 'Successfully add!');
                    res.location('/manage/categories');
                    res.redirect("/manage/categories");
                    //res.render('manage_categories', {title:'Manage Categories', user: req.user, results : results});

                }
            });
        }
    });
});

//edit type
router.get('/categories/edit', ensureLoggedIn('/users/login'), isAdmin,function(req, res){
    var id = req.query._id;
    //console.log("edit type:"+id);
    var type = req.query.type;
    TypesModel.update({_id:ObjectId(id)}, {$set:{type:type}},{}, function(err, next){
        if(err){
            console.log(err);
        }
        else {
            TypesModel.find({}, function (error, results) {
                if (error){ 
                    console.log("edit error!");
                    res.send({result:-1});
                }
                else {
                    console.log("edit success!");
                    req.flash('success', 'Successfully edit!');
                    res.location('/manage/categories');
                    res.redirect("/manage/categories");
                    //res.render('manage_categories', {title:'Manage Categories', user: req.user, results : results});
                }
            });
        }    
    });
});

//delete type according to _id
router.get('/categories/delete', ensureLoggedIn('/users/login'), isAdmin, function(req, res){
	var id = req.query._id;
    //console.log("delete type:"+id);
   //MogoDB use remove function to remove data
    TypesModel.findByIdAndRemove(ObjectId(id), function (err) {
        if (err){ 
            console.log("delete err!");
            res.send({result:-1});
        }
        else {
            TypesModel.find({}, function (error, results) {
                if (error){ 
                    console.log("delete error!");
                    res.send({result:-1});
                }
                else {
                    req.flash('success', 'Successfully delete!');
                    console.log("delete success!");
                    res.location('/manage/categories');
                    res.redirect("/manage/categories");
                }
            });
        }
    });
});



function isAdmin(req, res, next) {

	 if ((!req.isAuthenticated()) || (req.user.priority != 2)) {
	 	req.flash('error', 'Seems like you aren\'t an admin! '+req.user.name);
		res.redirect('/');
	 }
	 else{
	 	next();
	 }
};

function isManager(req, res, next) {
   if ((!req.isAuthenticated()) || (req.user.priority < 1)) {
    req.flash('error', 'Seems like you aren\'t an manager! '+req.user.name);
    res.redirect('/');
   }
   else{
    next();
   }
};

function informUser(req, res, id) {

    console.log("inform user");
    AlertsModel.findOne(function(err, results){
        if(err) {
            console.log(err);
        }
        if (results == null) {
            req.flash('error', 'Admin did not add an inform email sender! This operation will not inform any user.');     
        } else {
            var adminPw = results.password;
            var adminEmail = results.account;
            console.log('password: ' + adminPw);
            console.log('email: ' + adminEmail);
            var server = email.server.connect({
                user:  adminEmail, 
                password: adminPw,
                host:  "academiacentral.org", 
                tls: {ciphers: "SSLv3"}
            });

            EventsModel.findById(id, function(err, events){
                if(err) {
                    console.log(err);
                }
                else if(events.approved == 3) { //revise
                    var message = {
                        text:  "Hello " + events.userName + ", you have an event to revise. Please log in your eventapp account " +
                         "to get detail information. "
                         + "\n\n\n" + "Regards," + "\n" + "event.academiacentral.org",
                        from:  "event.academiacentral.org <" + adminEmail + ">", 
                        to:    events.userName + "<" + events.userEmail + ">",
                        cc:    "",

                        subject: "Revision Request"
                    };

                    server.send(message, function(err, message) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log(message);
                            req.flash('success', 'Successfully ask for revision!');
                        }
                    });
                }
                else if(events.approved == 1) { //approved
                    var message = {
                        text:  "Hello " + events.userName + ", you hava an event approved. You can log in your eventapp account " +
                         "to get detail information." 
                         + "\n\n\n" + "Regards," + "\n" + "event.academiacentral.org",
                        from:  "event.academiacentral.org <" + adminEmail + ">", 
                        to:    events.userName + "<" + events.userEmail + ">",
                        cc:    "",
                        subject: "Event Approved"
                    };

                    server.send(message, function(err, message) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log(message);
                            req.flash('success', 'Successfully approve an event!');
                        }
                    });   
                }
            });
        }
    });

  // send the message and get a callback with an error or details of the message that was sent

}

// show code
function alertUser(newEvent) {
    console.log("alert User");

    AlertsModel.findOne(function(err, emails){
        if(err) {
            console.log(err);
        }
        if (emails == null) {
            req.flash('error', 'Admin did not add an inform email sender! This operation will not inform any user.');          
        }
        else {
            var adminEmail = emails.account;
            var adminPw = emails.password;
            var name = newEvent.name;
            var type = newEvent.type;
            var keywords = newEvent.keywords;
            var region = newEvent.region;
            var country = newEvent.country;
            var state = newEvent.state;
            var city = newEvent.city;
            var startDate = newEvent.startDate;
            var endDate = newEvent.endDate;
            var website = newEvent.website;
            var deadline = newEvent.deadline;
            var description = newEvent.description;

            if(!name) {
                var nameStr = {};
            }
            else {
                nameStr = {$or: [{'name': name}, {'name': ""}]};
            }
            if(!type){
                var typeStr = {};
            }
            else{
                var typeStr = {$or: [{'type': type}, {'type': ""}]};
            }
            if(keywords.length == 1 && !keywords[0]){
                var keywordsStr = {};
            }
            else{
                var keywordsStr = {$or: [{'keywords': {$in:keywords}}, {'keywords' : ""} ]};//or
            //var keywordsStr = {'keywords': {$all:keywords}};//and
            }
            if(!region){
                var regionStr = {};
            }
            else{
                var regionStr = {$or: [{'region' : region}, {'region': ""}, {'region': null}]};
            }   
            if(!country){
                var countryStr = {};
            }
            else{
                var countryStr = {$or: [{'country' : country}, {'country': ""}, {'country': null}]};
            }
            if(!state){
                var stateStr = {};
            }
            else{
                var stateStr = {$or: [{'state' : state}, {'state': ""}, {'state': null}]};
            }
            if(!city){
                var cityStr = {};
            }
            else{
                var cityStr = {$or: [{'city' : city}, {'city': ""}]};
            }
            if(!startDate){
                var startDateStr = {};
            }
            else{
                var startDateStr = {$or: [{'startDate': {$lte:startDate}}, {'startDate': ""}]};
            }
            if(!endDate){
                var endDateStr = {};
            }
            else{
                var endDateStr = {$or: [{'endDate' : {$gte:endDate}}, {'endDate': ""}]};
            }
            SubsModel.find({$and: [nameStr, typeStr, regionStr, countryStr, stateStr, cityStr, startDateStr, endDateStr, keywordsStr]}, function(err, results){
                console.log('user number' + results.length);

                var server = email.server.connect({
                    user:  adminEmail, 
                    password: adminPw,
                    host:  "academiacentral.org", 
                    tls: {ciphers: "SSLv3"}
                });

                results.forEach(function(result){
                    var message = {
                        text:  "Hello " + result.userName + ", \n There is a new event match your subscription. Below is the detailed information. \n" + 
                        "Event name: " + name + "\n" + "Event type: " + type + "\n" + "Region: " + region + "\n" +
                        "Country: " + country + "\n" + "State: " + state + "\n" + "City: " + city + "\n" + "Date: " +
                        startDate + "~" + endDate + "\n" + "Abstract Deadline: " + deadline + "\n" + 
                        "Description: " + description + "\n" + "keywords: " + keywords 
                        + "\n\n\n" + "Regards," + "\n" + "event.academiacentral.org",
                        from:  "event.academiacentral.org <" + adminEmail + ">", 
                        to:    result.userName + " <" + result.userEmail + ">",
                        cc:    "",
                        subject: "Event Subscription Alert"
                    };

                // send the message and get a callback with an error or details of the message that was sent
                    server.send(message, function(err, message) { 
                        if (err) {
                            console.log(err); 
                        } else {
                            console.log(message);
                        }
                    });
                }); 
    
            });
        }
    });
}
//change approved of out-of-date events to 5
function deleteOutDateEvents()
{
    //delete out-of-date events
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    } 

    if(mm<10) {
        mm = '0'+mm
    } 

    today =  yyyy + '-' + mm + '-' + dd;
    //console.log(today);
    EventsModel.find({$and:[{'endDate': {$lt:today}},{'approved':{$ne:5}}]}, function(err, results){
        if(results.length > 0){
            EventsModel.update({$and:[{'endDate': {$lt:today}},{'approved':{$ne:5}}]}, {$set: {'approved':5}}, function(err, doc){
            if(err){
                res.send(err);
            }
            else{
                console.log('out-of-date event!');
            }
        });
        }
    });
    
    //EventsModel.remove({'startDate': {$lt:today}})
}


module.exports = router;
