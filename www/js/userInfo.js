function openProfilePage() {
					$.mobile.changePage("#userInfoPage");
					sendUserAction(6, getNow(), "profile page opened");
					updateWasteBubbles();
					$("#selectAge").selectmenu('disable');
					$("#gender").selectmenu('disable');

					for (i = 15; i < 100; i++) {
						$("#selectAge").append(
								'<option value="' +  i + '">'
										+ i + '</option>');
					}
					$("#selectAge").selectmenu();
					$("#selectAge").selectmenu('refresh', true);

					$("#username").val(
							sessionStorage
									.getItem("currentUser"));
					$("#email")
							.val(
									sessionStorage
											.getItem("currentUserEmail"));
					$("#address")
							.val(
									sessionStorage
											.getItem("currentUserAddress"));
					$("#gender")
							.val(
									sessionStorage
											.getItem("currentUserGender"))
							.selectmenu('refresh');
					$("#selectAge").val(
							sessionStorage
									.getItem("currentUserAge"))
							.selectmenu('refresh');
				}


function edit() {
	$("#email").removeAttr('readonly');
	$("#address").removeAttr('readonly');
	$("#selectAge").selectmenu('enable');
	$("#gender").selectmenu('enable');
}

function save() {
	$.ajax({
		type : "GET",
		url : sessionStorage.getItem("serverDomain") + "/editUserData?",
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
			username : $('#username').val(),
			email : $('#email').val(),
			address : $('#address').val(),
			age : $('#selectAge').val(),
			gender : $('#gender').val()
		},
		success : function(data) {
			if (data.members.value != 'ok') {
				navigator.notification.alert(data.members.value);
				console.log("failure!");
			} else {
				sessionStorage.setItem("currentUserEmail", data.members.email);
				sessionStorage.setItem("currentUserAddress",
						data.members.address);
				sessionStorage
						.setItem("currentUserGender", data.members.gender);
				sessionStorage.setItem("currentUserAge", data.members.age);

			}
		},
		error : function(e) {
			navigator.notification.alert("Internet access problem");
		}
	});

	return false;
}


function logout () {
	window.localStorage.removeItem("currentuser"); 
	window.location.href = 'login.html'; 
	
}


