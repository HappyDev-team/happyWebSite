function getLineLength(line) {
    return Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))
}

function drawNodes(container, data) {
    window.nodes = container.selectAll(".node")
        .data(data)
        .enter().append("svg");

    // addition d'un Circle à chaque svg.node
    nodes.append("circle")
        .attr("cx", function(d) { return d.cx;})
        .attr("cy", function(d) { return d.cy;})
        .attr("r", function(d) { return d.name ? 16 : 4; });

    // addition d'un Text à chaque svg.node
    nodes.each(function(d) {
        if (d.name)
            d3.select(this).on("click", function(){crossroads.parse(d.name);})
                .style("cursor", "pointer")
                .append("text")
                    .attr("class", "node-name")
                    .attr("x", function(d) { return d.cx-38; })
                    .attr("y", function(d) { return d.cy+55; })
                    .text(function(d) { return d.name; });
    });
    return nodes;
}

function drawLinks(container, data) { 
    window.links = container.selectAll(".link")
        .data(data)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.cx; })
        .attr("y1", function(d) { return d.source.cy; })
        .attr("x2", function(d) { return d.target.cx; })
        .attr("y2", function(d) { return d.target.cy; })
        .style("animation-duration", "5s")
        .style("animation-delay", function(d){return d.delay});
    return links;
}

function fetchMembers(node) {
	$(".members").remove();
	
    d3.json(node.container, function(data) {
		var nodes = [{x:(node.cx)-100,y:(node.cy)-10,fixed:true}].concat(data["@graph"][0]["http://www.w3.org/ns/ldp#contains"]);
		var links = listingList(nodes);
		
		var cont = svgContainer.append("svg").attr("class", "members");
		
        window.members = cont.selectAll(".members")
						.data(nodes)
						.enter().append("svg")
						.on("click", showMember)
						.style("cursor", "pointer");
        
		var force = d3.layout.force()
					.size([viewportWidth/zoomLevel+areaLeft,viewportHeight/zoomLevel+areaTop])
					.charge(-2000)
					.nodes(nodes)
					.links(links)
					.friction(0.7)
					.start();
							
		var link = cont.selectAll(".link")
						.data(links)
						.enter().append("line")
						.attr("class", "link");
						
		members.append("circle")
			.attr("cx", 100)
			.attr("cy", 10)
			.attr("class", "node").attr("r", 8);
				
		members.append("text").attr("class", "member-name")
			.attr("y", 30)
			.attr("x", 100)
			.attr("text-anchor","middle")
			.text(function(d) {
				if(d["foaf:firstName"])
					return d["foaf:firstName"] + " " + d["foaf:name"];
				else
					return d["project_title"];
			});
		
		force.on("tick",function(){
			members.attr("x", function(d){return d.x;})
				.attr("y", function(d){return d.y;});
				
			link.attr("x1", function(d){return (d.source.x)+100;})
				 .attr("y1", function(d){return (d.source.y)+10;})
				 .attr("x2", function(d){return (d.target.x)+100;})
				 .attr("y2", function(d){return (d.target.y)+10;});
		});
    });
}

function listingList(nodes){
	var liste = [];
	
	for(var i=1 ; i<nodes.length ; i++){
		liste.push({source:0,target:i});
	}
	
	return liste;
}

function zoom(node) {
    if(node.name) {
        if(node.container) {
			$(".happy-title").attr("class","happy-unzoom");
			$(".happy-unzoom").on("click",function(){crossroads.parse("/");});
            areaLeft = node.cx - viewportWidth/zoomLevel/2;
            areaTop = node.cy - viewportHeight/zoomLevel/2;
            svgContainer.transition().duration(500).attr("transform",
                `translate(${viewportWidth/2-node.cx*zoomLevel},${viewportHeight/2-node.cy*zoomLevel})scale(${zoomLevel})`);
            window.template = `#${node.name}-template`;
            $("#panel").show();
			$("#panel").animate({right:"0"});
            store.render("#panel", node.container, `#${node.name}-list-template`);
            fetchMembers(node);
        } else {
			crossroads.parse(node.name);
        }
    }
	nodeMemo = node;
	isZoom = true;
}

function unZoom(){
	svgContainer.transition().duration(500).attr("transform",``);
	isZoom = false;
	hidePanel();
	$(".members").remove();
	$(".happy-unzoom").attr("class","happy-title");
}

function showMember(member) {
    $("#panel").show();
	$("#panel").animate({right:"0"});
    store.render("#panel", member["@id"], window.template);
}

function sendContact() {
    if(contactEtape != 3){
		return false;
	}else{
		alert('salut ' + $("#contact-name").val() + ' !');
		$("#contact-name, #contact-howru, #contact-request, #contact-contact").val("");
		contactEtape = 0;
		$('#contactEtape1, #contactEtape2, #contactEtape3').hide();
		$(".contact-centre").remove();
		crossroads.parse("/");
		return false;
	}
}

function hidePanel(){
	if(($("#panel #member").length || $("#panel #project").length) && isZoom){
		$("#panel").html("");
		store.render("#panel", nodeMemo.container, `#${nodeMemo.name}-list-template`);
	}else{
		$("#panel").animate({right:"-350px"});
		
		setTimeout(function(){	
			$("#panel").html("");
		},700);
	}
}

$(function() {
    window.store = new MyStore({context: "http://owl.openinitiative.com/oicontext.jsonld"});
    
    window.viewportWidth = 1000;
    window.viewportHeight = 780;
    window.zoomLevel = 3;
    d3.json("data.json", function(data) {
        window.svgContainer = d3.select("body").append("svg")
            .attr("id", "svg-container")
            .attr("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`)
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("preserveAspectRatio", "xMidYMid meet").append("g");
        d3.layout.force().nodes(data.nodes)
                 .links(data.links)
                 .start();
        drawNodes(svgContainer, data.nodes);
        drawLinks(svgContainer, data.links);
    });
	
	$("#manifeste").on("click", function(){
		crossroads.parse("/");
	});
	
	contactEtape = 0;
	
	$("#contact .back").on("click", function(){
		crossroads.parse("/");
	});
	
	$("#contact-name").on("change", function(){
		$("#contactEtape1").show();
		if(contactEtape == 0){
			$("<div class='contact-centre'>Enchanté "+ $(this).val() +", nous sommes HAPPY DEV!</div>").insertBefore("#contactEtape1");
			contactEtape += 1;
		}else{
			$(this).closest("div").next(".contact-centre").remove();
			$("<div class='contact-centre'>Enchanté "+ $(this).val() +", nous sommes HAPPY DEV!</div>").insertBefore("#contactEtape1");
		}
	});
	
	$("#contact-howru").on("change", function(){
		$("#contactEtape2").show();
		if(contactEtape == 1){
			contactEtape += 1;
		}
	});
	
	$("#contact-request").on("change",function(){
		$("#contactEtape3").show();
		if(contactEtape == 2){
			$("<div class='contact-centre'>Ta demande va être prise en compte dans les meilleurs délais.</div>").insertBefore("#contactEtape3");
			contactEtape +=1;
		}
	});
	
	$("#contact-contact").on("change",function(){
		if(isValidEmailAddress($(this).val())){
			$(this).closest("form").submit();
		}else{
			$(this).closest("form").append("<div class='contact-centre'>Cet email n'est pas valide!</div>");
		}
	});
		
	var route1 = crossroads.addRoute("team");
	var route2 = crossroads.addRoute("projects");
	var route3 = crossroads.addRoute("manifeste");
	var route4 = crossroads.addRoute("contact");
	var route5 = crossroads.addRoute("/");
	
	isZoom = false;
	
	route1.matched.add(function(){
		d3.json("data.json",function(data){
			zoom(data.nodes[2]);
			history.pushState(null,"Happy"+data.nodes[2].name,data.nodes[2].name);
		});
	});
	
	route2.matched.add(function(){
		d3.json("data.json",function(data){
			zoom(data.nodes[4]);
			history.pushState(null,"Happy"+data.nodes[4].name,data.nodes[4].name);
		});
	});
	
	route3.matched.add(function(){
		if(isZoom){
			unZoom();
		}
		$("#contact").hide();
		$("#manifeste").slideDown("slow");
		history.pushState(null,"HappyManifesto","manifeste");
	});
	
	route4.matched.add(function(){
		if(isZoom){
			unZoom();
		}
		$("#contact").show();
		$("#manifeste").slideUp("slow");
		history.pushState(null,"HappyContact","contact");
	});
	
	route5.matched.add(function(){
		if(isZoom){
			unZoom();
		}
		$("#contact").hide();
		$("#manifeste").slideUp("slow");
		history.pushState(null,"HappyHome","/");
	});
	
	crossroads.parse(location.pathname);
	
	window.onpopstate = function(){
		crossroads.parse(location.pathname);
	}
});

function isValidEmailAddress(emailAddress) {
    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return pattern.test(emailAddress);
};
