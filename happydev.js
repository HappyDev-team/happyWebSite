$(function(){
	var chargeur = {"file":"data.json","panel":$("#panel"),"principal":$("#centrale"),"title":"happy-title"};
	
	var happyStar = new NetworkViewer(chargeur);

	$("#centrale img").on("click", function(){
		happyStar.crossroad("/");
	});
	
	$("#panel img").on("click", function(){
		$("#panel").animate({right:"-350px"});
	})
	
});