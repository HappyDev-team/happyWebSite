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
        .style("animation-delay", "0.1s");
    return links;
}

function zoom(node) {
    $('.happy-title').hide();
    if(node.name) {
        areaLeft = node.cx - viewportWidth/zoomLevel/2;
        areaTop = node.cy - viewportHeight/zoomLevel/2;
        svgContainer.transition().duration(750).attr("transform",
            `translate(${viewportWidth/2-node.cx*zoomLevel},${viewportHeight/2-node.cy*zoomLevel})scale(${zoomLevel})`);

        d3.json(node.container, function(data) {
            window.members = svgContainer.selectAll(".members")
                .data(data["@graph"][0]["http://www.w3.org/ns/ldp#contains"])
                .enter().append("svg")
                    .attr("class", "members")
                    .attr("x", function(d) { return Math.random()*viewportWidth/zoomLevel+areaLeft;})
                    .attr("y", function(d) { return Math.random()*viewportHeight/zoomLevel+areaTop;})
                    .on("click", showMember)
                    .style("cursor", "pointer");
            
            members.append("circle").attr("cx", 40).attr("cy", 10)
                .attr("class", "node").attr("r", 8);
            
            members.append("text").attr("class", "member-name").attr("x", 15).attr("y", 25)
                .text(function(d) { return d["foaf:firstName"] + " " + d["foaf:name"]; });
        });
    }
}

function showMember(member) {
    $("#panel").show();
    store.render("#panel", member["@id"], "#profile-template");
}

$(function() {
    window.store = new MyStore({context: "http://owl.openinitiative.com/oicontext.jsonld"});
    
    window.viewportWidth = 1000;
    window.viewportHeight = 700;
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
});
