function changeUserFoodInfoHTML(userFoodInfoHTML) {
				//Update the DIV called Content Area with the HTML string	
				$(userFoodInfoHTML).appendTo(document.getElementById("userFoodInfo"));
				//refresh divison
				$('#userFoodInfo').trigger("create");
			}
			
			function refreshUserFoodInfoHTML(userFoodInfoHTML) {
				 
				//refresh divison
				$('#userFoodInfo').empty();
				
				//Update the DIV called Content Area with the HTML string
				document.getElementById("userFoodInfo").innerHTML = userFoodInfoHTML;
				
				$('#userFoodInfo').trigger("create");
				
			}
			
			
			
			
			function changeShoppingListHTML(newList) {
				//Update the DIV called Content Area with the HTML string
				document.getElementById("userShoppingList").innerHTML = newList;
				 
				//refresh divison
				$('#userShoppingList').trigger("create");
			}
			
			function refreshShoppingListHTML(newList) {
				//Update the DIV called Content Area with the HTML string
				document.getElementById("userShoppingList").innerHTML = newList;
				 
				//refresh divison
				$('#userShoppingList').trigger("refresh");
			}
			
				function getSliderAmount(rowNumber, nameOfSlider) {
					return userFoodUsageData[rowNumber][1] * $(nameOfSlider).val() / 100;
				}
				
				function sendUpdateAmount(id, d, value, purchaseId, rowNumber) {
					 $.ajax({
					        type       : "GET",
					        url        : sessionStorage.getItem("serverDomain") + "/updateFoodAmount?",
					        crossDomain: false,
					        beforeSend : function() {$.mobile.loading('show')},
					        complete   : function() {$.mobile.loading('hide')},
					        dataType   : 'json',
					        data       : {token : sessionStorage.getItem("usertoken"), foodId: id, date: d, quantity : value},
					        success    : function(data) {
					        	queryUpdateFoodAmount(purchaseId, value, rowNumber, data);
					        	undoStack.push( new Array(UNDO_UPDATE_USAGE_AMOUNT, purchaseId, rowNumber, data.foodID, data.date, userFoodUsageData[rowNumber][1]));
					        	console.log('Changes have been sent to the server successfully!');
					        },
					        error      : function(e) {
					        	console.log(e + ' : Changes could not be sent to the server!');
					            updateFoodAmountOffline(purchaseId, value, rowNumber);                
					        }
					    }); 
					 $('#undo').removeClass('ui-disabled');
					 return false;
				}
				
				function sendWaste(id, d, purchaseId, value, rowNumber) {
					 $.ajax({
					        type       : "GET",
					        url        : sessionStorage.getItem("serverDomain") + "/wasteFood?",
					        crossDomain: false,
					        beforeSend : function() {$.mobile.loading('show')},
					        complete   : function() {$.mobile.loading('hide')},
					        dataType   : 'json',
					        data       : {token : sessionStorage.getItem("usertoken"), foodId: id, quantity : value, date: d},
					        success    : function(data) {
					        	queryUpdateFoodWaste(data.members.wasteList, rowNumber, purchaseId);	
					        	console.log('Waste have been sent to the server successfully!');
					        },
					        error      : function(e) {
					        	console.log(e + ' : Waste changes could not be sent to the server!');
					            wasteFoodOffline(purchaseId, value, rowNumber,  new Date().format("mm/dd/yyyy hh:mm:ss"))  ;           
					        }
					    });    
					 return false;
				}
				
				function sendUsage(id, d, purchaseId, value, rowNumber) {
					 $.ajax({
					        type       : "GET",
					        url        : sessionStorage.getItem("serverDomain") + "/consumeFood?",
					        crossDomain: false,
					        beforeSend : function() {$.mobile.loading('show')},
					        complete   : function() {$.mobile.loading('hide')},
					        dataType   : 'json',
					        data       : {token : sessionStorage.getItem("usertoken"), foodId: id, quantity : value, date: d},
					        success    : function(data) {
					        	queryUpdateFoodUsage(data.members.usageList, rowNumber, purchaseId);
					        	
					        	console.log('Usage have been sent to the server successfully!');
					        },
					        error      : function(e) {
					            console.error(e + ' : Usage changes could not be sent to the server!');
					            consumeFoodOffline(purchaseId, value, rowNumber,  new Date().format("mm/dd/yyyy hh:mm:ss"))  ;          
					        }
					    });    
					 $('#undo').removeClass('ui-disabled');
					 return false;
				}
				
				function sendDeletion(fId, dateOfPurchase, purchaseId, rowNumber) {
					
					 $.ajax({
					        type       : "GET",
					        url        : sessionStorage.getItem("serverDomain") + "/deletePurchase?",
					        crossDomain: false,
					        beforeSend : function() {$.mobile.loading('show')},
					        complete   : function() {$.mobile.loading('hide')},
					        dataType   : 'json',
					        data       : {token : sessionStorage.getItem("usertoken"), foodId: fId, date: dateOfPurchase},
					        success    : function(data) {
					        	queryDeleteData(data.members.wasteList, rowNumber, purchaseId);	
					        	console.log('Deletion has been sent to the server successfully!');
					        	 toBeDeleted--;
					        	 if(toBeDeleted == 0) {
					        		 var popupLen = toBeDeletedArray.length;
					        		 for(var j=0; j < popupLen; j++) {
					        			 var deleteMe = toBeDeletedArray.pop();
					        			 document.getElementById("my-table").deleteRow(deleteMe);
					        		 }
					        		 popupLen = toBeDelFromShopping.length;
					        		 for(var j=0; j < popupLen; j++) {
					        			 var deleteMe = toBeDelFromShopping.pop();
					        			 document.getElementById("shoppingListTable").deleteRow(deleteMe); 
					        		 }
					        		 
					        	 }
					        	 
					        },
					        error      : function(e) {
					           console.error(e + 'Deletion could not be sent to the server!');					             
					           deletePurchaseDataOffline(purchaseId, rowNumber);
					           toBeDeleted--; 
					           if(toBeDeleted == 0) {
					        	   var popupLen = toBeDeletedArray.length;
					        		 for(var j=0; j < popupLen; j++) {
					        			 var deleteMe = toBeDeletedArray.pop();
					        			 document.getElementById("my-table").deleteRow(deleteMe);
					        		 }
					        		 popupLen = toBeDelFromShopping.length;
					        		 for(var j=0; j < popupLen; j++) {
					        			 var deleteMe = toBeDelFromShopping.pop();
					        			 document.getElementById("shoppingListTable").deleteRow(deleteMe); 
					        		 }
					        		 
					        	 }
					        }
					    });
					
					 return false;
				}
				
	
				function deleteUserFoodItem(id) {					
					var purchaseRow = findPurchaseInfoById(id);
					if(purchaseRow != -1) {
						sendDeletion(userFoodUsageData[purchaseRow][5], userFoodUsageData[purchaseRow][4], id, purchaseRow);
						
					}						 
				}
				
				 function buyItemFromShoppingList(id) {
					 var purchaseRow = findPurchaseInfoById(id);
					 $.ajax({
					        type       : "GET",
					        url        : sessionStorage.getItem("serverDomain") + "/buyFromShoppingList?",
					        crossDomain: false,
					        beforeSend : function() {$.mobile.loading('show')},
					        complete   : function() {$.mobile.loading('hide')},
					        dataType   : 'json',
					        data       : {token : sessionStorage.getItem("usertoken"), foodId: userFoodUsageData[purchaseRow][5], date: userFoodUsageData[purchaseRow][4]},
					        success    : function(data) {
					        	queryBuyFromShoppingList(data.members.purchase, purchaseRow, id);	
					        	console.log('Item from shopping to available list sent to the server!');
					        	addRowToAvTable(data.members.purchase[0].id);
					        	//loadUserList();
					        },
					        error      : function(e) {
					            console.error(e + 'Item could not be sent to the server!');					             
					            buyFromShoppingListOffline(purchaseRow, id);
					           // loadUserList();
					        }
					    }); 
					 
					 return false;
					 
				 }
				 
				 function addRowToAvTable(rowID) {

					 var table = document.getElementById("shoppingListTable");
					 var newHTML = '';
				
					 var rowCount = table.rows.length;
				        for (var i = 0; i < rowCount; i++) {
				            var row = table.rows[i];
						
				            if (row.id == (("row") + rowID )) {
				            	var cells = row.cells;
				            	row.deleteCell(2);
				            	row.deleteCell(1);
				            	row.insertCell(-1);
				            	row.insertCell(-1);
				           		var purchaseField = findPurchaseInfoById(rowID);
				           		
				           		var tableHTML;
				           		
				           		if(parseFloat(userFoodUsageData[purchaseField][1]).toFixed(2) > 0) {
				           			tableHTML = '<td><input type="number" disabled="true" step="1" min="0" maxlength="5" size="5" name="amount' + rowID +  '" id="amount' + rowID + '" data-mini="true" value="' + 
					           		parseFloat(userFoodUsageData[purchaseField][1]).toFixed(2)  +  '" /><label font-style="italic" class="unit-label"><i>' + userFoodUsageData[purchaseField][7]  + 
							    	 '</i></label></td>';				           
				           		} else {
				           			tableHTML = '<td><input type="number" step="1" min="0" maxlength="5" size="5" name="amount' + rowID +  '" id="amount' + rowID + '" data-mini="true" value="' + 
					           		parseFloat(userFoodUsageData[purchaseField][1]).toFixed(2)  +  '" /><label font-style="italic" class="unit-label"><i>' + userFoodUsageData[purchaseField][7]  + 
							    	 '</i></label></td>';	
				           		}
				           			
						    	row.cells[1].outerHTML = tableHTML;
						    	
						    	 tableHTML = '<td>';
								 if( parseFloat(userFoodUsageData[purchaseField][1]).toFixed(2)  > 0) {				
									 tableHTML += '<input type="number"  step="1" min="0" maxlength="5" size="5" data-mini="true" id="sliderUsage' + rowID + '"';
								 } else {
									 tableHTML += '<input type="number"  disabled="true" step="1" min="0" maxlength="5" size="5" data-mini="true" id="sliderUsage' + rowID + '"';				
								 }
								 tableHTML += ' value="0" /><label font-style="italic" class="per-label"><i>Indicate consumption</i></label></td>';
				 				
								row.cells[2].outerHTML = tableHTML;
						
								
				            	newHTML = row.outerHTML;
				            	table.deleteRow(i);
				            	break;
				            }
				        }
					
					    
					 $('#userShoppingList').trigger("refresh");
				     
				     var avTable = document.getElementById("my-table");
				     if(avTable != null) {
				    	 avTable.insertRow(-1);
					     avTable.rows[avTable.rows.length - 1].outerHTML = newHTML;
					 	 $('#my-table').trigger("create"); 
				     } else {
				    	 loadUserList();
				    	
				     }
				    
				 
					 $('#userFoodInfo').trigger("refresh"); 

					 setUserFoodTableActions(rowID);
				 }
				 
				 
				function undoChanges() {
					if(undoStack.length > 0) {
						var lastValue = undoStack.pop();	
						
						if(lastValue[0] == UNDO_UPDATE_USAGE_AMOUNT) {						
							 var purchaseRow = lastValue[2];
							 $.ajax({
							        type       : "GET",
							        url        : sessionStorage.getItem("serverDomain") + "/undoFoodAmount?",
							        crossDomain: false,
							        beforeSend : function() {$.mobile.loading('show')},
							        complete   : function() {$.mobile.loading('hide')},
							        dataType   : 'json',
							        data       : {
							        	token : sessionStorage.getItem("usertoken"), 
							        	foodId: userFoodUsageData[purchaseRow][5], 
							        	date: userFoodUsageData[purchaseRow][4],
							        	amount: lastValue[5]},
							        success    : function(data) {						        	 
							        	queryUpdateFoodAmount(lastValue[1], lastValue[5], lastValue[2], data);
							        	console.log('Changes have been sent to the server successfully!');
							        	$('#amount' + lastValue[1]).val(lastValue[5]);
							        	$('#amount' + lastValue[1]).trigger("change");
							        	if(lastValue[5] > 0) {
							        		$('#sliderUsage' + lastValue[1]).textinput('enable');
							        	} else {
							        		$('#sliderUsage' + lastValue[1]).textinput('disable');
							        	}
							        },
							        error      : function(e) {						        	
							        	undoStack.push(lastValue);
							        }
							    }); 
							 
						} else if (lastValue[0] == UNDO_ADD_CONSUMPTION) {						
							 var purchaseRow = lastValue[1];
							 $.ajax({
							        type       : "GET",
							        url        : sessionStorage.getItem("serverDomain") + "/deleteConsumption?",
							        crossDomain: false,
							        beforeSend : function() {$.mobile.loading('show')},
							        complete   : function() {$.mobile.loading('hide')},
							        dataType   : 'json',
							        data       : {
							        	token : sessionStorage.getItem("usertoken"), 
							        	foodId: userFoodUsageData[purchaseRow][5], 
							        	date: userFoodUsageData[purchaseRow][4],
							        	amount: lastValue[2], 
							        	consDate: lastValue[3]},
							        success    : function(data) {
							        	deleteConsumption(lastValue[1], lastValue[2], lastValue[3]);
							        	var lval = $('#amount' + userFoodUsageData[purchaseRow][0]).val();
							        	$('#amount' + userFoodUsageData[purchaseRow][0]).val(parseFloat(lval) + parseFloat(lastValue[2]));
							        	$('#amount' + userFoodUsageData[purchaseRow][0]).trigger("change");
							        },
							        error      : function(e) {
							        	undoStack.push(lastValue);
							        }
							    }); 
						} 
						if(undoStack.length == 0) {
							 $('#undo').addClass('ui-disabled');
						}
					}
					}
					
				
				function setSlidersToZero() {
					//set slider values to 0
					for (var i=0; i < userFoodUsageData.length; i++) {
						var nameValue = '#sliderUsage' + userFoodUsageData[i][0];
						$(nameValue).val(0);
						$(nameValue).trigger("change");
					}
				}
			
				function setUserFoodTableActions(currentId) {
					$('#amount' + currentId).focusout( function(event, ui) {
							var id = event.target.id.replace("amount","");
							var row = findPurchaseInfoById(id);
							if($(this).val() > 0) {
								//check if the item is new or already consumed 
								if(userFoodUsageData[row][2] > 0 && userFoodUsageData[row][6] == 1) { //status == bought
									//this item has been purchased before and all of it is consumed
									//add new purchase
									buyNewFood(userFoodUsageData[row][5], $(this).val(), 1);
									//delete previous purchase
									sendDeletion(userFoodUsageData[row][5], userFoodUsageData[row][4], id, row);
								} else {
									sendUpdateAmount(userFoodUsageData[row][5], userFoodUsageData[row][4],  $(this).val(), 
											userFoodUsageData[row][0], row);
								}							
								$('#sliderUsage' + id).textinput('enable');
								$(this).textinput('disable');
							} else {
								$('#sliderUsage' + id).textinput('disable');
								$(this).textinput('enable');
							}
						});
					
					$('#amount' + currentId).change( function(event, ui) {
						var id = event.target.id.replace("amount","");
						var row = findPurchaseInfoById(id);
						if($(this).val() > 0) {										
							$('#sliderUsage' + id).textinput('enable');
							$(this).textinput('disable');
						} else {
							$('#sliderUsage' + id).textinput('disable');
							$(this).textinput('enable');
						}
					});
					//$('#amount' + currentId).trigger("create");
					/*$('#amount' + currentId).focusout(function() {
						var id = event.target.id.replace("amount","");
						var row = findPurchaseInfoById(id);
						sendUpdateAmount(userFoodUsageData[row][5], userFoodUsageData[row][4],  $(this).val(), userFoodUsageData[row][0], row);
						if($(this).val() > 0) {
							$('#sliderUsage' + id).textinput('enable');
							$(this).textinput('disable');
						} else {
							$('#sliderUsage' + id).textinput('disable');
							$(this).textinput('enable');
						}
					});*/
					//$('#sliderUsage' + currentId).trigger("create");
					$('#sliderUsage' + currentId).focusout(function() {
						var id = event.target.id.replace("sliderUsage","");
						var row = findPurchaseInfoById(id);
						var sliderAmount =  parseFloat($(this).val());
						var totalAmount = parseFloat($('#amount' + id).val());
						if(sliderAmount > 0) {
							if(sliderAmount > totalAmount) {
								$(this).val(totalAmount);
								sliderAmount = parseFloat($(this).val());
							}
							sendUsage(userFoodUsageData[row][5], userFoodUsageData[row][4], userFoodUsageData[row][0], sliderAmount, row);
							var amountVal =  event.target.id.replace("sliderUsage","amount");
							$('#' + amountVal).val((parseFloat($('#' + amountVal).val()) - sliderAmount).toFixed(2));
						}	
					});
					
					$("#row" + currentId).bind("tap", highlightTapEvent);
				}
				
				function highlightTapEvent(event) {
					id = parseInt(event.currentTarget.id.replace("row", ""));
					highlightRow(id);
					
				}
				
				function highlightRow(currentId) {
					console.log(currentId);
					if(document.getElementById("row" + currentId).dataset.value == "unselected") {
						document.getElementById("row" + currentId).style.backgroundColor = '#6688BF';	
						document.getElementById("row" + currentId).style.opacity = '0.5';	
						document.getElementById("swipeImage" + currentId).border = "0";
						document.getElementById("row" + currentId).dataset.value = "selected";
						toBeDeleted++;
						
					} else {
						document.getElementById("row" + currentId).style.backgroundColor = '#2E2E2E';
						document.getElementById("row" + currentId).dataset.value = "unselected";
						document.getElementById("row" + currentId).style.opacity = '1';	
						document.getElementById("swipeImage" + currentId).border = "0";
						toBeDeleted--;
					}	
					if(toBeDeleted == 0) {
						 $('#deleteSelected').addClass('ui-disabled');
					} else {
						 $('#deleteSelected').removeClass('ui-disabled');
					}
					$('#row' + currentId).trigger('refresh');
					$('#swipeImage' + currentId).trigger('refresh');

				}
				
				function deleteSelectedItems() {
					 var shTable = document.getElementById("shoppingListTable");
					 if(shTable != null) {
						 var rows = shTable.getElementsByTagName('tr');
						 for(var i=0; i < rows.length; i++) {
							 if(rows[i].dataset.value == "selected") {								 
								 toBeDelFromShopping.push(i);
							 }
						 }
						 for(var i=0; i < rows.length; i++) {
							 if(rows[i].dataset.value == "selected") {
								 idOfItem = rows[i].id.replace("row", "");							 
								 deleteUserFoodItem(idOfItem);
							 }
						 }
					 }
					
					 var avTable = document.getElementById("my-table");
					 if(avTable != null) {
						 var rows = avTable.getElementsByTagName('tr');
						 for(var i=0; i < rows.length; i++) {
							 if(rows[i].dataset.value == "selected") {
								 toBeDeletedArray.push(i);
							 }
						 }
						 for(var i=0; i < rows.length; i++) {
							 if(rows[i].dataset.value == "selected") {
								 idOfItem = rows[i].id.replace("row", "");							 
								 deleteUserFoodItem(idOfItem);	
							 }
						 }
					 }
					
				}		
				
				

				/**
				 * updates bubbles that display new waste values
				 */
				function updateWasteBubbles() {
		
					if(newWasteNumber > 0) {
						for (var j=1; j<=2; j++) {
							$("#wasteReason" + j + " .ui-btn-text").text("My Bin (" + newWasteNumber + ")");
							$("#wasteReason" + j + " .ui-btn-text").parent().css("color","0B6138");
						}
					} else {
						for (var j=1; j<=2; j++) {
							$("#wasteReason" + j + " .ui-btn-text").text("My Bin");
							$("#wasteReason" + j + " .ui-btn-text").parent().css("color","white");
						}
					}
					
					
				}
				