function getLineLength(line) {
    return Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))
}

function drawNodes(container, data) {
    var nodes = container.selectAll(".node")
        .data(data)
        .enter().append("svg");

    // addition d'un Circle à chaque svg.node
    nodes.append("circle")
        .attr("cx", function(d) { return d.cx;})
        .attr("cy", function(d) { return d.cy;})
        .attr("r", function(d) { return d.name ? 16 : 4; })
        .on("click", function(d) {
          window.location.hash = d.url;
        });

    // addition d'un Text à chaque svg.node
    nodes.each(function(d) {
        if (d.name) {
            d3.select(this).append("text")
                .attr("class", "node-name")
                .attr("x", function(d) { return d.cx-38; })
                .attr("y", function(d) { return d.cy+55; })
                .text(function(d) { return d.name; })
                .on("click", function(d) {
                  window.location.hash = d.url;
                });
        }
    });
    return nodes;
}

function drawLinks(container, data) {
    var links = container.selectAll(".link")
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

$(function() {
    d3.json("data.json", function(data) {
        var svgContainer = d3.select("body").append("svg")
            .attr("id", "svg-container")
            .attr("viewBox", "0 0 1024 768")
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("preserveAspectRatio", "xMidYMid meet");
        d3.layout.force().nodes(data.nodes)
                 .links(data.links)
                 .start();
        drawNodes(svgContainer, data.nodes);
        drawLinks(svgContainer, data.links);
    });
});
