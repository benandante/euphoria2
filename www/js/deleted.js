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