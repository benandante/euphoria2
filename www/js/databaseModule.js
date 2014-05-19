var currentUser;
var db;
var wasteReasons = new Array();
/*var usageReasons = new Array();*/
var FOOD_NUMBER_ON_MAIN = 12;
var userFoodUsageData = new Array();	// 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food,  6: status, 7: foodUnit
/*var newUsageNumber = 0;*/
var newWasteNumber = 0;
/*var userFoodUsageInfo = new Array();	*/
var userFoodWasteInfo = new Array(); 	 //0: waste id, 1: reason, 2:foodId , 3:purchase date, 4: waste date
var foodListSelectHtml;
var mainPageFoods = new Array();
var undoStack = [];
var UNDO_UPDATE_USAGE_AMOUNT = 1;
var UNDO_ADD_CONSUMPTION = 2;
var undoWasteStack = [];
var userDataLoaded = 0;

//TODO could not solve passing parameter to callback function problem and therefore using this global variable
var g_idOfDeletedPurchase;

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
	/*db.transaction(function(tx) {
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
	//window.localStorage.setItem("serverdata", "unloaded");
	db.transaction(populateDB, databaseInitError, fillPagesWithDbData);
	
 }
 
 
 function databaseInitError(tx, err) {
	 console.log("database could not be initialized: " + err);
 }
 
 function fillPagesWithDbData() {
	db.transaction(queryCurrentUser, errorCallbackSQLite, successCallbackSQLite);	
	db.transaction(selectAllFoods, errorCallbackSQLite, successCallbackSQLite);
	db.transaction(queryWasteReasons, errorCallbackSQLite, successCallbackSQLite);
	
	db.transaction( function(tx){
		tx.executeSql('SELECT TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEFOODS.foodName, TABLEFOODS.foodUnit, TABLEUSERFOOD.id,  TABLEUSERFOOD.userID, TABLEUSERFOOD.amount, TABLEUSERFOOD.usage, TABLEUSERFOOD.waste, TABLEUSERFOOD.date, TABLEUSERFOOD.status FROM TABLEUSERFOOD INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', [], fillUserFoodData, errorCallbackSQLite);
		 tx.executeSql('SELECT TABLEWASTE.wasteID, TABLEWASTE.userfoodID, TABLEWASTE.amount, TABLEWASTE.wasteType, TABLEWASTE.wasteDate, TABLEWASTE.wasteStatus, TABLEUSERFOOD.id, TABLEUSERFOOD.foodID, TABLEUSERFOOD.userID,  TABLEUSERFOOD.date, TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEWASTETYPE.wasteTypeID, TABLEWASTETYPE.data FROM TABLEWASTETYPE INNER JOIN TABLEWASTE ON TABLEWASTETYPE.wasteTypeID = TABLEWASTE.wasteType INNER JOIN TABLEUSERFOOD ON TABLEUSERFOOD.id = TABLEWASTE.userfoodID INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', 
				 [], fillUserWasteArray, errorCallbackSQLite);
	}, errorCallbackSQLite);

	
 }
 
 function fillUserFoodData(tx, results) {
		//set user data to memory 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food, 6: status
	var len = results.rows.length;	
	userFoodUsageData.splice(0, userFoodUsageData.length);
	 for (var i=0; i<len; i++){
			userFoodUsageData[i] = new Array(results.rows.item(i).id, results.rows.item(i).amount, 
					results.rows.item(i).usage, results.rows.item(i).waste, results.rows.item(i).date,  
					results.rows.item(i).foodID, results.rows.item(i).status, results.rows.item(i).foodUnit );
		}
	 getOfflineActions();	
 }
 
 
 function fillUserWasteArray(tx, results) {
	 var len = results.rows.length;	
		//set waste info to memory for further updates
		 //0: waste id, 1: reason, 2:foodId , 3:purchase date, 4: waste date
			for (var i=0; i<len; i++){
				
					userFoodWasteInfo[i] = new Array(results.rows.item(i).wasteID, results.rows.item(i).wasteType, 
							results.rows.item(i).foodID, results.rows.item(i).date, results.rows.item(i).wasteDate );
				
				
			}	
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
  * loads user food list to the html file
  */
 function createUserList() {
	 db.transaction( function(tx){ 
			 tx.executeSql('SELECT TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEFOODS.foodName, TABLEFOODS.foodUnit, TABLEUSERFOOD.id,  TABLEUSERFOOD.userID, TABLEUSERFOOD.amount, TABLEUSERFOOD.usage, TABLEUSERFOOD.waste, TABLEUSERFOOD.date, TABLEUSERFOOD.status FROM TABLEUSERFOOD INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', [], 
			 displayFoodInfoForFirstTime, errorCallbackSQLite)}, 
			 errorCallbackSQLite, successCallbackSQLite);
 }
 
 function displayFoodInfoForFirstTime(tx, results) {
	 var len = results.rows.length;
	 
	 var myHTMLOutput = '';
	 //create the table for displaying : food-icon, amount, usage selection
	 if(len > 0) {
		 myHTMLOutput = '<table id="my-table" style="width:100%" border=1 frame=void rules=rows>';
		 myHTMLOutput += '<div class="scrollable" >';
			
		 //add table rows with the data retrieved from database to the available table list
		var tableRows = addUserFoodsToTable(results, 1);
		if(tableRows == '') {
			 myHTMLOutput = '<p></p><label  class="unit-label">You do not have any items.</label>';
		} else {
			  myHTMLOutput += tableRows;
			  myHTMLOutput += '</div></table>';
		} 
	    
	}    
    
	changeUserFoodInfoHTML(myHTMLOutput);

    userFoodUsageData.splice(userFoodUsageData, userFoodUsageData.length);
	//set user data to memory 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food, 6: status
	for (var i=0; i<len; i++){
		userFoodUsageData[i] = new Array(results.rows.item(i).id, results.rows.item(i).amount, results.rows.item(i).usage, 
				results.rows.item(i).waste, results.rows.item(i).date,  results.rows.item(i).foodID, results.rows.item(i).status,
				 results.rows.item(i).foodUnit);
	}
	
	createShoppingListTable(results);

	//set actions (usage slider information) (amount change actions)
	var rows = results.rows;
	for (var i=0; i<len; i++){
		setUserFoodTableActions(rows.item(i).id);
	}	
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
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (0, "Select reason...")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (1, "Change of plans")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (2, "Did not like it")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (3, "It was unhealthy")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (4, "No shopping list")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (5, "Over-buying")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (6, "Special offer")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (7, "Use by date passed")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (8, "Stock invisibility")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (9, "Wrong storage")');		 
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (10, "Other")');
		 tx.executeSql('INSERT INTO TABLEWASTETYPE (wasteTypeID, data) VALUES (11, "There is no waste")');
		 
		 
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
	 for(i=0, len = userFoodWasteInfo.length; i < len; i++ ) {
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
	 for(var i=0, len= userFoodWasteInfo.length; i < len; i++ ) {
		 if(userFoodUsageData[i][0] == newItem.id) {
			 rowNumber = i;
			 break;
		 }
	 }
	 
	 //send waste deletion request
	deletePurchaseOffline(userFoodUsageData[rowNumber][5], userFoodUsageData[rowNumber][4], newItem.deletionDate, newItem.id);
		
 }
 
 function deletePurchaseOffline(fId, pDate, dDate, nId) {
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
				foodId :fId,
				purchaseDate : pDate,
				deletionDate : dDate
			},
			success : function(e) {
				console.log(e + ' :Data sent to the server!');
				g_idOfDeletedPurchase = nId;
				deletePurchaseIfNoWaste(nId);
				deleteFromOfflineActions(7, nId);
			},
			error : function(e) {
				console.log(e + ' :Server connection failed!');
			}
		});
}
 
 function deletePurchaseIfNoWaste(nId) {
	 db.transaction( function(tx){
		 tx.executeSql('SELECT * FROM TABLEWASTE WHERE userFoodID  = ' + nId, [], 
				 processdeletePurchaseIfNoWaste, errorCallbackSQLite);
	 }, errorCallbackSQLite);
 }
 
 function processdeletePurchaseIfNoWaste(tx, results) {
	 var len = results.rows.length;
	 if(len == 0) {
		 tx.executeSql('DELETE FROM TABLEUSERFOOD WHERE id = ' + g_idOfDeletedPurchase);
	 }
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
	userFoodUsageData[userFoodUsageData.length] = new Array( data[i].id,  data[i].amount,  data[i].used,  data[i].wasted, data[i].date,  data[i].foodID, data[i].status,  data[i].unit);
	
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
		 var newVal =  parseFloat(userFoodUsageData[rowNumber][3]);
		 newVal += parseFloat(value);
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
		 userFoodUsageData[rowNumber][2] =  parseFloat(userFoodUsageData[rowNumber][2]) + parseFloat(value);
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
		 userFoodUsageData[rowNumber][1] =  parseFloat(value);
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
		 var id = data[i].id;
		 var q1 = data[i].q1;
		 var q2 = data[i].q2;
		 var q3 = data[i].q3;
		 var q4 = data[i].q4;
		 var vdate = data[i].date;
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
	 tx.executeSql('SELECT TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEFOODS.foodName, TABLEFOODS.foodUnit, TABLEUSERFOOD.id,  TABLEUSERFOOD.userID, TABLEUSERFOOD.amount, TABLEUSERFOOD.usage, TABLEUSERFOOD.waste, TABLEUSERFOOD.date, TABLEUSERFOOD.status FROM TABLEUSERFOOD INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', [], 
			 displayFoodInfo, errorCallbackSQLite);
 }
 
/**
 * queries sorts the user food details by date
 */
 function queryUserFoodDetailsSortByDate(tx, sorting) {
	  tx.executeSql('SELECT TABLEFOODS.foodIcon, TABLEFOODS.foodName, TABLEFOODS.foodUnit, TABLEUSERFOOD.id, TABLEUSERFOOD.userID, TABLEUSERFOOD.amount, TABLEUSERFOOD.usage, TABLEUSERFOOD.waste, TABLEUSERFOOD.date, TABLEUSERFOOD.status FROM TABLEUSERFOOD INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '" ORDER BY TABLEUSERFOOD.date ' + sorting, [], 
			  sortUserFoodTable, errorCallbackSQLite);
 }
 
 /**
  * user food table sort callback function
  */
 function sortUserFoodTable(tx, results) {
	 var table = document.getElementById("my-table");
	 var newRows = new Array();
	 var len = results.rows.length;
	 var newRowsIndex = 0;
	 var currentRow;
	 var currentId;
	 //traverse all the foods of user and make a table with columns: food icon, amount, usage list, waste list
	 for (var i=0; i<len; i++) {
		 var rowHtmlR = '';
		 currentRow = results.rows.item(i);
		 currentId = currentRow.id;
		 
		 
		//if the item is in the current list (available or shopping)
		 if(currentRow.status == 1) {
	    	
	    		 //if it is available list
	    		 //add it as a row
			 rowHtmlR += ' <tr data-value="unselected" id="row' + currentId + '" style="padding-top: 0.5em !important;"><td><input type="image" src="' + currentRow.foodIcon + '" rel="' +  currentRow.foodName +'" id="swipeImage' + currentId + '" width="50" height="50" ></td>';
	    	 if(currentRow.amount > 0) {
	    		 rowHtmlR += '<td><input type="number"  disabled="true" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
		    	 (currentRow.amount -  currentRow.usage).toFixed(2) +  '" /><label font-style="italic" class="unit-label"><i>' + currentRow.foodUnit + 
		    	 '</i></label></td>';
	    	 } else {
	    		 rowHtmlR += '<td><input type="number" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
		    	 (currentRow.amount -  currentRow.usage).toFixed(2) +  '" /><label font-style="italic" class="unit-label"><i>' + currentRow.foodUnit + 
		    	 '</i></label></td>';
	    	 }
			
			 rowHtmlR += '<td>';
			 if( (currentRow.amount -  currentRow.usage).toFixed(2) > 0) {				
				 rowHtmlR += '<input type="number"  step="1" min="0" maxlength="5" size="5" data-mini="true" id="sliderUsage' + currentId + '"';
			 } else {
				 rowHtmlR += '<input type="number"  disabled="true" step="1" min="0" maxlength="5" size="5" data-mini="true" id="sliderUsage' + currentId + '"';				
			 }
			 rowHtmlR += ' value="0" /><label font-style="italic" class="per-label"><i>Indicate consumption</i></label></td>';
			 rowHtmlR += '</tr>';
	    	 
			 newRows[newRowsIndex] = rowHtmlR;
			 newRowsIndex++;
		}		
	 }
	 
	 var tableLen = table.rows.length;
	//change the current table with new html values, the table will be sorted by date
	 for (var i = 0, row; i < tableLen; i++) {
		 //iterate through rows
		 row = table.rows[i];
		 row.outerHTML = newRows[i];
	 }
	 
	 
	 //this is needed for refreshing html item
	 $('#my-table').trigger("create");

	//set actions (usage slider information) (amount change actions)
	for (var i=0; i<len; i++){
		setUserFoodTableActions(results.rows.item(i).id);
	}	
		
		setSlidersToZero();
 }
 
 
 
 function addUserFoodsToTable(results, tableStatus) {

	 var len = results.rows.length;
	//travserse the results and insert rows to the table	 
	 var tableHTML = '';
	 
	 var currentRow;
	 var currentId;
	 
	 if(tableStatus == 0) {
		
		 for (var i=0; i<len; i++){
			 currentRow = results.rows.item(i);
			 currentId = currentRow.id;
			 
			 //if the item is in the current list (available or shopping)
			 if(currentRow.status == tableStatus) {
		    	
	    		 //if it is shopping list
	    		 //add it as a row
				 tableHTML += '<tr data-value="unselected" id="row' + currentId + '" ><td style="width:15%" ><input type="image" src="' + currentRow.foodIcon + '" rel="' +  currentRow.foodName +'"  id="swipeImage' + currentId + '" width="50" height="50" ;"></td>';
		    	 
				 tableHTML += '<td style="width:60%"><input type="number" step="1" min="0" maxlength="6" size="6" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
		    	 currentRow.amount.toFixed(2) +  '" /><label  class="unit-label" font-style="italic"><i>' + currentRow.foodUnit + 
		    	 '</i></label></td>';
				 tableHTML += '<td style="width:20%"><a href="" type="button" id="shoppingConfirm' + currentId + '" value="Bought" data-icon="check" data-corners="false" data-iconshadow="false" class="ui-icon-nodisc" data-mini="true" data-theme="a" onclick="buyItemFromShoppingList(' + currentId +')">Bought<a></td>';
				 tableHTML += '</tr>';
			 } 	
	     }
	 }
	 else {
		 for (var i=0; i<len; i++){
			 currentRow = results.rows.item(i);
			 currentId = currentRow.id;
			 
			 //if the item is in the current list (available or shopping)
			 if(currentRow.status == tableStatus) {
		    	
		    		 //if it is available list
		    		 //add it as a row
				 tableHTML += ' <tr data-value="unselected" id="row' + currentId + '" style="padding-top: 0.5em !important;"><td><input type="image" src="' + currentRow.foodIcon + '" rel="' +  currentRow.foodName +'" id="swipeImage' + currentId + '" width="50" height="50"></td>';
			     if(currentRow.amount > 0) {
			    	 tableHTML += '<td><input type="number" disabled="true" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
			    	 (currentRow.amount -  currentRow.usage).toFixed(2) +  '" /><label font-style="italic" class="unit-label"><i>' + currentRow.foodUnit + 
			    	 '</i></label></td>';
			     }	 else {
			    	 tableHTML += '<td><input type="number" step="1" min="0" maxlength="5" size="5" name="amount' + currentId +  '" id="amount' + currentId + '" data-mini="true" value="' + 
			    	 (currentRow.amount -  currentRow.usage).toFixed(2) +  '" /><label font-style="italic" class="unit-label"><i>' + currentRow.foodUnit + 
			    	 '</i></label></td>';
			     }
				
				 tableHTML += '<td>';
				 if( (currentRow.amount -  currentRow.usage).toFixed(2) > 0) {				
					 tableHTML += '<input type="number"  step="1" min="0" maxlength="5" size="5" data-mini="true" id="sliderUsage' + currentId + '"';
				 } else {
					 tableHTML += '<input type="number"  disabled="true" step="1" min="0" maxlength="5" size="5" data-mini="true" id="sliderUsage' + currentId + '"';				
				 }
				 tableHTML += ' value="0" /><label font-style="italic" class="per-label"><i>Indicate consumption</i></label></td>';
 				
				 tableHTML += '</tr>';
			    	 
		    	
			 } 	
		 }
     }
	 return tableHTML;
 }
 
 
 /**
  * update user food list page
  */
 function displayFoodInfo(tx, results) {
	 var len = results.rows.length;
	 
	 var myHTMLOutput = '';
	 //create the table for displaying : food-icon, amount, usage selection
	 if(len > 0) {
		 myHTMLOutput = '<table id="my-table" style="width:100%" border=1 frame=void rules=rows>';
		 myHTMLOutput += '<div class="scrollable" >';
			
		 //add table rows with the data retrieved from database to the available table list
		var tableRows = addUserFoodsToTable(results, 1);
		if(tableRows == '') {
			 myHTMLOutput = '<p></p><label  class="unit-label">You do not have any items.</label>';
		} else {
			  myHTMLOutput += tableRows;
			  myHTMLOutput += '</div></table>';
		} 
	    
	}    
    
	refreshUserFoodInfoHTML(myHTMLOutput);

    userFoodUsageData.splice(userFoodUsageData, userFoodUsageData.length);
	//set user data to memory 0: purchase ID , 1: total amount, 2: used amount, 3: wasted amount. 4: purchase date, 5: id of food, 6: status
	for (var i=0; i<len; i++){
		userFoodUsageData[i] = new Array(results.rows.item(i).id, results.rows.item(i).amount, results.rows.item(i).usage, 
				results.rows.item(i).waste, results.rows.item(i).date,  results.rows.item(i).foodID, results.rows.item(i).status,
				 results.rows.item(i).foodUnit);
	}
	
	createShoppingListTable(results);

	//set actions (usage slider information) (amount change actions)
	var rows = results.rows;
	for (var i=0; i<len; i++){
		setUserFoodTableActions(rows.item(i).id);
	}	
 }
 

 
 function createShoppingListTable(results) {
    //create the table for displaying shopping list
	 var myShoppingList = '<table id="shoppingListTable" style="width:100%"  border=1 frame=void rules=rows>';
	 myShoppingList += '<div class="scrollable" >';
		
	 //add table rows with the data retrieved from database to the available table list
	var shoppingRows = addUserFoodsToTable(results, 0);
	if(shoppingRows == '') {
		myShoppingList = '<p></p><label  class="unit-label">You do not have any items.</label>';
	} else {
		myShoppingList += shoppingRows;
		myShoppingList += '</div></table>';
	}
	
	changeShoppingListHTML(myShoppingList);

 }
 
 function queryBuyFromShoppingList(purchase, rowNumber, purchaseId) {
	 db.transaction( function(tx){ 
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET status = 1, date = "' + purchase[0].date + '" WHERE id = ' + purchaseId);
		 userFoodUsageData[rowNumber][4] =  purchase[0].date;
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
	for(var i=0, len = userFoodUsageData.length; i < len; i++) {
		if(userFoodUsageData[i][0] == id) {
			return (userFoodUsageData[i][1] - userFoodUsageData[i][2]);
		}
	}
	return 0;
}

function findPurchaseInfoById(id) {
	for(var i=0,  len = userFoodUsageData.length; i < len; i++) {
		if(userFoodUsageData[i][0] == id) {
			return i;
		}
	}
	return -1;
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
		 mainPageFoods[i] = new Array(results.rows.item(i).foodID, results.rows.item(i).foodIcon, 0);
	 }
	 addFoodsToMainPage();
    
	
	//fill search food filter list
	var html = '';
	for (var i=0; i<len; i++){
		html += '<li data-icon="plus" food-id="' + results.rows.item(i).foodID + '" food-icon="' + results.rows.item(i).foodIcon + '"><a data-option-id=\"' + 
		results.rows.item(i).foodID + '\">' + results.rows.item(i).foodName + '</a></li>';
	}
	
	//this html variable will be used within the filter event
	foodListSelectHtml = html;
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
 function queryUpdateFoodAmount(pId, foodAmount, rowNumber, data) {
	
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
		 userFoodUsageData[usageRowNumber][2] =  parseFloat(userFoodUsageData[usageRowNumber][2]) + parseFloat(data[0].amount);
		 tx.executeSql( 'UPDATE TABLEUSERFOOD SET usage = ' +  userFoodUsageData[usageRowNumber][2] +  ' WHERE id = ' + purchaseId);
		 var newVal =  data[0].amount;
		 var id =  data[0].id;
		 //returned id field is used?
		 tx.executeSql( 'INSERT INTO TABLEUSAGE (usageID, userfoodID, amount, people, relationship, usageDate) VALUES (' + id + ',' + 
				 purchaseId + ',' + newVal + ', 0, 0, "' + data[0].date + '" )' );
		
	 
	 }, errorCallbackSQLite );
	undoStack.push(new Array(UNDO_ADD_CONSUMPTION, usageRowNumber, data[0].amount, data[0].date));
	
 }
 
 /**
  * updates waste information in both tables TABLEUSERFOOD and TABLEWASTE
  * @param data
  * @param usageRowNumber
  */
 function queryUpdateFoodWaste(data, usageRowNumber, purchaseId) {
	 db.transaction( function(tx){ 
		 userFoodUsageData[usageRowNumber][3] =  parseFloat(userFoodUsageData[usageRowNumber][3]) + parseFloat(data[0].amount);
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
	 tx.executeSql('SELECT TABLEWASTE.wasteID, TABLEWASTE.userfoodID, TABLEWASTE.amount, TABLEWASTE.wasteType, TABLEWASTE.wasteDate, TABLEWASTE.wasteStatus, TABLEUSERFOOD.id, TABLEUSERFOOD.foodID, TABLEUSERFOOD.userID,  TABLEUSERFOOD.date, TABLEFOODS.foodID, TABLEFOODS.foodIcon, TABLEFOODS.foodUnit, TABLEWASTETYPE.wasteTypeID, TABLEWASTETYPE.data FROM TABLEWASTETYPE INNER JOIN TABLEWASTE ON TABLEWASTETYPE.wasteTypeID = TABLEWASTE.wasteType INNER JOIN TABLEUSERFOOD ON TABLEUSERFOOD.id = TABLEWASTE.userfoodID INNER JOIN TABLEFOODS ON TABLEFOODS.foodID = TABLEUSERFOOD.foodID WHERE TABLEUSERFOOD.userID = "' + currentUser + '"', 
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
		
		var myHTMLOutput = '';
		var isTableEmpty = 1;
		if(len > 0) {
			var myHTMLOutput = '<table id="waste-table" style="width:100%"  border=1 frame=void rules=rows>';
			myHTMLOutput += '<div class="scrollable">';
			var wasteIdd;
			var currentRow;
		    for (var i=0; i<len; i++){
		    	currentRow = results.rows.item(i);
		    	if(currentRow.wasteStatus == 0) {
		    		wasteIdd = currentRow.wasteID;
		    		isTableEmpty = 0;
			    	 myHTMLOutput += ' <tr data-value="unselected" id="wasteRow' + wasteIdd + '" style="padding-top: 0.5em !important;"><td><input type="image" src="' + currentRow.foodIcon + '" rel="' + currentRow.foodName +'" id="swipeWaste' + wasteIdd + '" width="50" height="50" ></td>';
			    	 myHTMLOutput += '<td><label  class="unit-label">' + currentRow.amount.toFixed(2) + "    " + currentRow.foodUnit + '</label></td>';
			    	 myHTMLOutput += '<td style="width:80px"><form><div data-role="fieldcontain"><select name="reason" id="' + wasteIdd + 'WasteType" data-theme="a" data-mini="true" data-icon="false"  data-iconpos="notext" data-corners="false"  class="select-class ui-icon-nodisc">'; 
			    	 myHTMLOutput += getReasonsHTML(currentRow.wasteType, wasteReasons);
			    	 myHTMLOutput += '</select></div></form></td>';
			    	 myHTMLOutput += '</tr>';

		    	}
		    }		     
		    myHTMLOutput += '</div></table>';
		}
    	 
		
		if(isTableEmpty == 1) {
			myHTMLOutput = '<p></p><label  class="unit-label">Your bin is empty.</label>';
		}
		//Update the DIV called Content Area with the HTML string
		document.getElementById("wasteList").innerHTML = myHTMLOutput;
		$('#wasteList').trigger("create");
	
	//set swipe actions
	//setSwipeActionsForWaste();
	
	//set waste reason selection actions
	for (var i=0; i<len; i++){
		setWasteReasonActions( results.rows.item(i).wasteID);
	}
 }
 
 
 function findWasteInfoById(id) {
	 for(var i=0,  len = userFoodWasteInfo.length; i < len; i++) {
		if(userFoodWasteInfo[i][0] == id) {
				return i;
		}
	}
	return -1;
 }
 

 
 
 
 /**
  * returns an option list representation of the given array. the option
  * which is equal to the selectedValue is set as selected
  */ 
 function getReasonsHTML(selectedValue, arrayP) {
	 var len = arrayP.length;
	 var reasonsSelectHTML = '';
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
	var len = results.rows.length;
	
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
	 if(wasteList.length == 0) {
		 db.transaction( function(tx){		 
			 tx.executeSql('DELETE FROM TABLEUSERFOOD WHERE id = ' + purchaseId);
		 }, errorCallbackSQLite);
	 }
	 else {
		 db.transaction( function(tx) {
			 tx.executeSql('UPDATE TABLEUSERFOOD SET status = 2 WHERE id = ' + purchaseId);
			 tx.executeSql('INSERT INTO TABLEWASTE (wasteID, userfoodID, amount, wasteType, wasteDate, wasteStatus, deletionDate) VALUES ( NULL ,' + 
					 purchaseId + ',' + wasteList[0].amount + ', ' + wasteList[0].type +', "' + wasteList[0].date + '", 0, NULL)' );
		 });
		 increaseWasteNumber();
		updateWasteBubbles();
	 }
	
	//loadUserList();

}	
 

function increaseWasteNumber() {
	 newWasteNumber += 1;
}

function queryDeleteWaste(rowNumber, wasteId) {
	 db.transaction( function(tx){
		//0: waste id, 1: reason, 2:foodId , 3:purchase date, 4: waste date
		 tx.executeSql('DELETE FROM TABLEUSERFOOD WHERE foodID = ' + userFoodWasteInfo[rowNumber][2] + ' AND date = "' + 
				 userFoodWasteInfo[rowNumber][3] + '" ' );
		 tx.executeSql('DELETE FROM TABLEWASTE WHERE wasteID = ' + wasteId);
	 }, errorCallbackSQLite);
	 /*loadUserWasteList();*/
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
	for(i=0, len = userFoodWasteInfo; i < len; i++) {
		if(userFoodUsageData[i][0] == pId) {
			amount = userFoodUsageData[i][1];
			break;
		}
	}
	var val = getNow();
	if(amount > 0) {
		wasteFoodOffline(pId, amount, rowNumber,  val);
		increaseWasteNumber();
		updateWasteBubbles();
	}
	
	db.transaction( function(tx){ 
		 tx.executeSql('UPDATE TABLEUSERFOOD SET status = ' + 2 +  ' WHERE id = ' + pId );
		 tx.executeSql('UPDATE TABLEUSERFOOD SET deletionDate = "' + val +  '" WHERE id = ' + pId );
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES (NULL, 7, 0, ' + pId + ')' );	 
	},
	errorCallbackSQLite);	
	//loadUserList();
	
}


/**
 * deletes waste offline
 * @param wasteId
 * @param rowNumber
 */
function deleteWasteOffline(rowNumber, wasteId) {
	var val = getNow();
	db.transaction( function(tx){ 
		 tx.executeSql('UPDATE TABLEWASTE SET wasteStatus = 1 WHERE wasteID = ' + wasteId);
		 tx.executeSql('UPDATE TABLEWASTE SET deletionDate = "' + val + '" WHERE wasteID = ' + wasteId);
		 tx.executeSql('INSERT INTO TABLEOFFLINEACTIONS (offlineID, actionNum, tableNum, tableId) VALUES (NULL, 8, 1, ' + wasteId + ')' );	 
	}, 
	errorCallbackSQLite);	
	/*loadUserWasteList();*/
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




function deleteConsumption(purchaseRow, amount, date) {
	var pID = userFoodUsageData[purchaseRow][0];
	db.transaction( function(tx){
		 tx.executeSql('DELETE FROM TABLEUSAGE WHERE userfoodID = '  + pID + 
				  ' AND ( amount - ' + amount + ' < 0.1)  AND usageDate = "' + date + '"');
		 tx.executeSql('UPDATE TABLEUSERFOOD SET usage = ' + (userFoodUsageData[purchaseRow][2] - amount) + ' WHERE id = ' + pID);
		 userFoodUsageData[purchaseRow][2] = userFoodUsageData[purchaseRow][2] - amount;
	}, errorCallbackSQLite);
	
	//loadUserList();
}















 