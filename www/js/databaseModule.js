var currentUser;
var db;
var wasteReasons = new Array();
var usageReasons = new Array();
var FOOD_NUMBER_ON_MAIN = 12;
var userFoodUsageData = new Array();	// 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food
var newUsageNumber = 0;
var newWasteNumber = 0;
var userFoodUsageInfo = new Array();	
var userFoodWasteInfo = new Array(); 	 //0: waste id, 1: reason, 2:foodId , 3:purchase date, 4: waste date
var foodListSelectHtml;
var mainPageFoods = new Array();


//TODO calling queries directly inside the loop causes problems, so i need to first call a function which calls the inline query function
//TODO primary key does not work db.executeSql(" PRAGMA foreign_keys = ON ");
//TODO what was that for : window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
//TODO make unnecessary functions inline

/*
 *  Transaction error callback
 */
function errorCallbackSQLite(tx, err) {
	console.log("SQLStatementError " + err);
}

/**
 *  Transaction success callback
 */
function successCallbackSQLite() {
	// console.log("success!");
}


//open database
 function initiateDatabase(){
	
	currentUser = window.localStorage.getItem("currentuser");	
	db = window.openDatabase("EuphoriaDBDB", "1.0", "EUPHORIA LOCAL DATABASE", 200000);

	//reset old data
/*	db.transaction(function(tx) {
		 tx.executeSql('DELETE FROM TABLEUSAGE');
		 tx.executeSql('DELETE FROM TABLEWASTE');
		 tx.executeSql('DELETE FROM TABLEWASTETYPE');
		 tx.executeSql('DELETE FROM TABLEUSERFOOD');
		 tx.executeSql('DELETE FROM TABLEFOODS');
		 tx.executeSql('DELETE FROM TABLESURVEY');
		 tx.executeSql('DELETE FROM TABLEOFFLINEACTIONS');
		 
		 tx.executeSql('DROP TABLE IF EXISTS TABLEUSAGE');
		 tx.executeSql('DROP TABLE IF EXISTS TABLEWASTE');
		 tx.executeSql('DROP TABLE IF EXISTS TABLEUSERFOOD');
		 tx.executeSql('DROP TABLE IF EXISTS TABLEWASTETYPE');
		 tx.executeSql('DROP TABLE IF EXISTS TABLEFOODS');
		 tx.executeSql('DROP TABLE IF EXISTS TABLESURVEY');
		 tx.executeSql('DROP TABLE IF EXISTS TABLEOFFLINEACTIONS');
	});*/
	window.localStorage.setItem("serverdata", "unloaded");
	db.transaction(populateDB, databaseInitError, fillPagesWithDbData);
	
 }
 
 
 function databaseInitError(tx, err) {
	 console.log("database could not be initialized: " + err);
 }
 
 function fillPagesWithDbData() {
	db.transaction(queryCurrentUser, errorCallbackSQLite, successCallbackSQLite);	
	db.transaction(selectAllFoods, errorCallbackSQLite, successCallbackSQLite);
	db.transaction(queryWasteReasons, errorCallbackSQLite, successCallbackSQLite);
	//db.transaction(queryUsageReasons, errorCallbackSQLite, successCallbackSQLite);
	
	getOfflineActions();
 }
 
 
 /*
  * retrieves waste types from database to display for users
  */
 function queryWasteReasons(tx) {
	 tx.executeSql("SELECT * FROM TABLEWASTETYPE", [], setWasteReasons, errorCallbackSQLite);
 }
 
 /*
  * waste reason callback function
  */
 function setWasteReasons(tx, results) {
	 var len = results.rows.length;	
     if(len > 0) {
	    for (var i=0; i<len; i++){
	    	wasteReasons[i] = results.rows.item(i).data;
	   }
	}
 }
 
 /*
  * retrieves usage reasons from database for users
  */
 function queryUsageReasons(tx) {
	 tx.executeSql("SELECT * FROM TABLEREL", [], setUsageReasons, errorCallbackSQLite);
 }
 
 /*
  * usage  reason callback function
  */
 function setUsageReasons(tx, results) {
	 var len = results.rows.length;	
     if(len > 0) {
	    for (var i=0; i<len; i++){
	    	usageReasons[i] = results.rows.item(i).data;
	   }
	}
 }
 
 //following functions are called from other html files like button callbacks
 
 /*
  * loads waste list of user to the html file
  */
 function loadUserWasteList() {
	 db.transaction(queryWasteWithReason, errorCallbackSQLite, successCallbackSQLite);
 }
 
 /*
  * loads user food list to the html file
  */
 function loadUserList() {
	 db.transaction(queryUserFoodDetails, errorCallbackSQLite, successCallbackSQLite);
 }
 
 
 /*
  * loads user food usage list to the html file
  */
 function loadUserUsageList() {
	 db.transaction(queryUsageWithReason, errorCallbackSQLite, successCallbackSQLite);
 }
 
 
 /*
  * loads user survey answers to the html file
  */
 function loadUserSurvey() {
	 db.transaction(querySurveyData, errorCallbackSQLite, successCallbackSQLite );
 }
 
 
 /*
  * sorts user food by date
  */
 function sortUserFoodsByDate(sorting) {
	 sendUserAction(2, getNow(), "Items are sorted");
	 db.transaction( function(tx){ queryUserFoodDetailsSortByDate(tx, sorting) }, errorCallbackSQLite );
 }

 
 /*
  * Populate the database
  * draft version, must be corrected
  */ 
 function populateDB(tx) {
	
	//create current user table
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLECURRENTUSER (userID INTEGER PRIMARY KEY, name TEXT)');
     
	 //create food table
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEFOODS (foodID INTEGER PRIMARY KEY, foodName TEXT, foodIcon TEXT, foodUnit TEXT)');
	
	 //create user table
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEUSERS (userID INTEGER PRIMARY KEY, data TEXT)');
    
     //tx.executeSql('PRAGMA foreign_keys = ON');
	 //TODO foreign key does not work FOREIGN KEY (foodID) REFERENCES TABLEFOODS (foodID)
	 //tx.executeSql('DELETE FROM TABLEUSERFOOD');
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEUSERFOOD (id  INTEGER PRIMARY KEY, userID TEXT,  foodID INTEGER, date TEXT, amount REAL, usage REAL, waste REAL, status INTEGER, deletionDate TEXT, statusChangeDate TEXT)');
	
	 
	 //create relationship table
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEREL (relID INTEGER PRIMARY KEY, data TEXT)');
	 /*tx.executeSql('INSERT INTO TABLEREL (relID, data) VALUES (0, "Relationship")');
	 tx.executeSql('INSERT INTO TABLEREL (relID, data) VALUES (1, "Family")');
	 tx.executeSql('INSERT INTO TABLEREL (relID, data) VALUES (2, "Friends")');*/
	 
	 //create waste reason table
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEWASTETYPE (wasteTypeID INTEGER PRIMARY KEY, data TEXT)');
	 tx.executeSql('SELECT * FROM TABLEWASTETYPE', [], insertWasteTypes, errorCallbackSQLite);

	 //create usage table
	 //tx.executeSql('DELETE FROM TABLEUSAGE');
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEUSAGE (usageID  INTEGER PRIMARY KEY, userfoodID INTEGER, amount REAL, people INTEGER, relationship INTEGER, usageDate TEXT)'); 

	 //create waste table
	 //tx.executeSql('DELETE FROM TABLEWASTE');
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEWASTE (wasteID INTEGER PRIMARY KEY, userfoodID INTEGER, amount REAL, wasteType INTEGER, wasteDate TEXT, wasteStatus INTEGER,  deletionDate TEXT)');	 

	 
	 //create survey table
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLESURVEY (surveyID INTEGER PRIMARY KEY, userID TEXT, q1 INTEGER, q2 INTEGER, q3 INTEGER, q4 INTEGER, date TEXT)');	 

	//create action table to store offline actions for future server update
	 /*
	  * action numbers
	  * 0 : add food
	  * 1 : update amount
	  * 2 : add waste
	  * 3 : add usage
	  * 4 : update waste reason
	  * 5 : update usage type
	  * 6 : add survey
	  * 7 : delete purchase
	  * 8 : delete waste
	  * 9 : shopping list to available list
	  */
	 /*
	  * table numbers
	  * 0 : TABLEUSERFOOD
	  * 1 : TABLEWASTE
	  * 2 : TABLEUSAGE
	  * 3 : TABLESURVEY
	  */
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEOFFLINEACTIONS (offlineID INTEGER PRIMARY KEY, actionNum INTEGER, tableNum INTEGER, tableId INTEGER)');
 
	
	 tx.executeSql('CREATE TABLE IF NOT EXISTS TABLEUSERACTIONS (id INTEGER PRIMARY KEY, actionNumber INTEGER, date TEXT, data TEXT)');
 }
 
 function insertWasteTypes(tx, results) {
	 if(results.rows.length == 0) {
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (0, "Not selected")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (1, "Visibility of stock is missing")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (2, "Over-buying")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (3, "No shopping list")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (4, "Change of plans")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (5, "Special offer")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (6, "Did not like it")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (7, "Wrong storage")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (8, "Other")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (9, "There is no waste")');
	 }
 }
 
 function successAction(actionNumber) {
	 db.transaction( function(tx){
		 tx.executeSql('DELETE FROM TABLEOFFLINEACTIONS WHERE actionNumber = ' + actionNumber);
	 }, errorCallbackSQLite);
 }
 
 function successUserActions() {
	 db.transaction( function(tx){
		 tx.executeSql('DELETE FROM TABLEUSERACTIONS');
	 }, errorCallbackSQLite);
 }
 
 
 /**
  * returns actions saved offline
  */
 function getOfflineActions() {
	//add food
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 0', [], processAddFood, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	//update amount	
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 1', [], processAddFood, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //add waste
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 2', [], processAddWaste, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //update waste info
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 4', [], processAddWaste, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //add usage
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 3', [], processAddUsage, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //update usage info
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 5', [], processAddUsage, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //add delete waste
	 db.transaction(function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 8', [], processDeleteWaste, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //add delete purchase
	 db.transaction(function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 7', [], processDeletePurchase, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //add survey
	 db.transaction(function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 6', [], processSurvey, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //update purchase status
	 db.transaction(function(tx){
		 tx.executeSql('SELECT * FROM TABLEOFFLINEACTIONS WHERE actionNum = 9', [], processUpdatePurchaseStatus, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	 
	 //send user actions
	 db.transaction(function(tx){
		 tx.executeSql('SELECT * FROM TABLEUSERACTIONS', [], sendUserActions, errorCallbackSQLite);
	 }, errorCallbackSQLite);
	  
 }
 
 function sendUserActions(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 sendUserActionHelper(results.rows.item(i));
	 } 
	 
 }
 
 function sendUserActionHelper(newItem) {
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/userAction?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				actionType : newItem.actionNumber,
				actionData : newItem.data,
				actionDate :  newItem.date
			},
			success : function(data) {
				console.log("User action sent to the server");
				db.transaction( function(tx){
					 tx.executeSql('DELETE FROM TABLEUSERACTIONS WHERE id = ' + newItem.id);
				 }, errorCallbackSQLite);
			},
			error : function(e) {
				console.log("User action couldn't be sent to the server");
			}
		});
		return false;
 }
 
 

function deleteFromOfflineActions(actionNumber, id) {
	if(actionNumber == 0) {
		db.transaction( function(tx){
			 tx.executeSql('DELETE FROM TABLEOFFLINEACTIONS WHERE actionNum = 0 OR 1 AND tableId = ' + id);
		 }, errorCallbackSQLite);
	} else if (actionNumber == 2) {
		db.transaction( function(tx){
			 tx.executeSql('DELETE FROM TABLEOFFLINEACTIONS WHERE actionNum = 2 OR 4 AND tableId = ' + id);
		 }, errorCallbackSQLite);
	} else {
		db.transaction( function(tx){
			 tx.executeSql('DELETE FROM TABLEOFFLINEACTIONS WHERE actionNum = ' + actionNumber + ' AND tableId = ' + id);
		 }, errorCallbackSQLite);
	}	
}
 

 
 function processDeleteWaste(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 tx.executeSql('SELECT * FROM TABLEWASTE WHERE wasteID = ' + results.rows.item(i).tableId, [], processDeleteWasteHelper, errorCallbackSQLite);
	 } 
 }
 
 function processDeleteWasteHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processDeleteWasteHelper2( results.rows.item(i));
	 }
 }
 
 function processDeleteWasteHelper2(newItem) {
	 //0: waste id, 1: reason, 2:foodId , 3:purchase date, 4: waste date
	 //get purchase info from waste info
	 var rowNumber = 0;
	 for(i=0; i < userFoodWasteInfo.length; i++ ) {
		 if(userFoodWasteInfo[i][0] == newItem.wasteID) {
			 rowNumber = i;
			 break;
		 }
	 }
	 //send waste deletion request
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/deleteWasteOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				foodId : userFoodWasteInfo[rowNumber][2],
				purchaseDate : userFoodWasteInfo[rowNumber][3],
				deletionDate : newItem.deletionDate
			},
			success : function(data) {
				queryDeleteWaste(rowNumber, newItem.wasteID);
				deleteFromOfflineActions(8, newItem.wasteID);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed!');
			}
		});
		return false;
 }
 
 function processDeletePurchase(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 tx.executeSql('SELECT * FROM TABLEUSERFOOD WHERE id = ' + results.rows.item(i).tableId, [], processDeletePurchaseHelper, errorCallbackSQLite);
	 } 
 }
 function processDeletePurchaseHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processDeletePurchaseHelper2( results.rows.item(i));
	 }
 }
 
 function processDeletePurchaseHelper2(newItem) {
	 //0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food
	 //get purchase info
	 var rowNumber = 0;
	 for(i=0; i < userFoodUsageData.length; i++ ) {
		 if(userFoodUsageData[i][0] == newItem.id) {
			 rowNumber = i;
			 break;
		 }
	 }
	 
	 //send waste deletion request
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/deletePurchaseOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				foodId : userFoodUsageData[rowNumber][5],
				purchaseDate : userFoodUsageData[rowNumber][4],
				deletionDate : newItem.deletionDate
			},
			success : function(e) {
				console.log(e + ' :Data sent to the server!');
				deleteFromOfflineActions(7, newItem.id);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed!');
			}
		});
		return false;
 }
 
 function processSurvey(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 tx.executeSql('SELECT * FROM TABLESURVEY WHERE surveyID = ' + results.rows.item(i).tableId, [], processSurveyHelper, errorCallbackSQLite);
	 } 
 }
 
 function processSurveyHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processSurveyHelper2( results.rows.item(i));
	 }
 }
 
 function processSurveyHelper2(newItem) {
	 //send survey
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/surveyOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				q1 : newItem.q1,
				q2 : newItem.q2,
				q3 : newItem.q3,
				q4 : newItem.q4,
				date : newItem.date
			},
			success : function(e) {
				console.log(e + ' :Offline Survey data sent to the server!');
				deleteFromOfflineActions(6, newItem.surveyID);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed! Offline survey data could not be sent');
			}
		});
		return false;
 }
 
 
 
 function processUpdatePurchaseStatus(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 tx.executeSql('SELECT * FROM TABLEUSERFOOD WHERE id = ' + results.rows.item(i).tableId, [], processUpdateStatusHelper, errorCallbackSQLite);
	 } 
 }
 
 function processUpdateStatusHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processUpdateStatusHelper2( results.rows.item(i));
	 }
 }
 
 function processUpdateStatusHelper2(newItem) {
	 //send update status
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/buyFromShoppingListOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"), 
				foodId: newItem.foodID, 
				date: newItem.date,
				statusChangeDate : newItem.statusChangeDate
			},
			success : function(e) {
				console.log(e + ' :Offline status data sent to the server!');
				deleteFromOfflineActions(9, newItem.id);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed! Offline status data could not be sent');
			}
		});
		return false;
 }
 
 
 /**
  * functions to send offline purchase data to server 
  * @param tx
  * @param results
  */
 function processAddFood(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 tx.executeSql('SELECT * FROM TABLEUSERFOOD WHERE id = ' + results.rows.item(i).tableId, [], processAddFoodHelper, errorCallbackSQLite);
	 } 
	 
 }

 function processAddFoodHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processAddFoodHelper2( results.rows.item(i));
	 }
 }

 function processAddFoodHelper2(newItem) {
	 
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/buyFoodOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				foodId : newItem.foodID,
				quantity : newItem.amount,
				usage : newItem.usage,
				waste : newItem.waste,
				date : newItem.date,
			},
			success : function(data) {
				console.log('offline data sent to the server');
				deleteFromOfflineActions(0, newItem.id);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed!');
			}
		});
		return false;
 }

 
 function processAddWaste(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		tx.executeSql('SELECT  TABLEWASTE.wasteID, TABLEWASTE.userfoodID, TABLEWASTE.amount, TABLEWASTE.wasteType, TABLEWASTE.wasteDate, ' + 
		' TABLEUSERFOOD.id, TABLEUSERFOOD.foodID, TABLEUSERFOOD.userID,  TABLEUSERFOOD.date, TABLEFOODS.foodID '  + 
		' FROM TABLEWASTE INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID INNER JOIN TABLEUSERFOOD ON TABLEUSERFOOD.id = TABLEWASTE.userfoodID ' +
		' WHERE  TABLEWASTE.wasteID = ' + results.rows.item(i).tableId, [], processAddWasteHelper, errorCallbackSQLite);
	 } 	 
 }
 
 function processAddWasteHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processAddWasteHelper2( results.rows.item(i));
	 }
 }

 function processAddWasteHelper2(newItem) {
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/addWasteOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				foodId : newItem.foodID,
				waste : newItem.amount,
				reason : newItem.wasteType,
				date : newItem.date,
				wasteDate : newItem.wasteDate,
			},
			success : function(data) {
				console.log('offline data sent to the server');
				deleteFromOfflineActions(2, newItem.wasteID);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed!');
			}
		});
		return false;
 }
 
 
 function processAddUsage(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		tx.executeSql('SELECT  TABLEUSAGE.usageID, TABLEUSAGE.userfoodID, TABLEUSAGE.amount, TABLEUSAGE.people, TABLEUSAGE.relationship, TABLEUSAGE.usageDate, ' + 
		' TABLEUSERFOOD.id, TABLEUSERFOOD.foodID, TABLEUSERFOOD.userID,  TABLEUSERFOOD.date, TABLEFOODS.foodID '  + 
		' FROM TABLEUSAGE INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID INNER JOIN TABLEUSERFOOD ON TABLEUSERFOOD.id = TABLEUSAGE.userfoodID ' +
		' WHERE  TABLEUSAGE.usageID = ' + results.rows.item(i).tableId, [], processAddUsageHelper, errorCallbackSQLite);
	 } 	 
 }
 
 function processAddUsageHelper(tx, results) {
	 var len = results.rows.length;
	 for(var i = 0; i < len; i++) {
		 processAddUsageHelper2( results.rows.item(i));
	 }
 }

 function processAddUsageHelper2(newItem) {
	 $.ajax({
			type : "GET",
			url : sessionStorage.getItem("serverDomain") + "/addUsageOffline?",
			crossDomain : false,
			beforeSend : function() {
				$.mobile.loading('show')
			},
			complete : function() {
				$.mobile.loading('hide')
			},
			dataType : 'json',
			data : {
				token : sessionStorage.getItem("usertoken"),
				foodId : newItem.foodID,
				usage : newItem.amount,
				people : newItem.people,
				relationship : newItem.relationship,
				date : newItem.date,
				usageDate : newItem.usageDate,
			},
			success : function(data) {
				console.log('offline data sent to the server');
				deleteFromOfflineActions(3, newItem.usageID);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed!');
			}
		});
		return false;
 }
 

 
 /**
  * functions to load food list from server
  * @param data
  */
 function addFoodsToDatabase(data) {
	 if( window.localStorage.getItem("serverdata") != "loaded") {
		 var count = data.length;
		 db.transaction( function(tx){ 
			 tx.executeSql('DELETE FROM TABLEFOODS' );
		 }, errorCallbackSQLite );
		 for (var i=0; i< count; i++) {
			 addFoodInLoop(data, i);
		 }
		 setAllFoodList();
		 window.localStorage.setItem("serverdata", "loaded");
	 }	
 }
 
 function setAllFoodList() {
	 db.transaction(selectAllFoods, errorCallbackSQLite, successCallbackSQLite);
 }
 
 function addFoodInLoop(data, i) {
	 db.transaction( function(tx){ 
		 id =  data[i].id;
		 name = data[i].name;
		 icon = data[i].icon;
		 unit =  data[i].unit;
		 tx.executeSql('INSERT INTO TABLEFOODS (foodID, foodName, foodIcon, foodUnit) VALUES ( ' +
				 id + ', "' + name + '", "' + icon + '", "' + unit + '" )' );
	 }, errorCallbackSQLite, successCallbackSQLite );
 }
 

 
 /**
  * functions to load user shopping list from server
  * @param data
  */
 function updateUserFoodListToDatabase(data) {
	 var count = data.length;
	 db.transaction( function(tx){ 
		 tx.executeSql('DELETE FROM TABLEUSERFOOD' );
	 }, errorCallbackSQLite );
	 for (var i=0; i< count; i++) {
		 addUserFoodInLoop(data, i);
	 }
 }
 
 function addUserFoodInLoop(data, i) {
	 db.transaction( function(tx){ addUserFoodToDatabase(tx,  data, i) }, errorCallbackSQLite );
 }
 
 
 function addUserFoodToDatabase(tx, data, i) {
	 tx.executeSql('INSERT INTO TABLEUSERFOOD (id, userID, foodID, date, amount, usage, waste, status, deletionDate, statusChangeDate) VALUES ( ' +
			 data[i].id + ', "' + data[i].userID + '", ' + data[i].foodID + ', "' +   data[i].date + '" , ' + data[i].amount + ',' + data[i].used + ',' + data[i].wasted
			 + ',' + data[i].status + ', NULL, NULL )');
	//set user data to memory 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food
	userFoodUsageData[userFoodUsageData.length] = new Array( data[i].id,  data[i].amount,  data[i].used,  data[i].wasted, data[i].date,  data[i].foodID);
	
 }
 
 
 /**
  * function to update food list offline
  * adds new item to tableuserfood
  * @param foodID
  * @param date
  * @param amount
  */
 function buyFoodOffline(foodID, date, amount, statusValue) {
	 db.transaction( function(tx){
		 tx.executeSql('INSERT INTO TABLEUSERFOOD (id, userID, foodID, date, amount, usage, waste, status, deletionDate, statusChangeDate) VALUES ( NULL, "' + 
			 currentUser + '", ' + foodID + ', "' + date + '" ,' + amount + ', 0, 0, ' + statusValue +  ', NULL, NULL)'); 
		 }, errorCallbackSQLite);
	 
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEUSERFOOD WHERE userID = "' + currentUser + '" AND foodID = ' + foodID + ' AND date = "' + date + '"', [], fillOfflineBuy, errorCallbackSQLite);
	 }, errorCallbackSQLite);
 }
 
 /**
  * adds new action to offline actions table
  * @param tx
  * @param results
  */
 function fillOfflineBuy(tx, results) {
	  tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES ( NULL, 0, 0, ' + results.rows.item(0).id + ')'); 
	 /* userFoodUsageData[userFoodUsageData.length] = new Array(  results.rows.item(0).id,   results.rows.item(0).id.amount,   
			  results.rows.item(0).id.usage,  results.rows.item(0).id.waste, results.rows.item(0).id.date, results.rows.item(0).id.foodID);
	  */
 }
 
 /**
  * function to add waste to database when user is offline
  * @param purchaseId
  * @param value
  * @param rowNumber
  * @param date
  */
 function wasteFoodOffline(purchaseId, value, rowNumber,  date) {
	 db.transaction( function(tx){ 
		 newVal =  parseInt(userFoodUsageData[rowNumber][3]);
		 newVal += parseInt(value);
		 userFoodUsageData[rowNumber][3] = newVal;
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET waste = ' + userFoodUsageData[rowNumber][3] +  ' WHERE id = ' + purchaseId);
		 tx.executeSql( 'INSERT INTO TABLEWASTE (wasteID, userfoodID, amount, wasteType, wasteDate, wasteStatus,  deletionDate) VALUES ( NULL ,' + 
				 purchaseId + ',' + value + ', 0, "' + date + '", 0 , NULL )' );
		 tx.executeSql('SELECT * FROM TABLEWASTE WHERE userfoodID = ' + purchaseId + ' AND amount = ' + value + ' AND wasteDate = "' + date + '"', [],
				 fillOfflineWaste, errorCallbackSQLite);
		
	 }, errorCallbackSQLite );
 }
 
 /**
  * adds new action to offline actions table
  * @param tx
  * @param results
  */
 function fillOfflineWaste(tx, results) {
	 if(results.rows.length > 0) {
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES ( NULL, 2, 1, ' + results.rows.item(0).wasteID + ')'); 
	 }
	   
 
 }
 
 /**
  * function to add food consumption when user is offline
  * @param purchaseId
  * @param value
  * @param rowNumber
  * @param date
  */
 function consumeFoodOffline(purchaseId, value, rowNumber,  date) {	 
	 db.transaction( function(tx){ 
		 userFoodUsageData[rowNumber][2] =  parseInt(userFoodUsageData[rowNumber][2]) + parseInt(value);
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET usage = ' +  userFoodUsageData[rowNumber][2] +  ' WHERE id = ' + purchaseId);
		 //returned id field is used?
		 tx.executeSql( 'INSERT INTO TABLEUSAGE (usageID, userfoodID, amount, people, relationship, usageDate) VALUES (NULL , ' + 
				 purchaseId + ',' + value + ', 0, 0, "' + date + '" )' );
		 tx.executeSql('SELECT * FROM TABLEUSAGE WHERE userfoodID = ' + purchaseId + ' AND amount = ' + value + ' AND usageDate = "' + date + '"', [],
				 fillOfflineUsage, errorCallbackSQLite);
		
	 }, errorCallbackSQLite );
 }     
 
 /**
  * adds new action to offline actions table
  * @param tx
  * @param results
  */
 function fillOfflineUsage(tx, results) {
	 if(results.rows.length > 0) {
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES ( NULL, 3, 2, ' + results.rows.item(0).usageID + ')'); 
	 }
 }
 
 
 /**
  * updates food amount offline
  * @param purchaseId
  * @param value
  */
 function updateFoodAmountOffline(purchaseId, value, rowNumber) {
	 db.transaction( function(tx){ 
		 userFoodUsageData[rowNumber][1] =  parseInt(value);
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET amount = ' +  userFoodUsageData[rowNumber][1] +  ' WHERE id = ' + purchaseId);
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES ( NULL, 1, 0, ' + purchaseId + ')'); 
	 }, errorCallbackSQLite );
 }
 
 

 
 
 /**
  * functions to load usage information from server
  * @param data
  */
 function updateUserUsageListToDatabase(data) {
	 var count = data.length;
	 db.transaction( function(tx){ 
		 tx.executeSql('DELETE FROM TABLEUSAGE' );
	 }, errorCallbackSQLite );
	 for (var i=0; i< count; i++) {
		 addUserUsageInLoop(data, i);
	 }
 }
 
 function addUserUsageInLoop(data, i) {
	 db.transaction( function(tx){ addUserUsageToDatabase(tx,  data, i) }, errorCallbackSQLite );
 }
 
 function addUserUsageToDatabase(tx, data, i) {
	 tx.executeSql('INSERT INTO TABLEUSAGE (usageID, userfoodID, amount, people, relationship, usageDate) VALUES ( ' +  data[i].id  + 
			 ' ,' + data[i].purchaseID + ',' + data[i].amount + ',' +  data[i].number  +   ','  +  data[i].type  + ', "' +  data[i].date + '" )');
 }
 
 /**
  * functions to load waste information from server
  * @param data
  */
 function updateUserWasteListToDatabase(data) {
	 var count = data.length;
	 db.transaction( function(tx){ 
		 tx.executeSql('DELETE FROM TABLEWASTE' );
	 }, errorCallbackSQLite );
	 for (var i=0; i< count; i++) {
		 addUserWasteInLoop(data, i);
	 }
 }
 
 function addUserWasteInLoop(data, i) {
	 db.transaction( function(tx){ addUserWasteToDatabase(tx,  data, i) }, errorCallbackSQLite );
 }
 
 function addUserWasteToDatabase(tx, data, i) {
	 tx.executeSql('INSERT INTO TABLEWASTE (wasteID, userfoodID, amount, wasteType, wasteDate, wasteStatus,  deletionDate) VALUES (' + 
			 data[i].id + ',' + data[i].purchaseID + ',' + data[i].amount + ',' +   data[i].type  + ', "' +  data[i].date + '", 0, NULL )');
	
 }
 
 
 function updateSurveyListToDatabase(data) {
	 var count = data.length;
	 db.transaction( function(tx){ 
		 tx.executeSql('DELETE FROM TABLESURVEY' );
	 }, errorCallbackSQLite );
	 for (var i=0; i< count; i++) {
		 addUserSurveyInLoop(data, i);
	 }
 }
  
 function addUserSurveyInLoop(data, i) {
	 db.transaction( function(tx){ 
		 id = data[i].id;
		 q1 = data[i].q1;
		 q2 = data[i].q2;
		 q3 = data[i].q3;
		 q4 = data[i].q4;
		 date = data[i].date;
		 tx.executeSql('INSERT INTO TABLESURVEY (surveyID, userID, q1, q2, q3, q4, date) VALUES ( ' + id + ', "' + currentUser + '",' +
				 q1 + ',' +  q2 + ',' +  q3 + ',' + q4 + ', "' + date + '" )');
	 }, errorCallbackSQLite );
 }
 
 
 /**
  * when an app is opened for a different or new user it will update the current user table with this function
  */
 function initializeCurrentUser(currentUserName) {
	 db.transaction( function(tx){ 
		 tx.executeSql('DELETE FROM TABLECURRENTUSER');
	 }, errorCallbackSQLite );
	 db.transaction( function(tx){ 
		 tx.executeSql('INSERT INTO TABLECURRENTUSER (userID, name) VALUES (1, "' + currentUserName + '" )');
	 }, errorCallbackSQLite );
	 window.localStorage.setItem("currentuser", currentUserName);
 }

 function getSavedUserData() {
	 return window.localStorage.getItem("currentuser");
 }
 
 /**
  * find the items user has purchased
  */
 function queryUserFoodDetails(tx) {
	 tx.executeSql('SELECT TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEFOODS.foodName, TABLEFOODS.foodUnit, TABLEUSERFOOD.id,  TABLEUSERFOOD.userID, TABLEUSERFOOD.amount, TABLEUSERFOOD.usage, TABLEUSERFOOD.waste, TABLEUSERFOOD.date, TABLEUSERFOOD.status FROM TABLEUSERFOOD INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', [], displayFoodInfo, errorCallbackSQLite);
 }
 
/**
 * queries sorts the user food details by date
 */
 function queryUserFoodDetailsSortByDate(tx, sorting) {
	  tx.executeSql('SELECT TABLEFOODS.foodIcon, TABLEFOODS.foodName, TABLEFOODS.foodUnit, TABLEUSERFOOD.id, TABLEUSERFOOD.userID, TABLEUSERFOOD.amount, TABLEUSERFOOD.usage, TABLEUSERFOOD.waste, TABLEUSERFOOD.date, TABLEUSERFOOD.status FROM TABLEUSERFOOD INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '" ORDER BY TABLEUSERFOOD.date ' + sorting, [], sortUserFoodTable, errorCallbackSQLite);
 }
 
 /**
  * user food table sort callback function
  */
 function sortUserFoodTable(tx, results) {
	 var table = document.getElementById("my-table");
	 var newRows = new Array();
	 var len = results.rows.length;
	 var newRowsIndex = 0;
	 //traverse all the foods of user and make a table with columns: food icon, amount, usage list, waste list
	 for (var i=0; i<len; i++) {
		 var rowHtmlR = '';
		 currentId =  results.rows.item(i).id;
		 
		//if the item is in the current list (available or shopping)
		 if(results.rows.item(i).status == 1) {
	    	
	    		 //if it is available list
	    		 //add it as a row
			 rowHtmlR += ' <tr style="padding-top: 0.5em !important;"><td><img src="' + results.rows.item(i).foodIcon + '" rel="' +  results.rows.item(i).foodName +'" id="swipeImage' + currentId + '" width="50" height="50"></td>';
		    	 
			 rowHtmlR += '<td><input type="number" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
		    	 results.rows.item(i).amount.toFixed(2) +  '" /><label font-style="italic"><i>' + results.rows.item(i).foodUnit + 
		    	 '</i></label></td>';
			 rowHtmlR += '<td style="width: 40%"><form class="full-width-slider">';
			 rowHtmlR += '<input type="range" class="ui-hidden-accessible"  data-mini="true" id="sliderUsage' + currentId + '"';
			 rowHtmlR += 'value="0" step="1" min="0" max="100" /></form></td>';
			 rowHtmlR += '<td><div id="deleteAvailable' + currentId + '"><a href=""   style="width:10%" data-role="button" data-icon="delete" data-iconpos="notext" data-mini="true" data-inline="true"  onclick="deleteUserFoodItem(' + currentId + ')"></div></td></tr>';
	    	 
			 newRows[newRowsIndex] = rowHtmlR;
			 newRowsIndex++;
		}		
	 }
	 
	 var tableLen = table.rows.length;
	//change the current table with new html values, the table will be sorted by date
	 for (var i = 0, row; i < tableLen; i++) {
		 //iterate through rows
		 row = table.rows[i];
		 row.innerHTML = newRows[i];
	 }
	 
	 
	 //this is needed for refreshing html item
	 $('#my-table').trigger("create");
	 
	//set user data to memory 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food, 6: status
		for (var i=0; i<len; i++){
			userFoodUsageData[i] = new Array(results.rows.item(i).id, results.rows.item(i).amount, results.rows.item(i).usage, results.rows.item(i).waste, results.rows.item(i).date,  results.rows.item(i).foodID, results.rows.item(i).status );
		}
		
		//set usage slider information
		for (var i=0; i<len; i++){
			currentId =  results.rows.item(i).id;
			$('#sliderUsage' + currentId).change(function(event, ui){
			    var slider_value = $(this).val();
				var amountVal =  event.target.id.replace("sliderUsage","amount");
				var oldVal =  findCurrentAmountById(event.target.id.replace("sliderUsage",""));
				var newVal = oldVal - oldVal * slider_value / 100;			
				 $('#' + amountVal).val(newVal.toFixed(2));
			});
		}
		
		//set swipe actions
		for (var i=0; i < userFoodUsageData.length; i++) {
			var nameValue = '#deleteAvailable' + userFoodUsageData[i][0];
			//$(nameValue).hide();
			$(document).on("swiperight", "#swipeImage" + userFoodUsageData[i][0], function(event, ui) {
				var buttonValue =  event.target.id.replace("swipeImage","deleteAvailable");
				$('#' + buttonValue).show();
		      });
			$(document).on("swipeleft", "#swipeImage" + userFoodUsageData[i][0], function(event, ui) {
				var buttonValue =  event.target.id.replace("swipeImage","deleteAvailable");
				$('#' + buttonValue).hide();
		      });
		}
		
		//set slider values to 0
		for (var i=0; i < userFoodUsageData.length; i++) {
			var nameValue = '#sliderUsage' + userFoodUsageData[i][0];
			$(nameValue).val(0);
			$(nameValue).trigger("change");
		}
 }
 
 function addUserFoodsToTable(results, tableStatus) {
	 var len = results.rows.length;
	//travserse the results and insert rows to the table	 
	 resultHTML = '';
	 for (var i=0; i<len; i++){
		 currentId =  results.rows.item(i).id;
		 
		 //if the item is in the current list (available or shopping)
		 if(results.rows.item(i).status == tableStatus) {
	    	 if(tableStatus == 0) {
	    		 //if it is shopping list
	    		 //add it as a row
				 resultHTML += '<tr class="gradeA"><td style="width:15%" ><img src="' + results.rows.item(i).foodIcon + '" rel="' +  results.rows.item(i).foodName +'"  id="swipeImage' + currentId + '" width="50" height="50"></td>';
		    	 
		    	 resultHTML += '<td style="width:40%"><input type="number" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
		    	 results.rows.item(i).amount.toFixed(2) +  '" /><label font-style="italic"><i>' + results.rows.item(i).foodUnit + 
		    	 '</i></label></td>';
	    		 resultHTML += '<td><input style="width:35%" type="button" id="shoppingConfirm' + currentId + '" value="Confirm" data-inline="true" data-mini="true" data-theme="a" onclick="buyItemFromShoppingList(' + currentId +')"></td>';
	    		 resultHTML += '<td><div id="deleteShopping' + currentId + '"><a href=""  data-role="button" data-icon="delete" data-iconpos="notext" data-mini="true" data-inline="true" onclick="deleteUserFoodItem(' + currentId + ')"></div></td></tr>';
	    		
	    		 
	    	 } else if (tableStatus == 1){
	    		 //if it is available list
	    		 //add it as a row
				 resultHTML += ' <tr style="padding-top: 0.5em !important;"><td><img src="' + results.rows.item(i).foodIcon + '" rel="' +  results.rows.item(i).foodName +'" id="swipeImage' + currentId + '" width="50" height="50"></td>';
		    	 
		    	 resultHTML += '<td><input type="number" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
		    	 results.rows.item(i).amount.toFixed(2) +  '" /><label font-style="italic"><i>' + results.rows.item(i).foodUnit + 
		    	 '</i></label></td>';
	    		 resultHTML += '<td style="width: 40%"><form class="full-width-slider">';
	    		 resultHTML += '<input type="range" class="ui-hidden-accessible" data-mini="true" id="sliderUsage' + currentId + '"';
		    	 resultHTML += 'value="0" step="1" min="0" max="100" /></form></td>';
		    	 resultHTML += '<td><div id="deleteAvailable' + currentId + '"><a href=""  data-role="button" data-icon="delete" data-iconpos="notext" data-mini="true" data-inline="true" onclick="deleteUserFoodItem(' + currentId + ')"></div></td></tr>';
		    	 
	    	 } else {
	    		 //do nothing since this means the item is deleted
	    	 }
		 } 	
     }
	 resultHTML += '</div></tbody></table>';
	 return resultHTML;
 }
 
 /**
  * update user food list page
  */
 function displayFoodInfo(tx, results) {
	 var len = results.rows.length;
	 
	 //create the table for displaying : food-icon, amount, usage selection
	 myHTMLOutput = '<table id="my-table" style="width:100%">';
	 myHTMLOutput += '<div class="scrollable" >';
		
	 //add table rows with the data retrieved from database to the available table list
	tableRows = addUserFoodsToTable(results, 1);
    myHTMLOutput += tableRows;
    
    
	//Update the DIV called Content Area with the HTML string
	document.getElementById("userFoodInfo").innerHTML = myHTMLOutput;
	 
	//refresh divison
	$('#userFoodInfo').trigger("create");
	
	//set user data to memory 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food, 6: status
	for (var i=0; i<len; i++){
		userFoodUsageData[i] = new Array(results.rows.item(i).id, results.rows.item(i).amount, results.rows.item(i).usage, results.rows.item(i).waste, results.rows.item(i).date,  results.rows.item(i).foodID, results.rows.item(i).status );
	}
	
	//set usage slider information
	for (var i=0; i<len; i++){
		currentId =  results.rows.item(i).id;
		$('#sliderUsage' + currentId).change(function(event, ui){
		    var slider_value = $(this).val();
			var amountVal =  event.target.id.replace("sliderUsage","amount");
			var oldVal =  findCurrentAmountById(event.target.id.replace("sliderUsage",""));
			var newVal = oldVal - oldVal * slider_value / 100;			
			 $('#' + amountVal).val(newVal.toFixed(2));
		});
	}
	
	//set swipe actions
	for (var i=0; i < userFoodUsageData.length; i++) {
		var nameValue = '#deleteAvailable' + userFoodUsageData[i][0];
		//$(nameValue).hide();
		$(document).on("swiperight", "#swipeImage" + userFoodUsageData[i][0], function(event, ui) {
			var buttonValue =  event.target.id.replace("swipeImage","deleteAvailable");
			$('#' + buttonValue).show();
	      });
		$(document).on("swipeleft", "#swipeImage" + userFoodUsageData[i][0], function(event, ui) {
			var buttonValue =  event.target.id.replace("swipeImage","deleteAvailable");
			$('#' + buttonValue).hide();
	      });
	}
	
	createShoppingListTable(results);
 }
 
 
 
 function createShoppingListTable(results) {
    //create the table for displaying shopping list
	 myShoppingList = '<table data-role="table" id="shoppingListTable">' +
		  '<thead class="ui-widget-header"><th width="20%"></th><th width="30%"></th><th width="20%" ></th><th width="30%" ></th></thead><tbody>';
	 myShoppingList += '<div class="scrollable" >';
		
	 //add table rows with the data retrieved from database to the available table list
	shoppingRows = addUserFoodsToTable(results, 0);
	myShoppingList += shoppingRows;
	
	//Update the DIV called Content Area with the HTML string
	document.getElementById("userShoppingList").innerHTML = myShoppingList;
	 
	//refresh divison
	$('#userShoppingList').trigger("create");
	
	//set swipe actions
	for (var i=0; i < userFoodUsageData.length; i++) {
		var nameValue = '#deleteShopping' + userFoodUsageData[i][0];
		//$(nameValue).hide();
		$(document).on("swiperight", "#swipeImage" + userFoodUsageData[i][0], function(event, ui) {
			var buttonValue =  event.target.id.replace("swipeImage","deleteShopping");
			$('#' + buttonValue).show();
	      });
		$(document).on("swipeleft", "#swipeImage" + userFoodUsageData[i][0], function(event, ui) {
			var buttonValue =  event.target.id.replace("swipeImage","deleteShopping");
			$('#' + buttonValue).hide();
	      });
	}
 }
 
 function queryBuyFromShoppingList(purchase, rowNumber, purchaseId) {
	 db.transaction( function(tx){ 
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET status = 1, date = "' + purchase[0].date + '" WHERE id = ' + purchaseId);
		 userFoodUsageData[rowNumber][userFoodUsageData] =  purchase[0].date;
		 }, 
     errorCallbackSQLite);	
	 
 }
 
 function buyFromShoppingListOffline(rowNumber, purchaseId) {
	 var val = getNow();
	 db.transaction( function(tx){ 
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET status = 1, statusChangeDate = "' + val + '" WHERE id = ' + purchaseId);
		 //userFoodUsageData[rowNumber][4] =  val;
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES ( NULL, 9, 0, ' + purchaseId + ')'); 
	 }, 
     errorCallbackSQLite);	
 }
 
function findCurrentAmountById(id) {
	for(var i=0; i < userFoodUsageData.length; i++) {
		if(userFoodUsageData[i][0] == id) {
			return userFoodUsageData[i][1];
		}
	}
	return 0;
}

function findPurchaseInfoById(id) {
	for(var i=0; i < userFoodUsageData.length; i++) {
		if(userFoodUsageData[i][0] == id) {
			return i;
		}
	}
	return -1;
}

 /**
  * updates bubbles that display new usage values
  */
function updateUsageBubbles() {
	//set usage events for bubble count
	if(newUsageNumber > 0) {
		for (var j=1; j<=10; j+=2) {
			//insert count bubbles on the icons
			$('#badge-page' + j).html(newUsageNumber).fadeIn();
		}	
	} else {
		//set usage events for bubble count
		for (var j=2; j<=10; j+=2) {
			//insert count bubbles on the icons
			$('#badge-page' + j).html(newWasteNumber).fadeOut();
		}	
	}
}

/**
 * updates bubbles that display new waste values
 */
function updateWasteBubbles() {
	if(newWasteNumber > 0) {
		//set waste events for bubble count
		for (var j=2; j<=10; j+=2) {
			//insert count bubbles on the icons
			$('#badge-page' + j).html(newWasteNumber).fadeIn();
		}	
	} else {
		//set waste events for bubble count
		for (var j=2; j<=12; j+=2) {
			//insert count bubbles on the icons
			$('#badge-page' + j).html(newWasteNumber).fadeOut();
		}	
	}
}

/**
 * for only one entry
 * calls query to update food usage details
 */
function updateFoodUsageRelAndPeople(data, i) {
	var id = userFoodUsageInfo[i][0];
	db.transaction( function(tx){ queryUpdateFoodUsageRelation(tx, id, data[0].type, data[0].number, i) }, errorCallbackSQLite);	
}

/**
 * updates table with food usage details
 */
function queryUpdateFoodUsageRelation(tx, id, val, val2, i) {
	tx.executeSql('UPDATE TABLEUSAGE SET relationship = ' + val +  ', people = ' + val2 +  ' WHERE usageID = ' + id);	
	userFoodUsageInfo[i][2] = val;
	userFoodUsageInfo[i][1] = val2;
}

/**
 * for only one entry
 * calls query to update food waste details
 */
function updateFoodWasteReasons( data, i) {
	var id = userFoodWasteInfo[i][0];
	db.transaction( function(tx){ queryUpdateFoodWasteReason(tx, id, data[0].type, i) }, errorCallbackSQLite);	
}

/**
 * updates table for food waste details
 */
function queryUpdateFoodWasteReason(tx, id, val, i) {
	tx.executeSql( 'UPDATE TABLEWASTE SET wasteType = ' + val +  ' WHERE wasteID = ' + id);
	userFoodWasteInfo[i][1] = val;
}

 /**
  * given selected value and food unit, constructs a selection menu with possible options and the selected one
  */
 function getHTMLSelectFoodUsage(number, foodUnit) {
	 var htmlOpt = '';
	 if(foodUnit == "g") {
		 //grams options
		 for (var index=0; index<= 2000 ; index+=250)
    	 { 
			 htmlOpt += getHTMLOption(index,  number);
			
    	 }
	 } else  if(foodUnit == "ml") {
		 //ml options
		 for (var index=0; index<= 2000 ; index+=250)
    	 { 
			 htmlOpt += getHTMLOption(index, number);
    	 }
	 } else if(foodUnit == "no.") {
		 //amount options
		 for (var index=1; index<= 10 ; index+=1)
    	 { 
			 htmlOpt += getHTMLOption(index,  number);
    	 }
	 }
	 return htmlOpt;
 }
 
 /**
  * if number1 is equal to number2 than the value should be signed as selected
  */
 function getHTMLOption(number1, number2) {
	 var htmlOpt = '';
	 if(number1 == number2) {
		 htmlOpt += '<option value="'+ number1 + '" selected="selected">' + number1 +'</option>'; 
	 } else {
		 htmlOpt += '<option value="'+ number1 + '">' + number1 +'</option>';
	 }
	 return htmlOpt;
 }
 
 
 /**
  * retrieve current user
  */
 function queryCurrentUser(tx) {
	 tx.executeSql('SELECT * FROM TABLECURRENTUSER', [], setCurrentUser, errorCallbackSQLite);
 }
 
 /**
  * set the current user value
  */
 function setCurrentUser(tx, results) {
	 if(results.rows.length == 1) {
		 currentUser = results.rows.item(0).name; 
	 }
	 
 }

 /**
  *  Query the database for all foods
  */
 function selectAllFoods(tx) {
    tx.executeSql('SELECT * FROM TABLEFOODS', [], getAllFoodList, errorCallbackSQLite);
 }
 
 
 /**
  * update user food list page
  */
 function getAllFoodList(tx, results) {
	 var len = results.rows.length;
	
	 var imageFoodLen =  len;
	 if (imageFoodLen > FOOD_NUMBER_ON_MAIN) imageFoodLen = FOOD_NUMBER_ON_MAIN;
	
	 //add foods to the main page
	 for (var i=0; i<imageFoodLen; i++){ 
		 mainPageFoods[i] = new Array(results.rows.item(i).foodID, results.rows.item(i).foodIcon);
	 }
	 addFoodsToMainPage();
    
	
	//fill search food filter list
	html = '';
	for (var i=0; i<len; i++){
		html += '<li food-id="' + results.rows.item(i).foodID + '" food-icon="' + results.rows.item(i).foodIcon + '"><a data-option-id=\"' + 
		results.rows.item(i).foodID + '\">' + results.rows.item(i).foodName + '</a></li>';
	}
	
	//this html variable will be used within the filter event
	foodListSelectHtml = html;
 }
 
 function addFoodsToMainPage() {
	 //add foods to the main page
	 var imageFoodLen =  mainPageFoods.length;
	 
	 if (imageFoodLen > FOOD_NUMBER_ON_MAIN) imageFoodLen = FOOD_NUMBER_ON_MAIN;
	 
	 myHTMLOutput = '<div class="ui-grid-b" data-scroll="true" id="mainFoodList">';
	 for (var i=0; i < imageFoodLen; ){		 
    	 myHTMLOutput += '<div class="ui-block-a">';
    	 myHTMLOutput += '<input type="image" src="' +  mainPageFoods[i][1] +
    	 '" id="' +   mainPageFoods[i][0] + '" value="0" onclick="selectFoodByImage(' + mainPageFoods[i][0] + ')"> </a>'
    	 myHTMLOutput += '</div>';
    	 i++;
    	 if(i < imageFoodLen) {
    		 myHTMLOutput += '<div class="ui-block-b">';
    		 myHTMLOutput += '<input type="image" src="' +  mainPageFoods[i][1] +
        	 '" id="' +   mainPageFoods[i][0] + '" value="0" onclick="selectFoodByImage(' + mainPageFoods[i][0] + ')"> </a>'
        	 myHTMLOutput += '</div>';
    	 }
    	 
    	 i++;
    	 if(i < imageFoodLen) {
    		 myHTMLOutput += '<div class="ui-block-c">';
    		 myHTMLOutput += '<input type="image" src="' +  mainPageFoods[i][1] +
        	 '" id="' +   mainPageFoods[i][0] + '" value="0" onclick="selectFoodByImage(' + mainPageFoods[i][0] + ')"> </a>'
        	 myHTMLOutput += '</div>';
    	 }    	
    	 i++;
     }
     myHTMLOutput += '</div>';
     
     
	//Update the DIV called Content Area with the HTML string
	document.getElementById("ContentFoodArea").innerHTML = myHTMLOutput;
 }


 /*
  * adds new food to the database
  */
 function queryAddFood(foodName) {
	 db.transaction( function(tx){ addFood(tx, foodName) }, errorCallbackSQLite );
 }
 
 function addFood(tx, foodId) {
	 var val = getNow();
	 tx.executeSql('INSERT INTO TABLEUSERFOOD (id, userID, foodID, date, amount, usage, waste, status, deletionDate, statusChangeDate) VALUES (NULL,"' + 
			 currentUser + '",' + foodId + ', "' + val + '", 0, 0, 0, 1, NULL, NULL)');
 }
 
 function getNow() {
	 var now = new Date();
	 var val = formatDate(now);
	 return val;
 }
 
 function formatDate(date) {
	 return  date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
 }
 
 /**
  * updates food amount in TALEUSERFOOD
  * @param foodId
  * @param foodAmount
  * @param rowNumber
  */
 function queryUpdateFoodAmount(pId, foodAmount, rowNumber) {
	 db.transaction( function(tx){ updateFoodAmount(tx, pId, foodAmount, rowNumber) }, errorCallbackSQLite );
 }
 
 function updateFoodAmount(tx, pId, foodAmount, rowNumber) {
	 tx.executeSql( 'UPDATE TABLEUSERFOOD SET amount = ' + foodAmount +  ' WHERE id = ' + pId);
	 userFoodUsageData[rowNumber][1] = foodAmount;
 }
 
 
 /**
  * updates food usage ifnormation in both tables TABLEUSERFOOD and TABLEUSAGE
  * @param data
  * @param usageRowNumber
  */
 function queryUpdateFoodUsage(data, usageRowNumber, purchaseId) {
	 db.transaction( function(tx){
		 userFoodUsageData[usageRowNumber][2] =  parseInt(userFoodUsageData[usageRowNumber][2]) + parseInt(data[0].amount);
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET usage = ' +  userFoodUsageData[usageRowNumber][2] +  ' WHERE id = ' + purchaseId);
		 var newVal =  data[0].amount;
		 var id =  data[0].id;
		 //returned id field is used?
		 tx.executeSql( 'INSERT INTO TABLEUSAGE (usageID, userfoodID, amount, people, relationship, usageDate) VALUES (' + id + ',' + 
				 purchaseId + ',' + newVal + ', 0, 0, "' + data[0].date + '" )' );
		
	 
	 }, errorCallbackSQLite );
 }
 
 /**
  * updates waste information in both tables TABLEUSERFOOD and TABLEWASTE
  * @param data
  * @param usageRowNumber
  */
 function queryUpdateFoodWaste(data, usageRowNumber, purchaseId) {
	 db.transaction( function(tx){ 
		 userFoodUsageData[usageRowNumber][3] =  parseInt(userFoodUsageData[usageRowNumber][3]) + parseInt(data[0].amount);
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET waste = ' + userFoodUsageData[usageRowNumber][3] +  ' WHERE id = ' + data[0].purchaseID);
		 var newVal =  data[0].amount;
		 var id =  data[0].id;
		 tx.executeSql( 'INSERT INTO TABLEWASTE (wasteID, userfoodID, amount, wasteType, wasteDate, wasteStatus, deletionDate) VALUES (' + id + ',' + 
				 purchaseId + ',' + newVal + ', 0, "' + data[0].date + '", 0, NULL )' );
		
	 }, errorCallbackSQLite );
 }
 
 /**
  * finds waste information
  * @param tx
  */
 function queryWasteWithReason(tx) {	 
	 tx.executeSql('SELECT TABLEWASTE.wasteID, TABLEWASTE.userfoodID, TABLEWASTE.amount, TABLEWASTE.wasteType, TABLEWASTE.wasteDate, TABLEWASTE.wasteStatus, TABLEUSERFOOD.id, TABLEUSERFOOD.foodID, TABLEUSERFOOD.userID,  TABLEUSERFOOD.date, TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEWASTETYPE.wasteTypeID, TABLEWASTETYPE.data FROM TABLEWASTETYPE INNER JOIN TABLEWASTE ON TABLEWASTETYPE.wasteTypeID = TABLEWASTE.wasteType INNER JOIN TABLEUSERFOOD ON TABLEUSERFOOD.id = TABLEWASTE.userfoodID INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', 
			 [], getFoodWasteList, errorCallbackSQLite);
 }
 
 /**
  * update user food list page
  */
 function getFoodWasteList(tx, results) {
	 var len = results.rows.length;	
	//set waste info to memory for further updates
	 //0: waste id, 1: reason, 2:foodId , 3:purchase date, 4: waste date
		for (var i=0; i<len; i++){
			
				userFoodWasteInfo[i] = new Array(results.rows.item(i).wasteID, results.rows.item(i).wasteType, 
						results.rows.item(i).foodID, results.rows.item(i).date, results.rows.item(i).wasteDate );
			
			
		}	
		myHTMLOutput = '<table style="width:100%" class="table-stroke" id="waste-table" data-mode="columntoggle">' +
		  '<thead><th></th><th></th><th></th><th></th></thead><tbody>';
		myHTMLOutput += '<div class="scrollable" >';
		var wasteIdd;
	    for (var i=0; i<len; i++){
	    	if(results.rows.item(i).wasteStatus == 0) {
	    		wasteIdd = results.rows.item(i).wasteID;
		    	 myHTMLOutput += ' <tr><td><img src="' + results.rows.item(i).foodIcon + '" id="swipeWaste' + wasteIdd + ' width="50" height="50"></td>';
		    	 
		    	 myHTMLOutput += '<td><label class="my-label">' + results.rows.item(i).amount.toFixed(2) + '</label></td>';
		    
		    	 myHTMLOutput += '<td><select name="reason" id="' + wasteIdd + 'WasteType" data-native-menu="false" data-theme="a" data-mini="true" data-icon="false">'; 
		    	 myHTMLOutput += getReasonsHTML(results.rows.item(i).wasteType, wasteReasons);
		    	 myHTMLOutput += '</select></td>';
		    	 myHTMLOutput += '<td style="width:15%"><div id="deleteWaste' + wasteIdd + '"><a href="" data-role="button" data-icon="delete" data-iconpos="notext" data-mini="true" data-inline="true" onclick="deleteWasteItem(' + wasteIdd + ')"></div></td></tr>';

	    	}
	    }
	     myHTMLOutput += '</div></tbody></table>';
		//Update the DIV called Content Area with the HTML string
		document.getElementById("wasteList").innerHTML = myHTMLOutput;
		$('#wasteList').trigger("create");
	
	//set swipe actions
	for (var i=0; i < userFoodWasteInfo.length; i++) {
		var nameValue = '#deleteWaste' + userFoodWasteInfo[i][0];
		//$(nameValue).hide();
		$(document).on("swiperight", "#swipeWaste" + userFoodUsageData[i][0], function(event, ui) {
			var buttonValue =  event.target.id.replace("swipeImage","deleteWaste");
			$('#' + buttonValue).show();
	      });
		$(document).on("swipeleft", "#swipeWaste" + userFoodUsageData[i][0], function(event, ui) {
			var buttonValue =  event.target.id.replace("swipeImage","deleteWaste");
			$('#' + buttonValue).hide();
	      });
	}
 }
 
 
 function findWasteInfoById(id) {
	 for(var i=0; i < userFoodWasteInfo.length; i++) {
		if(userFoodWasteInfo[i][0] == id) {
				return i;
		}
	}
	return -1;
 }
 

 
 /**
  * finds the usage information
  */
 function queryUsageWithReason(tx) {	 
	 tx.executeSql('SELECT TABLEUSAGE.usageID, TABLEUSAGE.userfoodID, TABLEUSAGE.amount, TABLEUSAGE.people, TABLEUSAGE.relationship, TABLEUSAGE.usageDate, TABLEUSERFOOD.id, TABLEUSERFOOD.foodID, TABLEUSERFOOD.date, TABLEUSERFOOD.userID, TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEREL.relID, TABLEREL.data FROM TABLEREL INNER JOIN TABLEUSAGE ON TABLEREL.relID = TABLEUSAGE.relationship INNER JOIN TABLEUSERFOOD ON TABLEUSERFOOD.id = TABLEUSAGE.userfoodID INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', 
			 [], getFoodUsageList, errorCallbackSQLite);
 }
 
 
 /**
  * update user food list page
  */
 function getFoodUsageList(tx, results) {
	 var len = results.rows.length;	
	//set usage to memory for further updates
	 //0: usage id, 1: people info, 2:relationship, 3:foodId , 4:purchase date, 5: usage date
		for (var i=0; i<len; i++){
			userFoodUsageInfo[i] = new Array(results.rows.item(i).usageID, results.rows.item(i).people, results.rows.item(i).relationship, results.rows.item(i).foodID, results.rows.item(i).date, results.rows.item(i).usageDate );
		}
		
	if(len > 0) {
		myHTMLOutput = '<table data-role="table" class="table-stroke" id="usage-table" data-mode="columntoggle">' +
		  '<thead class="ui-widget-header"><th></th><th></th><th><i>Specify Food Usage</i></th></thead><tbody>';
		myHTMLOutput += '<div class="scrollable" >';
	    for (var i=0; i<len; i++){
	    	 myHTMLOutput += ' <tr><td><img src="' + results.rows.item(i).foodIcon + '" width="50" height="50"></td>';
	    	 
	    	 myHTMLOutput += '<td><label class="my-label">' + results.rows.item(i).amount.toFixed(2) + '</label></td>';
	    
	    	 myHTMLOutput += '<td><select name="reason" id="' + results.rows.item(i).usageID + 'Relationship" data-native-menu="false" data-theme="a"data-mini="true" data-icon="false">'; 
	    	 myHTMLOutput += getReasonsHTML(results.rows.item(i).relationship, usageReasons);
	    	 myHTMLOutput += '</select>'; 
	    	 myHTMLOutput += '<select  name="People' + results.rows.item(i).usageID +  '" id="' + results.rows.item(i).usageID + 'People" data-native-menu="false" data-theme="a"data-mini="true" data-icon="false"/>';
	    	
	    	 myHTMLOutput += getPeopleHTML(results.rows.item(i).people);
	
	    	 myHTMLOutput += '</select></td></tr>';
	     }
	     myHTMLOutput += '</div></tbody></table>';
	   
		//Update the DIV called Content Area with the HTML string
		document.getElementById("usageList").innerHTML = myHTMLOutput;
		$('#usageList').trigger("create");
		
	}	
	
 }
 
 /**
  * returns people types as an html selection object
  */
 function getPeopleHTML(people) {
	peopleHTML = '<option><i>Number of people</i></option>';
	for ( var i = 0; i < 5; i++) {
		if (i == people) {
			peopleHTML += '<option value="' + i + '" selected="selected">' + i
					+ '</option>';
		} else {
			peopleHTML += '<option value="' + i + '">' + i + '</option>';
		}
	}
	if (people >= 5) {
		peopleHTML += '<option value="' + 5 + '" selected="selected">' + '5+'
				+ '</option>';
	} else {
		peopleHTML += '<option value="' + 5 + '">' + '5+' + '</option>';
	}
	return peopleHTML;
 }
 
 /**
  * returns an option list representation of the given array. the option
  * which is equal to the selectedValue is set as selected
  */ 
 function getReasonsHTML(selectedValue, arrayP) {
	 var len = arrayP.length;
	 reasonsSelectHTML = '';
     if(len > 0) {
	    for (var i=0; i<len; i++){
	    	if(i == selectedValue) {
	    		reasonsSelectHTML += '<option value="' + i + '" selected="selected">' + arrayP[i] +'</option>';
	    	} else {
	    		reasonsSelectHTML += '<option value="' + i + '">' + arrayP[i] +'</option>';
	    	}	    	
	   }
	}
    return reasonsSelectHTML;
 }
 
 /**
  * finds the last answers to survey
  * @param tx
  */
 function querySurveyData(tx) {
	 tx.executeSql('SELECT * FROM TABLESURVEY WHERE userID = "' + currentUser + '" ORDER BY date DESC', [], getSurveyData, errorCallbackSQLite);
 }
 
 /**
  * sets survey answers to screen
  * @param tx
  * @param results
  */
 function getSurveyData(tx, results) {
	len = results.rows.length;
	
	if(len > 0) {
		$('#slider-1').val(results.rows.item(0).q1);
		$('#slider-1').trigger("change");
		$('#slider-2').val(results.rows.item(0).q2);
		$('#slider-2').trigger("change");
		$('#slider-3').val(results.rows.item(0).q3);
		$('#slider-3').trigger("change");
		$('#slider-4').val(results.rows.item(0).q4);
		$('#slider-4').trigger("change");
	}
 }
 
/**
 * updates survey data to database
 * @param data
 */ 
function queryUpdateSurveyData(data) {
	 db.transaction( function(tx){
		 id = data.id;
		 q1 = data.q1;
		 q2 = data.q2;
		 q3 = data.q3;
		 q4 = data.q4;
		 tx.executeSql('INSERT INTO TABLESURVEY (surveyID, userID, q1, q2, q3, q4, date) VALUES ( ' + id + ', "' + currentUser + '",' +
				 q1 + ',' +  q2 + ',' +  q3 + ',' + q4 + ', "' +  data.date + '" )');
	 }, errorCallbackSQLite );
 }
 
 /**
  * delete given purchase from purchase table
  */
function queryDeleteData(wasteList, rowNumber, purchaseId) {
	 db.transaction( function(tx){
		 tx.executeSql('UPDATE TABLEUSERFOOD SET status = 2 WHERE id = ' + purchaseId);
	 }, errorCallbackSQLite);
	 if(wasteList.length == 1) {
		 db.transaction( function(tx) {
			 tx.executeSql('INSERT INTO TABLEWASTE (wasteID, userfoodID, amount, wasteType, wasteDate, wasteStatus, deletionDate) VALUES ( NULL ,' + 
					 purchaseId + ',' + wasteList[0].amount + ', ' + wasteList[0].type +', "' + wasteList[0].date + '", 0, NULL)' );
		 });
		 newWasteNumber += 1;
		updateWasteBubbles();
	 }
	
	loadUserList();

}	
 
function queryDeleteWaste(rowNumber, wasteId) {
	 db.transaction( function(tx){
		 tx.executeSql('DELETE FROM TABLEWASTE WHERE wasteID = ' + wasteId);
	 }, errorCallbackSQLite);
	 loadUserWasteList();
}
 
/**
 * updates waste reason info offline
 */
function updateFoodWasteReasonsOffline(reason, rowNumber) {
	var rowI = parseInt(rowNumber);
	db.transaction( 
			function(tx){ 
				queryUpdateFoodWasteReason(tx, userFoodWasteInfo[rowI][0], reason, rowI); 
				tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES (NULL, 4, 1, ' +  userFoodWasteInfo[rowI][0] + ')' ); 
				}, 
	errorCallbackSQLite);	
}

/**
 * deletes purchase data offline
 * @param pId
 * @param rowNumber
 */
function deletePurchaseDataOffline(pId, rowNumber) {
	var amount = 0;
	for(i=0; i < userFoodUsageData.length; i++) {
		if(userFoodUsageData[i][0] == pId) {
			amount = userFoodUsageData[i][1];
			break;
		}
	}
	var val = getNow();
	if(amount > 0) {
		wasteFoodOffline(pId, amount, rowNumber,  val);
		newWasteNumber += 1;
		updateWasteBubbles();
	}
	
	db.transaction( function(tx){ 
		 tx.executeSql('UPDATE TABLEUSERFOOD SET status = ' + 2 +  ' WHERE id = ' + pId );
		 tx.executeSql('UPDATE TABLEUSERFOOD SET deletionDate = "' + val +  '" WHERE id = ' + pId );
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES (NULL, 7, 0, ' + pId + ')' );	 
	},
	errorCallbackSQLite);	
	loadUserList();
	
}


/**
 * deletes waste offline
 * @param wasteId
 * @param rowNumber
 */
function deleteWasteOffline(rowNumber, wasteId) {
	var val = getNow();
	db.transaction( function(tx){ 
		 tx.executeSql('UPDATE TABLEWASTE SET status = 1 WHERE wasteID = ' + wasteId);
		 tx.executeSql('UPDATE TABLEWASTE SET deletionDate = "' + val + '" WHERE wasteID = ' + wasteId);
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES (NULL, 8, 1, ' + wasteId + ')' );	 
	}, 
	errorCallbackSQLite);	
	loadUserWasteList();
}

function saveSurveyOffline(q1, q2, q3, q4) {
	var val = getNow();
	 db.transaction( function(tx){
		 tx.executeSql('INSERT INTO TABLESURVEY (surveyID, userID, q1, q2, q3, q4, date) VALUES ( NULL'  + ', "' + currentUser + '",' +
				 q1 + ',' +  q2 + ',' +  q3 + ',' + q4 + ', "' +  val + '" )');
		
	 }, errorCallbackSQLite );
	 
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLESURVEY WHERE userID = "' + currentUser + '"  AND date = "' + val + '"', [], fillOfflineSurvey, errorCallbackSQLite);
	 }, errorCallbackSQLite);
}

function fillOfflineSurvey(tx, results) {
	if(results.rows.length == 1) {
		tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES (NULL, 6, 3, ' + results.rows.item(0).surveyID + ')' );	
	}
	 	
}


function saveUserActionOffline( type,  date,  data) {
	 db.transaction( function(tx){
		 tx.executeSql('INSERT INTO TABLEUSERACTIONS (id, actionNumber, date, data) VALUES (NULL,' + type + ', "' +  date + '", "' + data + '")' );
	 }, errorCallbackSQLite);		
}



