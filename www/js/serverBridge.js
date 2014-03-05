function sendLoginData() {
		 var form = $("#loginForm");    
		  var u = $("#username", form).val();
		  var p = $("#password", form).val();
		 $.ajax({
		        type       : "GET",
		        url        :  sessionStorage.getItem("serverDomain") + "/login?",
		        crossDomain: false,
		        beforeSend : function() {$.mobile.loading('show')},
		        complete   : function() {$.mobile.loading('hide')},
		        data       : {username : u, password : p},
		        dataType   : 'json',
		        success    : function(data) {		        	
		        	sessionStorage.setItem("usertoken", data.members.token);
		        	sessionStorage.setItem("currentUser", u);
		        	$.mobile.changePage("#newHome", "slide", true, true);
		        	//window.location.replace('foodList.html');
		        	console.log("login success!");
		        
		        },
		        error      : function(e) {
		        	// phonegap alerts
		           navigator.notification.alert("Please specify a valid username and password");
		           console.log("login failure!"); 
		        }
		    });    
		 return false;
	}
	
function selectFoodByImage(id) {
	if (document.getElementById(id).value == "0") {
		document.getElementById(id).style.border = "3px solid white";
		document.getElementById(id).value = "1";
	} else {
		document.getElementById(id).style.border = "0";
		document.getElementById(id).value = "0";
	}

}

function loadAppData() {		
	initiateDatabase();
	getFoodList();		
	getUserFoodList();		
	getWasteInformation();
	getSurveyDataFromServer();
	
	
	$( "#searchFoodlist" ).on( "listviewbeforefilter", function ( e, data ) {
		var $ul = $( this ),
		$input = $( data.input ),
		value = $input.val(),
		html = "";
		$ul.html( "" );
		if ( value && value.length > 2 ) {
			$ul.html(foodListSelectHtml);
			$ul.listview( "refresh" );	
		}
	});

	$('#searchFoodlist').on('click', 'li', function() {	        
		//get selected food id and add it to the main page
	    mainPageFoods.unshift(new Array( $(this).attr('food-id'), $(this).attr('food-icon') ));
        addFoodsToMainPage();
        //clear search button
		$('input[data-type="search"]').val('');
		$('input[data-type="search"]').trigger("keyup");
    });
}


function updateOfflineData(results) {
	alert(results.rows.length);
}

function addFoods(status) {
	var div = document.getElementById("mainFoodList");
	var i;
	var idVal;
	for (i = 0; i < div.childNodes.length; i++) {
		idVal = div.childNodes[i].childNodes[0].id;
		val = "#" + idVal;
		//if image is selected, add them to user list
		if ($(val).val() == 1) {
			buyNewFood(idVal, 0, status);
		}
	}
	/* var el = $('#selectFoods')[0];
	selectedValues = getSelectValues(el);
	length = selectedValues.length;
	for (i = 0; i < length; i++) {
		buyNewFood(selectedValues[i], 0);
	} */

	//TODO do this for combobox items
	$.mobile.changePage("foodUsage.html", "slide", true, true);
}

function getSelectValues(select) {
	var result = [];
	var options = select && select.options;
	var opt;

	for ( var i = 0, iLen = options.length; i < iLen; i++) {
		opt = options[i];

		if (opt.selected) {
			result.push(opt.value);
		}
	}
	return result;
}

function getFoodList() {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/foodList?",
		crossDomain : false,
		beforeSend : function() {
			$.mobile.loading('show')
		},
		complete : function() {
			$.mobile.loading('hide')
		},
		dataType : 'json',
		data : {
			token : sessionStorage.getItem("usertoken")
		},
		success : function(data) {
			currentUser = sessionStorage.getItem("currentUser");
			initializeCurrentUser(currentUser);
			addFoodsToDatabase(data.members.foods);
			console.log("Food list retrieved successfully");
		},
		error : function(e) {
			console.log(e + ' :Server connection failed while retrieveing food list!');
		}
	});
	return false;
}

function getUserFoodList() {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/userPurchaseList?",
		crossDomain : false,
		beforeSend : function() {
			$.mobile.loading('show')
		},
		complete : function() {
			$.mobile.loading('hide')
		},
		dataType : 'json',
		data : {
			token : sessionStorage.getItem("usertoken")
		},
		success : function(data) {				
			updateUserFoodListToDatabase(data.members.userList);
			console.log("User food list retrieved successfully");
		},
		error : function(e) {
			console.log(e + ' :Server connection failed while retrieving user food list!');
		}
	});
	return false;
}

function buyNewFood(purchaseId, amount, statusValue) {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/buyFood?",
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
			foodId : purchaseId,
			quantity : amount,
			status : statusValue
		},
		success : function(data) {
			addUserFoodInLoop(data.members.userList, 0); //O = index
			console.log("Purchase information has been sent to the server successfully");
		},
		error : function(e) {
			console.log(e + ' :Purchase information could not be sent! It will be stored locally');
			buyFoodOffline(purchaseId, new Date()
					.format("mm/dd/yyyy hh:mm:ss"), amount, statusValue);
		}
	});
	return false;
}

function getUsageInformation() {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/usageList?",
		crossDomain : false,
		beforeSend : function() {
			$.mobile.loading('show')
		},
		complete : function() {
			$.mobile.loading('hide')
		},
		dataType : 'json',
		data : {
			token : sessionStorage.getItem("usertoken")
		},
		success : function(data) {
			updateUserUsageListToDatabase(data.members.usageList);
			
		},
		error : function(e) {
			console.log(e + ' :Server connection failed!');
		}
	});
	return false;
}

function getWasteInformation() {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/wasteList?",
		crossDomain : false,
		beforeSend : function() {
			$.mobile.loading('show')
		},
		complete : function() {
			$.mobile.loading('hide')
		},
		dataType : 'json',
		data : {
			token : sessionStorage.getItem("usertoken")
		},
		success : function(data) {
			updateUserWasteListToDatabase(data.members.wasteList);
			console.log("Waste information has been retrieved from the server successfully");
		},
		error : function(e) {
			console.log(e + ' : Waste information could not be retrieved from the server!');
		}
	});
	return false;
}

function getSurveyDataFromServer() {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/surveyData?",
		crossDomain : false,
		beforeSend : function() {
			$.mobile.loading('show')
		},
		complete : function() {
			$.mobile.loading('hide')
		},
		dataType : 'json',
		data : {
			token : sessionStorage.getItem("usertoken")
		},
		success : function(data) {
			updateSurveyListToDatabase(data.members.surveyData);
		},
		error : function(e) {
			console.log(e + ' : Survey data could not be retrieved from the server!');
		}
	});
	return false;
}