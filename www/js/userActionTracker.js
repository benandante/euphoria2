

function sendUserAction( type,  date,  data) {
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
			actionType : type,
			actionData : data,
			actionDate : date
		},
		success : function(data) {
			console.log("User action sent to the server");
		},
		error : function(e) {
			console.log("User action couldn't be sent to the server");
			saveUserActionOffline( type,  date,  data);
		}
	});
	return false;
}




