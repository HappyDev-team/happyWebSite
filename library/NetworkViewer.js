function NetworkViewer(globalData){
	this.store = new MyStore({context: "http://owl.openinitiative.com/oicontext.jsonld"});
	this.panel = globalData.panel;
	this.principal = globalData.principal;
	this.title = globalData.title;
	
    this.viewportWidth = 1000;
    this.viewportHeight = 780;
    this.zoomLevel = 3;
	
	d3.json(globalData.file, function(data) {
		this.nodes = data.nodes;
		
		this.viewerMap = new Map(data.nodes.filter(this.selecNodes));
		
        this.svgContainer = d3.select("body").append("svg")
            .attr("id", "svg-container")
            .attr("viewBox", `0 0 ${this.viewportWidth} ${this.viewportHeight}`)
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("preserveAspectRatio", "xMidYMid meet").append("g");
        d3.layout.force().nodes(data.nodes)
                 .links(data.links)
                 .start();
        this.drawNodes();
        this.drawLinks(data.links);
		this.crossroad(location.pathname);
    }.bind(this));
}

NetworkViewer.prototype.selecNodes = function(node){
	if(node.name) {
		var obj = new Array();
		return obj[node.name] = node;
	}
}

NetworkViewer.prototype.drawNodes = function(){
	window.nodes = this.svgContainer.selectAll(".node")
        .data(this.nodes)
        .enter().append("svg");
	
	var objectNV = this;

    nodes.append("circle")
        .attr("cx", function(d) { return d.cx;})
        .attr("cy", function(d) { return d.cy;})
        .attr("r", function(d) { return d.name ? 16 : 4; });

    nodes.each(function(d) {
        if (d.name){
			d3.select(this).on("click", function(){
				if(location.pathname.startsWith("/"+d.name) && d.container){
					objectNV.panel.animate({right:"0"});
				}else{
					objectNV.crossroad(d.name);
				}
			})
			.style("cursor", "pointer")
			.append("text")
				.attr("class", "node-name")
				.attr("x", function(d) { return d.cx; })
				.attr("y", function(d) { return d.cy+55; })
				.attr("text-anchor","middle")
				.text(function(d) { return d.name; });
		}});
    return nodes;
};

NetworkViewer.prototype.drawLinks = function(links){
	window.links = this.svgContainer.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.cx; })
        .attr("y1", function(d) { return d.source.cy; })
        .attr("x2", function(d) { return d.target.cx; })
        .attr("y2", function(d) { return d.target.cy; })
        .style("animation-duration", function(d){return d.duration})
        .style("animation-delay", function(d){return d.delay});
    return links;
}

NetworkViewer.prototype.zoom = function(node){
	if(node.name){
		if(node.container){
			this.panel.animate({right:"0"});
			$("."+this.title).attr("class","happy-unZoom");
			$(".happy-unZoom").on("click",function(elem){
				this.crossroad("/");
			}.bind(this));
			this.areaLeft = node.cx - this.viewportWidth/this.zoomLevel/2;
            this.areaTop = node.cy - this.viewportHeight/this.zoomLevel/2;
			this.svgContainer.transition().duration(500).attr("transform",
                `translate(${this.viewportWidth/2-node.cx*this.zoomLevel},${this.viewportHeight/2-node.cy*this.zoomLevel})scale(${this.zoomLevel})`);
			this.fetchMembers(node);
			this.movingContainer();
		}
	}
}

NetworkViewer.prototype.unZoom = function(){
	$(".happy-unZoom").attr("class",this.title);
	this.svgContainer.transition().duration(500).attr("transform",``);
	this.panel.animate({right: -this.panel.width()});
	this.panel.find(this.component).remove();
	$(".members").remove();
	this.stopMoving();
}

NetworkViewer.prototype.fetchMembers = function(node){
	$(".members").remove();
	
    d3.json(node.container, function(data) {
		var nodes = [{x:(node.cx)-100,y:(node.cy)-10,fixed:true}].concat(data["@graph"][0]["http://www.w3.org/ns/ldp#contains"]);
		var links = this.nodesLinkList(nodes);
		
		var cont = this.svgContainer.append("svg").attr("class", "members");
		
        this.members = cont.selectAll(".members")
						.data(nodes)
						.enter().append("svg")
						.style("cursor", "pointer");
        
		var force = d3.layout.force()
					.size([this.viewportWidth/this.zoomLevel+this.areaLeft,this.viewportHeight/this.zoomLevel+this.areaTop])
					.charge(-2000)
					.nodes(nodes)
					.links(links)
					.friction(0.7)
					.start();
							
		var link = cont.selectAll(".link")
						.data(links)
						.enter().append("line")
						.attr("class", "link");
						
		this.members.append("circle")
			.attr("cx", 100)
			.attr("cy", 10)
			.attr("class", "node").attr("r", 8);
				
		this.members.append("text").attr("class", "member-name")
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
			this.members.attr("x", function(d){return d.x;})
				.attr("y", function(d){return d.y;});
				
			link.attr("x1", function(d){return (d.source.x)+100;})
				 .attr("y1", function(d){return (d.source.y)+10;})
				 .attr("x2", function(d){return (d.target.x)+100;})
				 .attr("y2", function(d){return (d.target.y)+10;});
		}.bind(this));
    }.bind(this));
};

NetworkViewer.prototype.nodesLinkList = function(nodes){
	var liste = [];
	
	//Comment supprimé la première valeur 0:0???
	nodes.map(function(elem){
		liste.push({source:0,target:elem});
	});
	
	return liste;
};

NetworkViewer.prototype.crossroad = function(road){
	this.road = road;
	var route1 = crossroads.addRoute("/");
	var route2 = crossroads.addRoute("{section}");
		
	route1.matched.add(function(){
		this.unZoom();
		this.principal.hide();
		this.principal.find($(this.component)).remove();
		this.panel.find($("h2")).remove();
		this.panel.find($(this.component)).remove();
		history.pushState(null,"HappyHome","/");
	}.bind(this));
	
	route2.matched.add(function(){
		// console.log(this.viewerMap);
		var roads;
		this.nodes.map(function(n){
			if("/"+n.name == this.road){
				roads = n;
			}
		}.bind(this));
		this.road = roads;
		this.panel.find($("h2")).remove();
		this.panel.find($(this.component)).remove();
		if(this.road.container){
			this.component = this.road.component;
			this.panel.append("<h2>"+this.road.name+"</h2>");
			this.panel.append("<"+this.component+" data-src='"+this.road.container+"'></"+this.component+">");
			this.zoom(this.road);
			history.pushState(null,"Happy "+this.road.name,this.road.name);
		}else{
			this.unZoom();
			this.component = this.road.component;
			this.principal.show();
			if(this.road.target){
				this.principal.append("<"+this.component+" data-target='"+this.road.target+"' data-action="+this.road.action+" data-mails="+this.road.mails+"></"+this.component+">");
			}
			else this.principal.append("<"+this.component+"></"+this.component+">");
			history.pushState(null,"Happy "+this.road.name,this.road.name);
		}
	}.bind(this));
	
	crossroads.parse(this.road);
}

NetworkViewer.prototype.movingContainer = function(){
	 var mouseMovement = false;
	
	$("#svg-container").on("mousedown", function(elem){
		mouseMovement = true;
		this.mouseX = elem.clientX;
		this.mouseY = elem.clientY;
		elem.preventDefault();
	}.bind(this));
	
	$("#svg-container").on("mousemove", function(elem){
		if(mouseMovement){
			this.relativeX = this.mouseX - elem.clientX;
			this.relativeY = this.mouseY - elem.clientY;
			this.svgContainer.transition().attr("transform",
                `translate(${this.areaLeft-this.relativeX},${this.areaTop-this.relativeY})scale(${this.zoomLevel})`);
		}
	}.bind(this));
	
	$("#svg-container").on("mouseup", function(elem){
		this.areaLeft -= this.relativeX;
        this.areaTop -= this.relativeY;
		mouseMovement = false;
	}.bind(this));
	
	$("#svg-container").on("mouseleave", function(elem){
		this.areaLeft -= this.relativeX;
        this.areaTop -= this.relativeY;
		mouseMovement = false;
	}.bind(this));
}

NetworkViewer.prototype.stopMoving = function(){
	$("#svg-container").off();
}