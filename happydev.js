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
            d3.select(this).on("click", zoom)
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
    d3.json(node.container, function(data) {
		var nodes = [{x:(node.cx)-40,y:(node.cy)-10,fixed:true}].concat(data["@graph"][0]["http://www.w3.org/ns/ldp#contains"]);
		var links = [{source: 0, target: 1},
						  {source: 0, target: 2},
						  {source: 0, target: 3},
						  {source: 0, target: 4},
						  {source: 0, target: 5},
						  {source: 0, target: 6}];
		
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
					.start();
							
		var link = cont.selectAll(".link")
						.data(links)
						.enter().append("line")
						.attr("class", "link");
						
		members.append("circle")
			.attr("cx", 40)
			.attr("cy", 10)
			.attr("class", "node").attr("r", 8);
				
		members.append("text").attr("class", "member-name")
			.attr("y", 25)
			.attr("alignement-baseline","middle")
			.text(function(d) {
				if(d["foaf:firstName"])
					return d["foaf:firstName"] + " " + d["foaf:name"];
				else
					return d["project_title"];
			});
		
		force.on("tick",function(){
			members.attr("x", function(d){return d.x;})
				.attr("y", function(d){return d.y;});
				
			link.attr("x1", function(d){return (d.source.x)+40;})
				 .attr("y1", function(d){return (d.source.y)+10;})
				 .attr("x2", function(d){return (d.target.x)+40;})
				 .attr("y2", function(d){return (d.target.y)+10;});
		});
    });
}

function zoom(node) {
    if(node.name) {
        if(node.container) {
            $('.happy-title').hide();
            areaLeft = node.cx - viewportWidth/zoomLevel/2;
            areaTop = node.cy - viewportHeight/zoomLevel/2;
            svgContainer.transition().duration(750).attr("transform",
                `translate(${viewportWidth/2-node.cx*zoomLevel},${viewportHeight/2-node.cy*zoomLevel})scale(${zoomLevel})`);
            window.template = `#${node.name}-template`;
            $("#panel").show();
			$("#unzoom").css("right","360px");
			$("#unzoom").show();
            store.render("#panel", node.container, `#${node.name}-list-template`);
            fetchMembers(node);
        } else {
            $(node.div).show();
			$("#manifeste").hide();
        }
    }
}

function unZoom(){
	svgContainer.transition().duration(750).attr("transform",``);
	
	$("#unzoom").hide();
	$("#panel").hide();
	$(".members").remove();
	$(".happy-title").show("slow");
}

function showMember(member) {
    $("#panel").show();
	$("#unzoom").css("right","360px");
    store.render("#panel", member["@id"], window.template);
}

function sendContact() {
    alert('salut ' + $("#contact-name").val() + ' !');
    $('#contact').hide();
    return false;
}

function hidePanel(){
	$('#panel').hide();
	$("#unzoom").css("right","20px");
	
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
	
	$(".happy-title").on("click", function(){
		$("#manifeste").slideDown("slow");
	});
	
	$("#manifeste").on("click", function(){
		$("#manifeste").slideUp("slow");
	});
	
	$("#unzoom").on("click",unZoom);
});
