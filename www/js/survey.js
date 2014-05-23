function openSurveyPage() {
	$.mobile.changePage("#surveyPage");
	updateWasteBubbles();
}

function sendSurveyData(qNumber, qValue) {
	$
			.ajax({
				type : "GET",
				url : sessionStorage.getItem("serverDomain") + "/survey?",
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
					q1 : qNumber,
					q2 : qValue,
					q3 : 0,
					q4 : 0
				},
				success : function(data) {
					//queryUpdateSurveyData(data.members);  
					console
							.log('Survey data has been sent to the server successfully!');
				},
				error : function(e) {
					saveSurveyOffline(qNumber, qValue, 0, 0);
					console
							.log(e
									+ ' : Survey data could not be sent to the server!');
				}
			});
	return false;
}