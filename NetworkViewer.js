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
        crossroads.parse(location.pathname);
    }.bind(this));
}

NetworkViewer.prototype.drawNodes = function(nodelist){
    window.nodes = this.svgContainer.selectAll(".node")
        .data(nodelist)
        .enter().append("svg");
    
    var objectNV = this;

    nodes.append("circle")
        .attr("cx", d => d.cx)
        .attr("cy", d => d.cy)
        .attr("r", d => d.name ? 16 : 4);

    nodes.each(function(d) {
        if (d.name){
            d3.select(this).on("click", function(){
                if(location.pathname == "/"+d.name && d.ldp){
                    objectNV.panel.animate({right:"0"});
                    $(objectNV.component).attr("data-selected", "undefined");
                }else{
                    crossroads.parse(d.name);
                }
            })
            .style("cursor", "pointer")
            .append("text")
                .attr("class", "node-name")
                .attr("x", d => d.cx)
                .attr("y", d => d.cy+55)
                .attr("text-anchor","middle")
                .text(d => d.name);
        }});
    return nodes;
};

NetworkViewer.prototype.drawLinks = function(links){
    window.links = this.svgContainer.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.cx)
        .attr("y1", d => d.source.cy)
        .attr("x2", d => d.target.cx)
        .attr("y2", d => d.target.cy)
        .style("animation-duration", d => d.duration)
        .style("animation-delay", d => d.delay);
    return links;
}

NetworkViewer.prototype.setContainerTransform = function(x, y, zoom, transition) {
    if(transition) this.svgContainer.transition().duration(500);
    this.svgContainer.attr("transform", `translate(${x},${y})scale(${this.zoomLevel})`);
}

NetworkViewer.prototype.zoom = function(node){
    if(node.ldp){
        this.panel.animate({right:"0"});
        $("."+this.title).attr("class","happy-unZoom");
        $(".happy-unZoom").on("click", () => crossroads.parse("/"));
        this.setContainerTransform(this.viewportWidth/2-node.cx*this.zoomLevel, this.viewportHeight/2-node.cy*this.zoomLevel, true);
        this.fetchMembers(node);
        this.startMoving();
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
    
    d3.json(node.options.src, function(data) {
        var nodes = [{x:(node.cx)-100,y:(node.cy)-18,fixed:true}].concat(data["@graph"][0]["http://www.w3.org/ns/ldp#contains"]);
        var linksdata = nodes.map(elem => ({source:0, target:elem}));
        
        var container = this.svgContainer.append("svg").attr("class", "members");
		
		this.setMemberLinks(linksdata,container);
		
		this.setMemberNode(nodes,container);
		
		this.startMemberAnimation(node,nodes,linksdata);
    }.bind(this));
};

NetworkViewer.prototype.setMemberLinks = function(linksdata,container){
	this.links = container.selectAll(".link")
                        .data(linksdata)
                        .enter().append("line")
                        .attr("class", "link");
}

NetworkViewer.prototype.setMemberNode = function(nodes,container){
		var objectNV = this;
		
		this.members = container.selectAll(".members")
            .data(nodes)
            .enter().append("svg")
            .style("cursor", "pointer")
            .attr("class","node");
        
        this.members.append("circle")
            .attr("cx", 100)
            .attr("cy", 19)
            .attr("class", "node").attr("r", d => d.fixed?17:8);
        
        this.members.append('clipPath').attr("id",function(d){
                if(d["foaf:firstName"])
                    if(d["foaf:nick"])
                        return "clip"+objectNV.slugify(d["foaf:nick"]);
                    else
                        return "clip"+objectNV.slugify(d["foaf:firstName"] + " " + d["foaf:name"]);
                else
                    return "clip"+objectNV.slugify(d["project_title"]);
            })
            .append("circle")
            .attr("cx", 100)
            .attr("cy", 19)
            .attr("r", function(d){if(d.fixed) return 16; else return 8;});
            
        this.members.append("image")
            .attr("xlink:href",function(d){
                if(d["foaf:firstName"])
                    return d["foaf:img"];
                else
                    return d["project_picture"];
            })
            .attr("x", 90)
            .attr("y", 8)
            .attr("width",20)
            .attr("height",20)
            .attr("style", function(d){
                if(d["foaf:firstName"])
                    if(d["foaf:nick"])
                        return "clip-path:url(#clip"+objectNV.slugify(d["foaf:nick"])+")";
                    else                
                        return "clip-path:url(#clip"+objectNV.slugify(d["foaf:firstName"] + " " + d["foaf:name"])+")";
                else
                    return "clip-path:url(#clip"+objectNV.slugify(d["project_title"])+")";
            });

            
        this.members.on("click",function(d){
            objectNV.panel.animate({right:"0"});
            var oldURL = location.pathname.split("/");
            if(d.project_title)    crossroads.parse(oldURL[1]+"/"+d.project_title);
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
}

NetworkViewer.prototype.startMemberAnimation = function(node,nodes,linksdata){
	this.force = d3.layout.force()
                    .size([node.cx*2, node.cy*2])
                    .charge(this.charge)
                    .nodes(nodes)
                    .links(linksdata)
                    .friction(this.friction)
                    .start();
	
	this.force.on("tick",() => {
            this.members.attr("x", d => d.x)
                .attr("y", d => d.y);
                
            this.links.attr("x1", d => d.source.x+100)
                 .attr("y1", d => d.source.y+16)
                 .attr("x2", d => d.target.x+100)
                 .attr("y2", d => d.target.y+16);
        });
}

NetworkViewer.prototype.routeHome = function(){
    this.unZoom();
    this.principal.slideUp();
    this.panelComponent = "undefined";
    history.pushState(null,"Happy Home","/");
}
NetworkViewer.prototype.routeComponent = function(section) {
    var sectionNode = this.nodesMap.get(section);
    this.principal.find($(this.component)).remove();
    if(sectionNode.ldp){
        if(this.panelComponent != sectionNode.component){
            this.panel.find($("h2")).remove();
            this.panel.find($(this.component)).remove();
            this.zoom(sectionNode);
            this.panelComponent = sectionNode.component;
            this.panel.append("<h2>"+sectionNode.name+"</h2>");
            this.createComponent(sectionNode, this.panel);
        }else{
            $(this.component).attr("data-selected", "undefined");
            this.panel.animate({right:"0"});
        }
    }else{
        this.unZoom();
        this.createComponent(sectionNode, this.principal);
        //if it's the mail component, we add a listener for the hdSend event.
        if(sectionNode.mail) $(this.component).on("hdSend", () => crossroads.parse("/"));
        this.principal.slideDown();
    }
    history.pushState(null,"Happy "+section,"/"+section);
}
NetworkViewer.prototype.routeDetail = function(section,id){
    var sectionNode = this.nodesMap.get(section);
    this.principal.find($(this.component)).remove();
    if(this.panelComponent != sectionNode.component){
        this.panelComponent = sectionNode.component;
        if(this.component){
            this.panel.find($("h2")).remove();
            this.panel.find($(this.component)).remove();
        }
        this.panel.append("<h2>"+sectionNode.name+"</h2>");
        this.createComponent(sectionNode, this.panel, {"name":"selected","value":id});
        this.zoom(sectionNode);
    }
    $(this.component).attr("data-selected",this.slugify(id));
    history.pushState(null,"Happy "+section,"/"+section+"/"+this.slugify(id));
}

NetworkViewer.prototype.crossroadInit = function(){
    crossroads.addRoute("/").matched.add(this.routeHome.bind(this));
    crossroads.addRoute("{section}").matched.add(this.routeComponent.bind(this));
    crossroads.addRoute("/{section}/{title}").matched.add(this.routeDetail.bind(this));
    
    $(window).on("popstate", () => crossroads.parse(location.pathname));
}

NetworkViewer.prototype.handleKeyboard = function(event){
    var newX = d3.transform(this.svgContainer.attr("transform")).translate[0];
    var newY = d3.transform(this.svgContainer.attr("transform")).translate[1];
    switch(event.keyCode) {
        case 37: newX += 5; break;
        case 38: newY += 5; break;
        case 39: newX -= 5; break;
        case 40: newY -= 5; break;
    }
    this.setContainerTransform(newX, newY);
}

NetworkViewer.prototype.startMoving = function(){
     var mouseMovement = false;
    
    $("#svg-container").on("mousedown", function(event){
        mouseMovement = true;
        this.previousX = event.clientX;
        this.previousY = event.clientY;
        event.preventDefault();
    }.bind(this));
    
    $("#svg-container").on("mousemove", function(event){
        if(mouseMovement){
            var newX = d3.transform(this.svgContainer.attr("transform")).translate[0] - (this.previousX - event.clientX);
            var newY = d3.transform(this.svgContainer.attr("transform")).translate[1] - (this.previousY - event.clientY);
            this.setContainerTransform(newX, newY);
            this.previousX = event.clientX;
            this.previousY = event.clientY;
        }
    }.bind(this));
    
    $("#svg-container").on("mouseup", () => {mouseMovement = false;});
    $("#svg-container").on("mouseleave", () => {mouseMovement = false;});
    $(document).on("keydown", this.handleKeyboard.bind(this));
}

NetworkViewer.prototype.stopMoving = function(){
    $("#svg-container").off();
    $(document).off();
}

//Take an object node or an object containing a node and the selected options for the component.
NetworkViewer.prototype.createComponent = function(obj, target, nodeOptions){
    var link = document.createElement('link');
    link.setAttribute('rel', 'import');
    link.setAttribute('href', obj.import);
    link.onload = () => {
        this.component = document.createElement(obj.component);
        for(optionName in obj.options)
            this.component.setAttribute("data-"+optionName, obj.options[optionName]);
        if(nodeOptions) this.component.setAttribute("data-"+nodeOptions.name,nodeOptions.value);
        target.append(this.component);
        this.setComponentEvent();
    };
    document.body.appendChild(link);
}

//Event linked to the ldp Component.
NetworkViewer.prototype.setComponentEvent = function(){
    $(this.component).on("hdSelected", function(e){
        var componentName = location.pathname.split("/")[1];
        crossroads.parse("/"+componentName+"/"+this.slugify(e.originalEvent.detail));
    }.bind(this));
    $(this.component).on("hdUnSelected", function(){
        var componentName = location.pathname.split("/")[1];
        crossroads.parse(componentName);
    });
    $(this.component).on("hdRessourceClicked",function(e){
        crossroads.parse("/"+$(this.component).attr("data-targetURL")+"/"+this.slugify(e.originalEvent.detail));
    }.bind(this));
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
