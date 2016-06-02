function NetworkViewer(globalOptions){
	this.store = new MyStore({context: "http://owl.openinitiative.com/oicontext.jsonld"});
	this.panel = globalOptions.panel;
	this.principal = globalOptions.principal;
	this.title = globalOptions.title;
	
	//contain all the options for the d3js effetcs.
	if(globalOptions.d3Options){
		this.viewportWidth = globalOptions.d3Options.viewWidth;
		this.viewportHeight = globalOptions.d3Options.viewHeight;
		this.zoomLevel = globalOptions.d3Options.zoom;
		this.charge = globalOptions.d3Options.charge;
		this.friction = globalOptions.d3Options.friction;
	}else{
		this.viewportWidth = 1000;
		this.viewportHeight = 780;
		this.zoomLevel = 3;
		this.charge = -2000;
		this.friction = 0.7;
	}
	
	d3.json(globalOptions.file, function(data) {
		this.nodesMap = new Map(data.nodes.filter(o=>o.name).map(o=>[o.name,o]));
		
        this.svgContainer = d3.select("body").append("svg")
            .attr("id", "svg-container")
            .attr("viewBox", `0 0 ${this.viewportWidth} ${this.viewportHeight}`)
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("preserveAspectRatio", "xMidYMid meet").append("g");
        d3.layout.force().nodes(data.nodes)
                 .links(data.links)
                 .start();
		 this.drawLinks(data.links);
        this.drawNodes(data.nodes);
		this.crossroadInit();
		this.previousPage();
		crossroads.parse(location.pathname);
    }.bind(this));
}

NetworkViewer.prototype.drawNodes = function(nodelist){
	window.nodes = this.svgContainer.selectAll(".node")
        .data(nodelist)
        .enter().append("svg");
	
	var objectNV = this;

    nodes.append("circle")
        .attr("cx", function(d) { return d.cx;})
        .attr("cy", function(d) { return d.cy;})
        .attr("r", function(d) { return d.name ? 16 : 4; });

    nodes.each(function(d) {
        if (d.name){
			d3.select(this).on("click", function(){
				if(location.pathname == "/"+d.name && d.ldp){
					objectNV.panel.animate({right:"0"});
					objectNV.componentCalling("undefined");
				}else{
					crossroads.parse(d.name);
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
		if(node.ldp){
			this.panel.animate({right:"0"});
			$("."+this.title).attr("class","happy-unZoom");
			$(".happy-unZoom").on("click",function(elem){
				crossroads.parse("/");
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
	this.panel.find($("h2")).remove();
	this.panel.find(this.component).remove();
	$(".members").remove();
	this.stopMoving();
}

NetworkViewer.prototype.fetchMembers = function(node){
	$(".members").remove();
	
	var objectNV = this;
	
    d3.json(node.options[0].value, function(data) {
		var nodes = [{x:(node.cx)-100,y:(node.cy)-16,fixed:true}].concat(data["@graph"][0]["http://www.w3.org/ns/ldp#contains"]);
		var links = this.nodesLinkList(nodes);
		
		var container = this.svgContainer.append("svg").attr("class", "members");
        
		var force = d3.layout.force()
					.size([this.viewportWidth/this.zoomLevel+this.areaLeft,this.viewportHeight/this.zoomLevel+this.areaTop])
					.charge(this.charge)
					.nodes(nodes)
					.links(links)
					.friction(this.friction)
					.start();
							
		var link = container.selectAll(".link")
						.data(links)
						.enter().append("line")
						.attr("class", "link");
		
		this.members = container.selectAll(".members")
			.data(nodes)
			.enter().append("svg")
			.style("cursor", "pointer")
			.attr("class","node");
		
		this.members.append('clipPath').attr("id",function(d){
				if(d["foaf:firstName"])
					return objectNV.slugify(d["foaf:firstName"] + " " + d["foaf:name"]);
				else
					return objectNV.slugify(d["project_title"]);
			})
			.append("circle")
			.attr("cx", 100)
			.attr("cy", 16)
			.attr("r", function(d){if(d.fixed) return 16; else return 8;});
		
		// this.members.append("circle")
			// .attr("cx", 100)
			// .attr("cy", 16)
			// .attr("class", "node").attr("r", function(d){if(d.fixed) return 16; else return 8;});
			
		this.members.append("image")
			.attr("xlink:href",function(d){
				if(d["foaf:firstName"])
					return d["foaf:img"];
				else
					return d["project_picture"];
			})
			.attr("x", 90)
			.attr("y", 5)
			.attr("width",20)
			.attr("height",20)
			.attr("clip-path", function(d){
				if(d["foaf:firstName"])
					return "url(#"+objectNV.slugify(d["foaf:firstName"] + " " + d["foaf:name"])+")";
				else
					return "url(#"+objectNV.slugify(d["project_title"])+")";
			});

			
		this.members.on("click",function(d){
			objectNV.panel.animate({right:"0"});
			var oldURL = location.pathname.split("/");
			if(d.project_title)	crossroads.parse(oldURL[1]+"/"+d.project_title);
			else if(d["foaf:nick"]) crossroads.parse(oldURL[1]+"/"+objectNV.slugify(d["foaf:nick"]));
			else crossroads.parse(oldURL[1]+"/"+objectNV.slugify(d["foaf:firstName"] + " " + d["foaf:name"]));
		});
				
		this.members.append("text").attr("class", "member-name")
			.attr("y", 36)
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
				 .attr("y1", function(d){return (d.source.y)+16;})
				 .attr("x2", function(d){return (d.target.x)+100;})
				 .attr("y2", function(d){return (d.target.y)+16;});
		}.bind(this));
    }.bind(this));
};

NetworkViewer.prototype.nodesLinkList = function(nodes){
	var list = [];

	nodes.map(function(elem){
		list.push({source:0,target:elem});
	});
	
	return list;
};

NetworkViewer.prototype.crossroadInit = function(){
	var route1 = crossroads.addRoute("/");
	var route2 = crossroads.addRoute("{section}");
	var route3 = crossroads.addRoute("/{section}/{title}");
	
	route1.matched.add(function(){
		this.unZoom();
		this.principal.slideUp();
		this.panelComponent = "undefined";
		history.pushState(null,"HappyHome","/");
	}.bind(this));
	
	route2.matched.add(function(section){
		var sectionNode;
		sectionNode = this.nodesMap.get(section);
		this.principal.find($(this.component)).remove();
		if(sectionNode.ldp){
			if(this.panelComponent != sectionNode.component){
				this.panel.find($("h2")).remove();
				this.panel.find($(this.component)).remove();
				this.zoom(sectionNode);
				this.panelComponent = sectionNode.component;
				this.panel.append("<h2>"+sectionNode.name+"</h2>");
				this.panel.append(this.createComponent(sectionNode));
				this.PanelComponentEvent();
			}else{
				this.componentCalling("undefined");
				this.panel.animate({right:"0"});
			}
		}else{
			this.unZoom();
			this.principal.append(this.createComponent(sectionNode));
			//if it's the mail component, we add a listener for the hdSend event.
			if(sectionNode.mail){
				$(this.component).on("hdSend", function(){
					crossroads.parse("/");
				}.bind(this));
			}
			this.principal.slideDown();
		}
		history.pushState(null,"Happy "+section,"/"+section);
	}.bind(this));
	
	route3.matched.add(function(section,id){
		var sectionNode;
		sectionNode = this.nodesMap.get(section);
		this.principal.find($(this.component)).remove();
		if(this.panelComponent != sectionNode.component){
			this.panelComponent = sectionNode.component;
			if(this.component){
				this.panel.find($("h2")).remove();
				this.panel.find($(this.component)).remove();
			}
			this.panel.append("<h2>"+sectionNode.name+"</h2>");
			var newsectionNode = [{sectionNode},{"name":"selected","value":id}];
			this.panel.append(this.createComponent(newsectionNode));
			this.PanelComponentEvent();
			this.zoom(sectionNode);
		}
		this.componentCalling(id);
		history.pushState(null,"Happy "+section,"/"+section+"/"+this.slugify(id));
	}.bind(this));
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
		this.relativeX = this.mouseX - elem.clientX;
		this.relativeY = this.mouseY - elem.clientY;
		if(mouseMovement && (this.relativeX || this.relativeY)){
			if(this.areaLeft != d3.transform(this.svgContainer.attr("transform")).translate[0] || this.areaTop != d3.transform(this.svgContainer.attr("transform")).translate[1]){
				this.areaLeft = d3.transform(this.svgContainer.attr("transform")).translate[0];
				this.areaTop = d3.transform(this.svgContainer.attr("transform")).translate[1];
				this.svgContainer.transition().duration(0).attr("transform",
					`translate(${this.areaLeft-this.relativeX},${this.areaTop-this.relativeY})scale(${this.zoomLevel})`);
				this.mouseX = elem.clientX;
				this.mouseY = elem.clientY;
			}
		}
	}.bind(this));
	
	$("#svg-container").on("mouseup", function(elem){
		mouseMovement = false;
	});
	
	$("#svg-container").on("mouseleave", function(elem){	
		mouseMovement = false;
	});
	
	$(document).on("keydown", function(elem){
		this.areaLeft = d3.transform(this.svgContainer.attr("transform")).translate[0];
		this.areaTop = d3.transform(this.svgContainer.attr("transform")).translate[1];
		if(elem.keyCode == 37){
			this.svgContainer.transition().duration(0).attr("transform",
					`translate(${this.areaLeft+(1*this.zoomLevel)},${this.areaTop})scale(${this.zoomLevel})`);
		}else if(elem.keyCode == 38){
			this.svgContainer.transition().duration(0).attr("transform",
					`translate(${this.areaLeft},${this.areaTop+(1*this.zoomLevel)})scale(${this.zoomLevel})`);
		}else if(elem.keyCode == 39){
			this.svgContainer.transition().duration(0).attr("transform",
					`translate(${this.areaLeft-(1*this.zoomLevel)},${this.areaTop})scale(${this.zoomLevel})`);
		}else if(elem.keyCode == 40){
			this.svgContainer.transition().duration(0).attr("transform",
					`translate(${this.areaLeft},${this.areaTop-(1*this.zoomLevel)})scale(${this.zoomLevel})`);
		}
	}.bind(this));
}

NetworkViewer.prototype.stopMoving = function(){
	$("#svg-container").off();
	$(document).off();
}

NetworkViewer.prototype.componentCalling = function(target){
	if(target != "undefined")
		$(this.component).attr("data-selected",this.slugify(target));
	else
		$(this.component).removeAttr("data-selected");
}

//Take an object node or an object containing a node and the selected options for the component.
NetworkViewer.prototype.createComponent = function(obj){
	//If the object is not directly a node, we split it in two different object to use during the component creation.
	if(!obj.component){
		var nodeOptions = obj[1];
		obj = obj[0].sectionNode;
	}

	this.component = obj.component;
	var toAppend = document.createElement(this.component);
	if(obj.options){
		for(var i = 0; i < obj.options.length; i++){
			toAppend.setAttribute("data-"+obj.options[i].name,obj.options[i].value);
		}
	}
	if(nodeOptions)  toAppend.setAttribute("data-"+nodeOptions.name,nodeOptions.value);
	return toAppend;
}

//Event linked to the ldp Component.
NetworkViewer.prototype.PanelComponentEvent = function(){
	$(this.component).on("hdSelected", function(e){
		var URL = location.pathname.split("/");
		crossroads.parse("/"+URL[1]+"/"+this.slugify(e.originalEvent.detail));
	}.bind(this));
	$(this.component).on("hdUnSelected", function(){
		var URL = location.pathname.split("/");
		crossroads.parse(URL[1]);
	});
	$(this.component).on("hdRessourceClicked",function(e){
		crossroads.parse("/"+$(this.component).attr("data-targetURL")+"/"+this.slugify(e.originalEvent.detail));
	}.bind(this));
}

//Action done when the back button is press in the navigator.
NetworkViewer.prototype.previousPage = function(){
	$(window).on("popstate",function(){
		crossroads.parse(location.pathname);
	});
}

NetworkViewer.prototype.slugify = function(value){
	if(value){
		var rExps=[
			{re:/[\xC0-\xC6]/g, ch:'A'},
			{re:/[\xE0-\xE6]/g, ch:'a'},
			{re:/[\xC8-\xCB]/g, ch:'E'},
			{re:/[\xE8-\xEB]/g, ch:'e'},
			{re:/[\xCC-\xCF]/g, ch:'I'},
			{re:/[\xEC-\xEF]/g, ch:'i'},
			{re:/[\xD2-\xD6]/g, ch:'O'},
			{re:/[\xF2-\xF6]/g, ch:'o'},
			{re:/[\xD9-\xDC]/g, ch:'U'},
			{re:/[\xF9-\xFC]/g, ch:'u'},
			{re:/[\xC7-\xE7]/g, ch:'c'},
			{re:/[\xD1]/g, ch:'N'},
			{re:/[\xF1]/g, ch:'n'} ];

		for(var i=0, len=rExps.length; i<len; i++)
			value=value.replace(rExps[i].re, rExps[i].ch);
	 
		return value.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')
			.replace(/\-{2,}/g,'-');
	}
}