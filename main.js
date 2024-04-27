$(document).ready(function() {
    /*
        Loading all required DOM elements
    */
    document.getElementById('embeddingFileUpload').addEventListener('change', uploadEmbedding);
    document.getElementById('highDimFileUpload').addEventListener('change', uploadHighDimEmbedding);
    document.getElementById('export_path').addEventListener('click', exportPathToClipboard);
    document.getElementById('import_path').addEventListener('click', importPath);
    document.getElementById('submit_fft').addEventListener('click', computeFFT);
    document.getElementById('submit_autocorr').addEventListener('click', computeAutocorr);
    document.getElementById('point_size_slider').addEventListener('change', updateVizParams);
    document.getElementById('opacity_slider').addEventListener('change', updateVizParams);
    document.getElementById('line_width_slider').addEventListener('change', updateVizParams);
    document.getElementById('reset').addEventListener('click', reset);
    colorsHolder = document.getElementById('colors_holder');

    let fft_slider = document.getElementById("bin_num_slider");
    let bin_num_output = document.getElementById("bin_num");
    fft_slider.oninput = function() {
        let power = Math.pow(2, +this.value)
        bin_num_output.innerHTML = power.toString();
    }

    let lag_slider = document.getElementById("lag_slider");
    let lag_slider_output = document.getElementById("lag_value");
    lag_slider.oninput = function() {
        lag_slider_output.innerHTML = this.value;
    }

    let autocorr_slider = document.getElementById("bin_num_slider2");
    let autocorr_slider_value = document.getElementById("bin_num2");
    autocorr_slider.oninput = function() {
        autocorr_slider_value.innerHTML = +this.value
    }


});

let hd;
let embedding;
let classes2D;
let dimensionLabels;
let quadtree;
let scaleX;
let scaleY;
let line;
let embeddingColorMap;
let width = 700;
let height = 700;
const svg = d3.create("svg")
    .attr("class", "svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "#EEFFFF");

const g = svg.append("g")
    .attr("cursor", "grab");

let pathHistory = d3.path();
var colorMap = {};
var variables = [];

function init() {
    parseLocalCSV("data/swiss_roll_dataset/swissroll-2Dtsne.csv");
    parseLocalCSVHighDim("data/swiss_roll_dataset/swissroll-features.csv");
}

function zoomed({transform}) {
    g.attr("transform", transform);
}

function parseLocalCSV(fileName) {
    var data = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", fileName, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        const url = xmlhttp.responseText;
        result = Papa.parse(url, {skipEmptyLines: true,
            delimiter: ",",
            dynamicTyping: true,
            header: true,
            quoteChar: "\"",
            transformHeader:function(h) {
                return h.toLowerCase().trim();
            },
            complete: function (results) {
                data = results.data;
                const classes = [...new Set(data.map(item => item.class))];
                save2d(data, classes);
                drawEmbedding(data, classes);
            }});
    }
    return data;
}

function parseLocalCSVHighDim(fileName) {
    var data = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", fileName, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        const url = xmlhttp.responseText;
        result = Papa.parse(url, {skipEmptyLines: true,
            delimiter: ",",
            dynamicTyping: true,
            header: true,
            quoteChar: "\"",
            transformHeader:function(h) {
                return h.toLowerCase().trim();
            },
            complete: function (results) {
                let data = results.data;
                let header = results.meta['fields'].map(String);
                hdCSV(data, header);
            }});
    }
    return data;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

function uploadEmbedding(evt) {
    let data = null;
    let result;
    let file = evt.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
        document.getElementById("embeddingProgressMessage").innerHTML = ('Failed to upload file.');
    } else {
        reader.onprogress = function(event) {
            document.getElementById("embeddingProgressMessage").innerHTML = ('Importing...');
            var progressNode = document.getElementById("embeddingProgress");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            // TO DO: add erase and reset functions
            var csvData = event.target.result;
            result = Papa.parse(csvData, {skipEmptyLines: true,
                delimiter: ",",
                quoteChar: "\"",
                dynamicTyping: true,
                header: true,
                transformHeader:function(h) {
                    return h.toLowerCase().trim();
                },
                complete: function (results) {
                    document.getElementById("embeddingProgressMessage").innerHTML = ('Success!');
                    data = results.data;
                    const classes = [...new Set(data.map(item => item.class))];
                    save2d(data, classes);
                    drawEmbedding(data, classes);
                }});
        }
        reader.onerror = function() {
            document.getElementById("embeddingProgressMessage").innerHTML = ('Failed to upload file.');
            alert('Unable to read ' + file.fileName);
        };
    }
}

function hdCSV(data, originalFeatures) {
    hd = null;
    hd = data.map( Object.values );
    dimensionLabels = null;
    dimensionLabels = originalFeatures;
}


function hdAppend(data) {
    hd.push(data);
}

function save2d(data, classes) {
    embedding = null;
    embedding = data;
    classes2D = classes;
}

function uploadHighDimEmbedding(evt) {
    let data = null;
    let header = null;
    hd = [];
    let results;
    let file = evt.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
        document.getElementById("highDimProgressMessage").innerHTML = ('Failed to upload file.');
    } else {
        reader.onprogress = function(event) {
            document.getElementById("highDimProgressMessage").innerHTML = ('Importing...');
            var progressNode = document.getElementById("highDimProgress");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            // TO DO: add erase and reset functions
            var csvData = event.target.result;
            // result = Papa.parse(csvData, {skipEmptyLines: true,
            //     delimiter: ",",
            //     quoteChar: "\"",
            //     header: true,
            //     worker: true,
            //     complete: function (results) {
            //         document.getElementById("highDimProgressMessage").innerHTML = ('Success!');
            //         data = results.data;
            //         // header = results.meta['fields'].map(String);
            //         // hdCSV(data, header);
            //     }});
            results = Papa.parse(csvData, {fastMode: true, delimiter: ",",
                                        quoteChar: '\v',
                                        error: function(error) {
                                            alert(error.message);
                                        },
                                        step: function (results, parser) {
                                            parser.pause()
                                            if (results.data.length > 0) {
                                                hdAppend(results.data);
                                            }
                                            parser.resume()
                                        },
                                       complete: function(){
                                           document.getElementById("highDimProgressMessage").innerHTML = ('Success!');
                                           updateHD();
                                       }});

        }

        reader.onerror = function() {
            document.getElementById("highDimProgressMessage").innerHTML = ('Failed to upload file.');
            alert('Unable to read ' + file.fileName);
        };
    }
}

// Checks that the browser supports the HTML5 File API
function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
    }
    return isCompatible;
}

function preloadSubmitted() {
    if(document.getElementById('swiss').checked) {
        parseLocalCSV("data/swiss_roll_dataset/swissroll-2Dtsne.csv");
        parseLocalCSVHighDim("data/swiss_roll_dataset/swissroll-features.csv");
    } else if(document.getElementById('fashion').checked) {
        parseLocalCSV("data/fashion_mnist_dataset/fashion-mnist-2Dtsne.csv");
        parseLocalCSVHighDim("data/fashion_mnist_dataset/fashion-mnist-features.csv");
    } else if(document.getElementById('microbiome').checked) {
        parseLocalCSV("data/human_microbiome_dataset/human-microbiome-project-2Dtsne.csv");
        parseLocalCSVHighDim("data/human_microbiome_dataset/human-microbiome-project-features1000.csv")
    } else {
        alert("Please make a selection!");
    }
}

function drawEmbedding(data, classes, path) {
    $('#variables').DataTable().clear().draw();
    quadtree = d3.quadtree()
        .x(d => d.x)
        .y(d => d.y)
        .addAll(data);
    colorsHolder.replaceChildren([]);
    colorPickerID = 0;
    colorMap = {};
    pathHistory = d3.path();
    g.selectAll("circle").remove();
    g.select("path").remove();

    if (classes === []) {
        classes = ["1"];
        data.classes = "1";
    }

    if (path !== undefined) {
        let pathActions = path.split(/(M|L)/).slice(1);
        for (let i = 0; i < pathActions.length; i = i + 2) {
            if (pathActions[i] === "M") {
                let tempCoords = pathActions[i + 1].split(",");
                pathHistory.moveTo(tempCoords[0],tempCoords[1]);
            } else if (pathActions[i] === "L") {
                let tempCoords = pathActions[i + 1].split(",");
                pathHistory.lineTo(tempCoords[0],tempCoords[1]);
            }
        }
    } else {
        pathHistory.moveTo(0,0);
    }

    var label = document.createElement('div');
    label.innerHTML = "<strong>Class colors:</strong>";
    colorsHolder.append(label);

    classes.forEach((x, i) => colorMap[x] = getRandomColor());
    for (const class_ of classes) {
        var docstyle = colorsHolder.style.display;
        if (docstyle == 'none') colorsHolder.style.display = '';

        var text = document.createElement('div');
        text.id = class_;
        text.innerHTML = "<input type='color' value=" + colorMap[class_] + " /> <label for= " + class_ + "> " + class_ + "</label> ";
        text.addEventListener("change", updateColor, false)
        colorsHolder.append(text);
    }

    scaleX = d3.scaleLinear()
        .domain(d3.extent(data, d => +d["x"] * 1.1))
        .range([0, width]);

    scaleY = d3.scaleLinear()
        .domain(d3.extent(data, d => +d["y"] * 1.1))
        .range([0, height]);

    let x = data.map(a => a.x);
    let y = data.map(a => a.y);

    const mapX = x.map((a) => scaleX(a));
    const mapY = y.map((a) => scaleY(a));

    var finalData = mapX.map(function(x, i) {
        return { x: x, y: mapY[i], class: data[i].class, index: i}
    });

    g.selectAll("circle")
        .data(finalData)
        .join("circle")
        .attr("cx", d => d["x"])
        .attr("cy", d => d["y"])
        .attr("r", 2)
        .attr("fill", function (d, i) {
            return colorMap[d["class"]];
        })
        .call(d3.drag()
            .on("start", function dragstarted() {
                d3.select(this).raise();
                g.attr("cursor", "grabbing");
                pathHistory.moveTo(this.getAttribute('cx'), this.getAttribute('cy'))
            })
            .on("drag", function dragged(event, d) {
                pathHistory.lineTo(event.x, event.y);
                line.attr("d", pathHistory.toString())
            })
            .on("end", function dragended() {
                g.attr("cursor", "grab");
            }));

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));

    // appending to the group of points to ensure the
    // line is still drawable with panning and zooming
    line = g.append("path")
        .style("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 2)
        .attr("d", pathHistory.toString());

    //container.removeChild(svg.node());
    container.prepend(svg.node());
}

function updateColor(evt) {
    const class_ = this.id;
    const color = evt.target.value;
    colorMap[class_] = color;
    g.selectAll("circle")
        .attr("fill", function (d) {
            if (d["class"] === class_) {
                return color;
            } else {
                return colorMap[d["class"]];
            }
        })
}

function convertLineToPathHistory(line) {
    pathString = line.toString();
    let coords = pathString.split(/[L|M]/).slice(2);
    return coords.map(function (x) {
        var temp = x.split(",");
        temp = temp.map((x) => parseFloat(x));
        return temp;
    });
}

async function exportPathToClipboard() {
    try {
        await navigator.clipboard.writeText(pathHistory.toString());
        alert("Copied path to clipboard!");
    } catch (error) {
        alert("Error copying path!");
    }
}

function importPath() {
    let text;
    let input = prompt("Please paste your path:", "");
    if (input == null || input == "") {
        alert("No path imported.")
    } else {
        // TO DO: draw path + need error checking
        const classes = [...new Set(embedding.map(item => item.class))];
        drawEmbedding(embedding, classes, input)
    }
}

function updateHD() {
    dimensionLabels = hd.shift();
    for (let i = 0; i < hd.length; i++) {
        hd[i] = hd[i].map(Number);
    }
}

function computeFFT() {
    $('#variables').DataTable().clear().draw();
    let bin_num = Math.pow(2, bin_num_slider.value);
    fftobj = new FFTNayuki(bin_num);
    let formattedPath = convertLineToPathHistory(pathHistory);
    let smoothed = smoothedPath(formattedPath, bin_num);
    for (let i=0; i<hd[0].length; i++) { // for the number of features
        variables[i] = new Array(bin_num).fill(0); // let variables have #features rows, with each row having bin_num columns
    }

    // convert from screen coordinates to domain coordinates

    // find the closest point
    let indexes = [];
    for (let i = 0; i < smoothed.length; i++) {
        let x = scaleX.invert(smoothed[i][0]);
        let y = scaleY.invert(smoothed[i][1]);
        let closestDatum = quadtree.find(x, y);
        let index = embedding.findIndex(p => (p.x === closestDatum.x && p.y === closestDatum.y));
        indexes.push(index);
    }

    g.selectAll('circle').each(function(d){
        if (indexes.includes(d.index)) {
            d.nn = true;
        }
    }).attr('stroke', function(d){
        return d.nn ? 'black' : 'none';
    })

    for (let j=0; j<bin_num; j++) { // for each column
        var back_projected_point = hd[indexes[j] - 1];
        for (var i=0; i<variables.length; i++) { // for each row
            variables[i][j] = back_projected_point[i]; //fix the column, and move down row-by-row, updating the entire column with timepoint i
        }
    }

    var fourier_mags = [];
    computeFourier(fourier_mags, variables, bin_num);
    fidx = sortIndex(fourier_mags);
    let fourierSorted = [];
    for (var i=0; i<fidx.length; i++) {
        fourierSorted.push(fourier_mags[fidx[i]]);
    }

    var table = $('#variables').DataTable();// top 10
    for (let i=0; i<Math.min(fidx.length, 10); i++) {
        v = variables[fidx[i]];
        lbl = dimensionLabels[fidx[i]];
        insertVariable(i, color_picker(lbl), lbl, fourier_mags[fidx[i]]);
    }
    table.rows().select();
    for (let i=10; i<Math.min(fidx.length, 100); i++) {
        v = variables[fidx[i]];
        lbl = dimensionLabels[fidx[i]];
        insertVariable(i, color_picker(lbl), lbl, fourier_mags[fidx[i]]);
    }
}

function computeAutocorr() {
    let lag = lag_slider.value;
    let bin_num = bin_num_slider2.value;
    $('#variables').DataTable().clear().draw();
    let formattedPath = convertLineToPathHistory(pathHistory);
    let smoothed = smoothedPath(formattedPath, bin_num);
    for (let i=0; i<hd[0].length; i++) { // for the number of features
        variables[i] = new Array(bin_num).fill(0); // let variables have #features rows, with each row having bin_num columns
    }

    // find the closest point
    let indexes = [];
    for (let i = 0; i < smoothed.length; i++) {
        let x = scaleX.invert(smoothed[i][0]);
        let y = scaleY.invert(smoothed[i][1]);
        let closestDatum = quadtree.find(x, y);
        let index = embedding.findIndex(p => (p.x === closestDatum.x && p.y === closestDatum.y));
        indexes.push(index);
    }

    g.selectAll('circle').each(function(d){
        if (indexes.includes(d.index)) {
            d.nn = true;
        }
    }).attr('stroke', function(d){
        return d.nn ? 'black' : 'none';
    })

    for (let j=0; j<bin_num; j++) { // for each column
        var back_projected_point = hd[indexes[j]];
        for (var i=0; i<variables.length; i++) { // for each row
            variables[i][j] = back_projected_point[i]; //fix the column, and move down row-by-row, updating the entire column with timepoint i
        }
    }

    var autocorr_mags = [];
    for (let l=0; l<variables.length; l++) {
        var dim = variables[l];
        var total = 0;
        for(let i = 0; i < dim.length; i++) {
            total += dim[i];
        }
        var mean = total / dim.length;
        var autocorrelations = [];

        for (var j = 1; j < lag; j++) { //compute autocorrelation with this lag
            var lag_difference = 0 ;
            var difference = 0;
            for (var i = j; i < dim.length; i++) {
                lag_difference += (dim[i] - mean) * (dim[i - j] - mean)**2;
            }
            for (var i = 0; i < dim.length; i++) {
                difference += (dim[i] - mean)**2;
            }

            if (difference === 0) {
                var current_autocorrelation = 0;
            } else {
                var current_autocorrelation = lag_difference / difference;
            }
            autocorrelations.push(current_autocorrelation);
        }
        autocorr_mags.push(Math.max.apply(null, autocorrelations));
    }

    fidx = sortIndex(autocorr_mags);

    var autoSorted = [];
    for (var i=0; i<fidx.length; i++) {
        autoSorted.push(autocorr_mags[fidx[i]]);
    }

    var table = $('#variables').DataTable();// top 10
    for (let i=0; i<Math.min(fidx.length, 10); i++) {
        v = variables[fidx[i]];
        lbl = dimensionLabels[fidx[i]];
        insertVariable(i, color_picker(lbl), lbl, autocorr_mags[fidx[i]]);
    }
    table.rows().select();
    for (let i=10; i<Math.min(fidx.length, 100); i++) {
        v = variables[fidx[i]];
        lbl = dimensionLabels[fidx[i]];
        insertVariable(i, color_picker(lbl), lbl, autocorr_mags[fidx[i]]);
    }
}

function insertVariable(i, color, label, fft_mag) {
    var table = $('#variables').DataTable();
    table.row.add( {"ids": i, "color": color, "label": label, "fft": fft_mag.toFixed(5)}).draw();
}

function smoothedPath(ph, n) {
    // Takes a 2D path history and smooths it out to ensure that distance between adjacent points is approximately equal
    // It smooths the path by increasing the number of sample points, so that each sample point is evenly spaced
    // ph has 2 columns (one for X coord and one for Y coord) and its number of rows is the number of points
    // Returns a vector of n evenly spaced points from the smoothed path
    var pX, pY, cX, cY, dX, dY, dist = 0;
    var smoothed = [];
    var ans = new Array(n);
    if (ph.length < 2) {//if path history has less than 2 points, simply return it
        return ph;
    } else {
        smoothed.push(ph[0]);
        for (let i=1; i<ph.length; i++) {
            pX = ph[i-1][0];  // prev X coord
            pY = ph[i-1][1];  // prev Y coord
            cX = ph[i][0];    // current X coord
            cY = ph[i][1];    // current Y coord
            dX = cX - pX;     // diff in X coord between prev and current
            dY = cY - pY;     // diff in Y coord between prev and current
            dist = Math.sqrt(dX*dX + dY*dY); // dist between prev and current point (a^2 + b^2 = c^2)
            //for (var t=0; t<dist*16; t++) {
            // Normalized unit steps
            ndX = dX / dist;
            ndY = dY / dist;
            var t=0;
            while (t < dist) {
                // Interpolation
                // Starting from prev point, repeatedly add the normalized unit steps until
                // we are just behind the current point (as we will start from the current point
                // on the next iteration anyway)
                smoothed.push([Math.floor(pX + ndX*t), Math.floor(pY + ndY*t)]);
                t++;
            }
        }
        var l = smoothed.length;// number of points in our smoothed path
        for (var i=0; i<n; i++) { // ensure that final answer only has n samples
            ans[i] = smoothed[Math.floor(i*l/n)]; // choose evenly spaced samples from smoothed into our final answer
        }
        return ans;
    }
}

function computeFourier(fourier_mags, variables, bins) {
    // Modifies fourier_mags in place by appending to it
    computeFourierLim(fourier_mags, variables, bins, 0);
    if (fourier_mags.length < variables.length) {
        setTimeout(function() {computeFourier(fourier_mags, variables, bins);}, 0);
    }
}

function computeFourierLim(fourier_mags, variables, bins, max_iterations) {
    // Modifies fourier_mags in place by appending to it
    var vec_imag = new Array(bins);
    var end_it = null;
    if (max_iterations == 0) {
        end_it = variables.length;
    } else {
        end_it = Math.min(variables.length, fourier_mags.length + max_iterations);
    }
    for (var i=fourier_mags.length; i<end_it; i++) {
        for (var j=0; j<bins; j++) {
            vec_imag[j] = 0;
        }
        var arr = variables[i].slice();
        fftobj.forward(arr, vec_imag);
        for (var j=0; j<bins; j++) {
            arr[j] = Math.sqrt((arr[j]*arr[j] + vec_imag[j]*vec_imag[j])/bins);
        }
        arr[0] = 0; // Remove the constant component
        var norm_arr = normalize_vector(arr);

        var weighted_mag = 0;
        for (var j=1; j<bins; j++) {
            //weighted_mag += norm_arr[j]/Math.pow(2,j);
            //weighted_mag += norm_arr[j]/j;
            weighted_mag += norm_arr[j]/j;
        }
        fourier_mags.push(weighted_mag);
    }
}

function normalize_vector(X) {
    // Causes the norm of the vector to be 1, unless it was 0 to begin with
    var X2 = X.map((a) => Math.abs(a));
    var sum = X2.reduce((a, b) => a+b,0);
    //var norm = Math.sqrt(sum);
    var norm = sum;
    //return normalized = X.map(function(x) {return x/sum});
    if (norm > 0) {
        return normalized = X.map(function(x) {return x/norm});
    } else {
        return X;
    }
}

function sortIndex(arr) {
    // Get sort indices
    len = arr.length;
    var indices = new Array(len);
    for (var i=0; i<len; i++) indices[i] = i;//0 1 2 ... len
    indices.sort(function (a,b) {
        if (isNaN(arr[a]) && isNaN(arr[b])) return 0;
        if (isNaN(arr[a])) return 1;
        if (isNaN(arr[b])) return -1;
        return arr[a] > arr[b] ? -1 : arr[a] < arr[b] ? 1 : 0;
        // if arr[a] > arr[b], then return -1
        // else if arr[a] < arr[b], then return 1
        // else return 0
    });
    return indices;// return indices in
}

function updateVizParams() {
    g.selectAll('circle')
        .attr("r", point_size_slider.value/10)
        .attr("fill-opacity", opacity_slider.value/100);

    g.select("path")
        .attr("stroke-width", line_width_slider.value/10)
}

function reset() {
    g.select("path").remove();

    pathHistory = d3.path();
    //pathHistory.moveTo(0,0);

    line = g.append("path")
        .style("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 2)
        .attr("d", pathHistory.toString());

    g.selectAll('circle').each(function(d){
        d.nn = false;
    }).attr('stroke', function(d){
        return d.nn ? 'black' : 'none';
    });

    // g.selectAll('circle')
    //     .attr("r", 2)
    //     .attr("fill-opacity", 1);
    // drawEmbedding(embedding, classes2D);
}

