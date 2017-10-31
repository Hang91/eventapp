var express = require('express');
var router = express.Router();

//var EventDB = require('../models/EventDB');

var email 	= require('emailjs/email');
var mongojs = require('mongojs');
var db = mongojs('eventapp', ['users','events','types','subs']);
//###########mongoose#########
var EventsModel = require('../models/EventDB');
var TypesModel = require('../models/TypeDB');

//Events - POST
//pagination
router.post('/', function (req, res, next) {
	console.log("events post");
	var limit = 8;
	var currentPage = 1;
    if(req.params.currentPage){
    	currentPage = req.params.currentPage;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
	var type = req.body.type;
	var keywords = req.body.keywords.split(',');
	var region = req.body.region;
	var country = req.body.country;
	var state = req.body.state;
	var startDate = req.body.startDate;
	var endDate = req.body.endDate;
	var approved = 1;
	//delete out-of-date events
	deleteOutDateEvents(startDate);

	//search
	searchEvents(res, req.user, limit, currentPage, type, 
		keywords, region, country, state, startDate, endDate, approved);	

});

//Events - GET
//pagination
router.get( "/" , function ( req , res , err ) {
	//console.log("events get");
    var limit = 8;
    var currentPage = 1;
    if(req.query.currentPage){
    	currentPage = req.query.currentPage;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
	//use trim() to delete space
	if(req.query.type != null){
		var type = req.query.type.trim();
	}
	else{
		var type = "";
	}
	var keywords = req.query.keywords.trim().split(',');
	var region = req.query.region.trim();
	var country = req.query.country.trim();
	var state = req.query.state.trim();
	var startDate = req.query.startDate.trim();
	var endDate = req.query.endDate.trim();
	var approved = 1;
	//delete out-of-date events
	deleteOutDateEvents(startDate);
	//search
	searchEvents(res, req.user, limit, currentPage, type, keywords, 
		region, country, state, startDate, endDate, approved);	
});


function searchEvents(res, user, limit, currentPage, type, keywords, region, country, state, startDate, endDate, approved)
{//search
	if(!type){
		var typeStr = {};
	}
	else{
		var typeStr = {'type' : type};
	}
	if(!keywords || (keywords.length == 1 && !keywords[0])){
		var keywordsStr = {};
	}
	else{
		//var keywordsStr = {'keywords': {$in:keywords}};//or
		var keywordsStr = {'keywords': {$all:keywords}};//and
	}
	if(!region){
		var regionStr = {};
	}
	else{
		var regionStr = {'region' : region};
	}
	if(!country){
		var countryStr = {};
	}
	else{
		var countryStr = {'country' : country};
	}
	if(!state){
		var stateStr = {};
	}
	else{
		var stateStr = {'state' : state};
	}
	if(!startDate){
		var startDateStr = {};
	}
	else{
		var startDateStr = {'startDate': {$gte:startDate}};
	}
	if(!endDate){
		var endDateStr = {};
	}
	else{
		var endDateStr = {'endDate' : {$lte:endDate}};
	}
	var approvedStr = {'approved' : 1};

    EventsModel.find({$and: [typeStr, keywordsStr, regionStr, countryStr, stateStr, startDateStr, endDateStr, approvedStr]}, function(err, rs){
    	if (err) {
            res.send(err);
        } else{
        	var totallength = rs.length;
        	var totalPage = Math.floor(totallength / limit);
        	
            if (totallength % limit != 0) {
                totalPage += 1;
            }
            if (totalPage != 0 && currentPage > totalPage) {
                currentPage = totalPage;
            }
            var query = EventsModel.find({$and: [typeStr, keywordsStr, regionStr, countryStr, stateStr, startDateStr, endDateStr, approvedStr]});
            query.skip((currentPage - 1) * limit);
            query.limit(limit);
            query.sort('-startDate').exec(function(err, results) { 
            	TypesModel.find({}, function(err, typeResults){
					if (err) {
			    		console.dir( err );
			    	}
					res.render('events', {title:'Search Results', 
            		typeResults: typeResults, type:type, keywords:keywords, 
            		region:region, country:country, state:state, 
            		startDate:startDate, endDate:endDate, 
            		totalPage:totalPage, currentPage:currentPage, 
            		results:results, totallength:totallength, user: user});
				});
            });
        } 
	});
}
function deleteOutDateEvents(startDate)
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
	EventsModel.remove({'startDate': {$lt:today}})
}

module.exports = router;
