// File: readFoodXML.js

// Start function when DOM has completely loaded 
$(document).ready(function(){ 

	// Open the foods.xml file
	$.get("foods.xml",{},function(xml){
      	
		// Build an HTML string
		myHTMLOutput = '';
	 	myHTMLOutput += '<div class="ui-grid-b">';
	 
		// Run the function for each student tag in the XML file
		$('food',xml).each(function(i) {
		 	myHTMLOutput += '<div class="ui-block-b">';

			foodName = $(this).find("name").text();
			foodType = $(this).find("type").text();
			foodIcon = $(this).find("icon").text();
			
			// Build row HTML data and store it in string
			mydata = BuildFoodHTML(foodName,foodType,foodIcon);
			myHTMLOutput = myHTMLOutput + mydata;
			myHTMLOutput += '</div>';
		});
		myHTMLOutput += '</div>';
		// Update the DIV called Content Area with the HTML string
		$("#ContentFoodArea").append(myHTMLOutput);
	});
});
 
 
 
 function BuildFoodHTML(foodName,foodType,foodIcon){
	
	// Build HTML string and return
	output = '';
	output += '<a href="" data-theme="" id="ventaOption">' + '<img src="img/' + foodIcon + '" id="' + foodName + '" onclick="myFunction()"> </a>';
	//output += ' <a href="" data-theme="" id="ventaOption"> <img src="img/Picture9.jpg" id="food12" onclick="myFunction()"> </a>';
	return output;
}
	 