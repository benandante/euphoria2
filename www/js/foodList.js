function openHomePage() {
	$.mobile.changePage("#homePage");
	updateWasteBubbles();
}

function willBuyHandler(event) {
	addFoods(0);
}

function iHaveHandler(event) {
	addFoods(1);
}

function selectFoodByImage(id) {
	if (document.getElementById(id).value == "0") {
		//set image border white to shod selection
		document.getElementById(id).style.border = "2px solid white";
		document.getElementById(id).value = "1";

		//set selection value in the global array
		var leng = mainPageFoods.length;
		for (var i = 0; i < leng; i++) {
			if (mainPageFoods[i][0] == id) {
				mainPageFoods[i][2] = 1;
				break;
			}
		}
	} else {

		//set border gray to indicate deselection
		document.getElementById(id).style.border = "2px solid #7E7E7E";
		document.getElementById(id).value = "0";

		//set selection value in the global array
		var leng = mainPageFoods.length;
		for (var i = 0; i < leng; i++) {
			if (mainPageFoods[i][0] == id) {
				mainPageFoods[i][2] = 0;
				break;
			}
		}
	}

}

function onLoad() {
	initiateDatabase();
	sendUserAction(1, getNow(), "Application opened");
	getFoodList();
	loadUserList();
	loadUserWasteList();

	updateWasteBubbles();

	$("#searchFoodlist")
			.on(
					"listviewbeforefilter",
					function(e, data) {
						var $ul = $(this), $input = $(data.input), value = $input
								.val(), html = "";
						$ul.html("");
						if (value && value.length > 2) {
							$ul.html(foodListSelectHtml);
							$ul.listview("refresh");
						}
					});

	$('#searchFoodlist')
			.on(
					'click',
					'li',
					function() {
						//get selected food id and add it to the main page

						//if the item already exists on the maing page, highlight it
						var leng = mainPageFoods.length;
						alreadyExists = 0;
						for (var i = 0; i < leng; i++) {
							if (mainPageFoods[i][0] == $(this).attr('food-id')) {
								document.getElementById(mainPageFoods[i][0]).style.border = "2px solid white";
								document.getElementById(mainPageFoods[i][0]).value = "1";
								mainPageFoods[i][2] = 1;
								alreadyExists = 1;
								break;
							}
						}

						//if it is not in the main list, append it to the beginning of the main list
						if (alreadyExists == 0) {
							mainPageFoods.unshift(new Array($(this).attr(
									'food-id'), $(this).attr('food-icon')));
							mainPageFoods[0][2] = 1;
							addFoodsToMainPage();
							document.getElementById($(this).attr('food-id')).style.border = "2px solid white";
							document.getElementById($(this).attr('food-id')).value = "1";
						}

						//clear search button
						$('input[data-type="search"]').val('');
						$('input[data-type="search"]').trigger("keyup");
					});
}

function addFoodsToMainPage() {
	//add foods to the main page
	var imageFoodLen = mainPageFoods.length;

	// if (imageFoodLen > FOOD_NUMBER_ON_MAIN) imageFoodLen = FOOD_NUMBER_ON_MAIN;
	myHTMLOutput = '<div class="ui-grid-b" data-scroll="true" id="mainFoodList" style="height: 900px">';

	for (var i = 0; i < imageFoodLen;) {
		myHTMLOutput += '<div class="ui-block-a">';
		stl = "border:2px solid #7E7E7E;margin:2px;max-width:91%;";
		if (mainPageFoods[i][2] == 1) {
			stl = "border:2px solid white;margin:2px;max-width:91%;";
		}
		myHTMLOutput += '<input type="image" style="' + stl + '" src="'
				+ mainPageFoods[i][1] + '" id="' + mainPageFoods[i][0]
				+ '" value="' + mainPageFoods[i][2] + '" >'
		myHTMLOutput += '</div>';

		i++;
		if (i < imageFoodLen) {
			stl = "border:2px solid #7E7E7E;margin:2px;max-width:91%;";
			if (mainPageFoods[i][2] == 1) {
				stl = "border:2px solid white;margin:2px;max-width:91%;";
			}
			myHTMLOutput += '<div class="ui-block-b">';
			myHTMLOutput += '<input type="image"  style="' + stl + '" src="'
					+ mainPageFoods[i][1] + '" id="' + mainPageFoods[i][0]
					+ '"  value="' + mainPageFoods[i][2] + '" >'
			myHTMLOutput += '</div>';
		}

		i++;
		if (i < imageFoodLen) {
			stl = "border:2px solid #7E7E7E;margin:2px;max-width:91%;";
			if (mainPageFoods[i][2] == 1) {
				stl = "border:2px solid white;margin:2px;max-width:91%;";
			}
			myHTMLOutput += '<div class="ui-block-c">';
			myHTMLOutput += '<input type="image" style="' + stl + '" src="'
					+ mainPageFoods[i][1] + '" id="' + mainPageFoods[i][0]
					+ '" value="' + mainPageFoods[i][2] + '" >'
			myHTMLOutput += '</div>';
		}
		i++;
	}
	myHTMLOutput += '</div>';

	//Update the DIV called Content Area with the HTML string
	document.getElementById("ContentFoodArea").innerHTML = myHTMLOutput;

	for (var i = 0; i < imageFoodLen; i++) {
		$("#" + mainPageFoods[i][0]).bind("tap", mainPageFoodHandler);
	}

}

function mainPageFoodHandler(event) {
	selectFoodByImage(parseInt(event.currentTarget.id));
}

function addFoods(status) {
	var div = document.getElementById("mainFoodList");
	var i;
	var idVal;
	if (div != null) {
		for (i = 0; i < div.childNodes.length; i++) {
			idVal = div.childNodes[i].childNodes[0].id;
			val = "#" + idVal;
			//if image is selected, add them to user list
			if ($(val).val() == 1) {
				document.getElementById(idVal).style.border = "2px solid #7E7E7E";
				document.getElementById(idVal).value = "0";
				buyNewFood(idVal, 0, status);
			}
		}
		//set selection value in the global array
		leng = mainPageFoods.length;
		for (i = 0; i < leng; i++) {
			mainPageFoods[i][2] = 0;
		}

	}

	//$.mobile.changePage("foodUsage.html", "slide", true, true);
}

function getSelectValues(select) {
	var result = [];
	var options = select && select.options;
	var opt;

	for (var i = 0, iLen = options.length; i < iLen; i++) {
		opt = options[i];

		if (opt.selected) {
			result.push(opt.value);
		}
	}
	return result;
}

function getFoodList() {
	$
			.ajax({
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
					console
							.log(e
									+ ' :Server connection failed while retrieveing food list!');
				}
			});
	return false;
}

function getUserFoodList() {
	$
			.ajax({
				type : "GET",
				url : sessionStorage.getItem("serverDomain")
						+ "/userPurchaseList?",
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
					console
							.log(e
									+ ' :Server connection failed while retrieving user food list!');
				}
			});
	return false;
}

function buyNewFood(purchaseId, amount, statusValue) {
	$
			.ajax({
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
					console
							.log("Purchase information has been sent to the server successfully");
					loadUserList();

				},
				error : function(e) {
					console
							.log(e
									+ ' :Purchase information could not be sent! It will be stored locally');
					buyFoodOffline(purchaseId, new Date()
							.format("mm/dd/yyyy hh:mm:ss"), amount, statusValue);
					loadUserList();
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
	$
			.ajax({
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
					console
							.log("Waste information has been retrieved from the server successfully");
				},
				error : function(e) {
					console
							.log(e
									+ ' : Waste information could not be retrieved from the server!');
				}
			});
	return false;
}

function getSurveyDataFromServer() {
	$
			.ajax({
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
					console
							.log(e
									+ ' : Survey data could not be retrieved from the server!');
				}
			});
	return false;
}