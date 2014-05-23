var toBeDeletedWaste = 0;

function openWastePage() {
	$.mobile.changePage("#wastePage");

	newWasteNumber = 0;
	loadUserWasteList();
	updateWasteBubbles();
}


/*
 * saves the reasons of food usage and updates tables
 */
function saveWasteReasonsToServer() {

	onConfirmSaveWasteChanges(1);
}

function onConfirmSaveWasteChanges(button) {
	if (button == 1) {
		for (var i = 0; i < userFoodWasteInfo.length; i++) {
			var id = userFoodWasteInfo[i][0];
			var nameValue = "#" + id + "WasteType";
			var vall = $(nameValue).val();
			if (vall != userFoodWasteInfo[i][1]) {
				sendWasteUpdate(vall, i);
			}
		}
		newWasteNumber = 0;
		//set waste events for bubble count
		updateWasteBubbles();
		navigator.notification.alert("Changes are saved");
	}

}
function sendWasteUpdate(vall, i) {
	$
			.ajax({
				type : "GET",
				url : sessionStorage.getItem("serverDomain")
						+ "/updateWasteInformation?",
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
					foodId : userFoodWasteInfo[i][2],
					type : vall,
					purchaseDate : userFoodWasteInfo[i][3],
					wasteDate : userFoodWasteInfo[i][4]
				},
				success : function(data) {
					updateFoodWasteReasons(data.members.wasteList, i);
					console
							.log('Waste update has been sent to the server successfully!');
				},
				error : function(e) {
					updateFoodWasteReasonsOffline(vall, i);
					console
							.log(e
									+ ' : Waste update could not be sent to the server!');

				}
			});
	return false;
}

function sendWasteDeletion(fId, dateOfPurchase, wasteId, rowNumber) {
	$
			.ajax({
				type : "GET",
				url : sessionStorage.getItem("serverDomain") + "/deleteWaste?",
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
					foodId : fId,
					date : dateOfPurchase
				},
				success : function(data) {
					queryDeleteWaste(rowNumber, wasteId);
					console
							.log('Waste deletion has been sent to the server successfully!');
					toBeDeletedWaste--;
					if (toBeDeletedWaste == 0) {
						loadUserWasteList();
					}
				},
				error : function(e) {
					console
							.log(e
									+ ' : Waste deletion could not be sent to the server!');
					deleteWasteOffline(rowNumber, wasteId);
					toBeDeletedWaste--;
					if (toBeDeletedWaste == 0) {
						loadUserWasteList();
					}
				}
			});
	return false;
}

function deleteWasteItem(id) {
	var wasteRow = findWasteInfoById(id);
	if (wasteRow != -1) {
		sendWasteDeletion(userFoodWasteInfo[wasteRow][2],
				userFoodWasteInfo[wasteRow][3], id, wasteRow);
	}
}

function setWasteReasonActions(currentId) {
	$('#' + currentId + 'WasteType').change(
			function(event) {
				var vall = $(this).val();
				var id = event.target.id.replace("WasteType", "");
				var wasteRow = -1;
				for (j = 0; j < userFoodWasteInfo.length; j++) {
					if (userFoodWasteInfo[j][0] == id) {
						wasteRow = j;
						break;
					}
				}
				if (vall != userFoodWasteInfo[wasteRow][1]) {
					sendWasteUpdate(vall, wasteRow);
					undoWasteStack.push(new Array(
							userFoodWasteInfo[wasteRow][0],
							userFoodWasteInfo[wasteRow][1])); //id and old amount
				}
			});
	$("#wasteRow" + currentId).bind("touchstart", highlightWasteTapEvent);
}

function highlightWasteTapEvent(event) {
	id = parseInt(event.currentTarget.id.replace("wasteRow", ""));
	highlightWasteRow(id);
}

function highlightWasteRow(currentId) {
	if (document.getElementById("wasteRow" + currentId).dataset.value == "unselected") {
		document.getElementById("wasteRow" + currentId).style.backgroundColor = '#6688BF';
		document.getElementById("wasteRow" + currentId).style.opacity = '0.5';
		document.getElementById("swipeWaste" + currentId).border = "0";
		document.getElementById("wasteRow" + currentId).dataset.value = "selected";
		toBeDeletedWaste++;
	} else {
		document.getElementById("wasteRow" + currentId).style.backgroundColor = '#2E2E2E';
		document.getElementById("wasteRow" + currentId).dataset.value = "unselected";
		document.getElementById("wasteRow" + currentId).style.opacity = '1';
		document.getElementById("swipeWaste" + currentId).border = "0";
		toBeDeletedWaste--;
	}
	if (toBeDeletedWaste == 0) {
		$('#deleteSelectedWaste').addClass('ui-disabled');
	} else {
		$('#deleteSelectedWaste').removeClass('ui-disabled');
	}
	$('#wasteRow' + currentId).trigger('refresh');
	$('#swipeWaste' + currentId).trigger('refresh');

}

function deleteSelectedData() {
	wasteTable = document.getElementById("waste-table");
	if (wasteTable != null) {
		rows = wasteTable.getElementsByTagName('tr');
		for (i = 0; i < rows.length; i++) {
			if (rows[i].dataset.value == "selected") {
				idOfItem = rows[i].id.replace("wasteRow", "");
				deleteWasteItem(idOfItem);
			}
		}
	}
}