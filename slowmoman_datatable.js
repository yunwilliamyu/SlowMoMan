$(document).ready(function() {
    $('#variables').DataTable( {
        dom: 'Bfrtip',
        buttons: [
           'copy',
           {
                extend: 'csvHtml5',
                title: 'variables',
            },
            'selectAll',
            'selectNone',
        ],
        select: {
            style: 'os'
        },
        "columns": [
            { "data": "ids" },
            { "data": "color" },
            { "data": "label", "width": "35%" },
            { "data": "fft" }
        ],
        "columnDefs": [
            {
                "name": "ids",	
                "targets": [0],
                "visible": false,
                "searchable": false
            }
        ],
        "rowCallback": function(row, data) {
            $(row).css({color: data.color });
        },
        initComplete: function () {
            var btns = $('.dt-button');
            btns.addClass('transparent_button button');
            btns.removeClass('dt-button');

        }
    } );
    var var_table = $('#variables').DataTable();
    var_table.on( 'select', function (e, dt, type, indexes) {
        if (type === 'row') {
            regen_canvas(var_table);
        }
    });
    var_table.on( 'deselect', function (e, dt, type, indexes) {
        if (type === 'row') {
            regen_canvas(var_table);
        }
    });
    width2 = 520;
    height2 = 520;
    linesSVG = d3.select("#svg2");

    lines = linesSVG.append("g")
        .attr("cursor", "grab")
        .attr("id", "svgLines");

    linesSVG.call(d3.zoom()
        .translateExtent([[0, 0], [width2, height2]])
        .scaleExtent([1,10])
        .on("zoom", zoomed2));

} );

function regen_canvas(table) {
    var ids = table.rows('.selected').data().pluck('ids');
    var colors = table.rows('.selected').data().pluck('color');
    console.log(svg2)

    // clearing the SVG
    var tempGroup = document.getElementById("svgLines");
    while (tempGroup.firstChild) {
        tempGroup.removeChild(tempGroup.firstChild);
    }

    // adding each line
    for (var i=0; i<ids.length; i++) {
        let y_data = variables[fidx[ids[i]]];
        let x_data = [...Array(y_data.length).keys()]

        // SOURCE: https://gist.github.com/bryanhanson/11344247
        var xy = []; // start empty, add each element one at a time
        for (let i = 0; i < x_data.length; i++ ) {
            xy.push({x: x_data[i], y: y_data[i]});
        }

        var xscl = d3.scaleLinear()
            .domain(d3.extent(xy, function(d) {return d.x;})) //use just the x part
            .range([0, 520])

        var yscl = d3.scaleLinear()
            .domain(d3.extent(xy, function(d) {return d.y;})) // use just the y part
            .range([520, 0])

        var slice = d3.line()
            .x(function(d) { return xscl(d.x);}) // apply the x scale to the x data
            .y(function(d) { return yscl(d.y);}) // apply the y scale to the y data

        lines.append("path")
            .attr("class", "line")
            .attr("d", slice(xy)) // use the return value of slice(xy) as the data, 'd'
            .style("fill", "none")
            .style("stroke", colors[i])
            .style("stroke-width", 2);
    }
    // canvas2Data = svg2.getImageData(0, 0, width, height);

}

function zoomed2({transform}) {
    lines.attr("transform", transform);
}
