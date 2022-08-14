var labelsDict = {};
$(document).ready(function() {

// The event listener for the file upload
document.getElementById('txtFileUpload').addEventListener('change', upload, false);
document.getElementById('txtFileUpload2').addEventListener('change', upload2, false);

// Method that checks that the browser supports the HTML5 File API
function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
    isCompatible = true;
    }
    return isCompatible;
}

var datarows_num = 0;
descriptions_array = [];
var firstX;
var firstY;

// Method that reads and processes the selected file
function upload(evt) {
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
    } else {
        var data = null;
        var res = null;
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onprogress = function(event) {
            document.getElementById("fmessage1").innerHTML = ('...Importing...');
            var progressNode = document.getElementById("progress1");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            erase();
            document.getElementById("fmessage1").innerHTML = ('...Importing...');
            
            reset();
            var csvData = event.target.result;
            //data = $.csv.toArrays(csvData);
            res = Papa.parse(csvData, {skipEmptyLines: true, delimiter: ","});
            data = res.data;
            if (data && data.length > 0) {
                if (data.length < 120001) {
                    document.getElementById("fmessage1").innerHTML = ('<span style="color:red">Import failed. Check file format and headers.</span>');
                    head = checkHeadersEmbeddingFile(data);
                    // if ((head[0] == -1) || (head[1] == -1)) {
                    //     document.getElementById("fmessage1").innerHTML = ('<span style="color:red">Import failed. Missing headers for "X" and "Y".</span>');
                    //     throw 'Missing headers for "X" and "Y" columns';
                    // }
                    var parsed_embedding = parseEmbeddingFile(data);
                    firstX = parsed_embedding[4];
                    firstY = parsed_embedding[5];
                    drawEmbedding(canvas, parsed_embedding[4], parsed_embedding[5], parsed_embedding[6]);
                    // SAVE TO GLOBAL DICT
                    descriptions_array = parsed_embedding[7];
                    datarows_num = data.length - 1;
                    if (parsed_embedding[2] > -1) {
                        if (parsed_embedding[3] > -1) {
                            document.getElementById("fmessage1").innerHTML = ('<span style="color:green">Imported ' + descriptions_array.length + ' rows with class and desc fields successfully</span>');
                        } else {
                            document.getElementById("fmessage1").innerHTML = ('<span style="color:green">Imported ' + descriptions_array.length + ' rows with class field (but no desc field) successfully</span>');
                        }
                    } else {
                        if (parsed_embedding[3] > -1) {
                            document.getElementById("fmessage1").innerHTML = ('<span style="color:green">Imported ' + descriptions_array.length + ' rows with desc field (but no class field) successfully</span>');
                        } else {
                            document.getElementById("fmessage1").innerHTML = ('<span style="color:green">Imported ' + descriptions_array.length + ' rows successfully (but with no class or desc fields)</span>');
                        }
                    }
                    document.getElementById("progress1").value = document.getElementById("progress1").max;
                    canvasData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
                    canvasDataWithPath = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
                    // Display labels on left of canvas
                    var labels = listLabels(parsed_embedding[8]);
                    var label_text = "<strong>Labels (if any)</strong><hr />";
                    for (var i=0; i<labels.length; i++) {
                        label_text += '<span style="color: ' + color_picker(labels[i]) + '">' + labels[i] + '</span><br />';
                    }
                    label_text += "";
                    document.getElementById("labels").innerHTML = label_text;
                }
                else {
                    document.getElementById("fmessage1").innerHTML = ('Too many rows to import!');
                    alert('Maximum call stack exceeded. Cannot import more than 120,000 rows');
                }
            } else {
                alert('No data to import!');
            }
        };
        reader.onerror = function() {
            alert('Unable to read ' + file.fileName);
        };
    }
}
function upload2(evt) {
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
    } else {
        var data = null;
        var res = null;
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onprogress = function(event) {
            document.getElementById("fmessage2").innerHTML = ('...Importing...');
            var progressNode = document.getElementById("progress2");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            reset();
            highDimensions = null;
            variables = [];
            document.getElementById("fmessage2").innerHTML = ('...Importing...');
            var csvData = event.target.result;
            //data = $.csv.toArrays(csvData);
            res = Papa.parse(csvData, {fastMode: true, skipEmptyLines: true, quoteChar: '\v', delimiter: ","});
            data = res.data;
            if (data && data.length > 0) {
                if (datarows_num === data.length-1) {
                    document.getElementById("fmessage2").innerHTML = ('<span style="color:green">Imported header + ' + (data.length-1) + ' data rows successfully (with ' +  data[0].length  +  ' fields each)</span>');
                    document.getElementById("progress2").value = document.getElementById("progress2").max;
                    setHighDimensions(data);
                } else {
                    document.getElementById("fmessage2").innerHTML = ('<span style="color:red">Header assumed. Remaining ' + (data.length - 1) + ' rows found do  not match ' + datarows_num + ' rows in 2D embedding CSV. Check that you have the right files and file format.</span>');
                }
            } else {
                alert('No data to import!');
            }
        };
        reader.onerror = function() {
            alert('Unable to read ' + file.fileName);
        };
    }
}
var uploader = document.getElementById('txtFileUpload3');
uploader.addEventListener("change", function (evt) {
    var selector = document.getElementById('label_selector');
    var newLabel = document.createElement("option")
    newLabel.value = uploader.value.replace(/.*[\/\\]/, '');
    newLabel.innerHTML = uploader.value.replace(/.*[\/\\]/, '');
    selector.options.add(newLabel);
    // read file and save colors
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
    } else {
        var data = null;
        var res = null;
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onprogress = function(event) {
            document.getElementById("fmessage3").innerHTML = ('...Importing...');
            var progressNode = document.getElementById("progress3");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            erase();
            document.getElementById("fmessage3").innerHTML = ('...Importing...');
            reset();
            var csvData = event.target.result;
            //data = $.csv.toArrays(csvData);
            res = Papa.parse(csvData, {skipEmptyLines: true, delimiter: ","});
            data = res.data;
            if (data && data.length > 0) {
                if (data.length < 120001) {
                    //document.getElementById("fmessage3").innerHTML = ('<span style="color:red">Import failed. Check file format and headers.</span>');
                    
                    var parsed_embedding = parseEmbeddingFile(data);
                    drawEmbedding(canvas, parsed_embedding[4], parsed_embedding[5], parsed_embedding[6]);
                    
                    descriptions_array = parsed_embedding[7];
                    datarows_num = data.length - 1;
                    // SAVE TO GLOBAL DICT
                    labelsDict[uploader.value.replace(/.*[\/\\]/, '')] = parsed_embedding;
                    console.log("Labels dict BEFORE", labelsDict);
                    document.getElementById("progress3").value = document.getElementById("progress1").max;
                    canvasData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
                    canvasDataWithPath = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
                    // Display labels on left of canvas
                    var labels = listLabels(parsed_embedding[8]);
                    var label_text = "<strong>Labels (if any)</strong><hr />";
                    for (var i=0; i<labels.length; i++) {
                        label_text += '<span style="color: ' + color_picker(labels[i]) + '">' + labels[i] + '</span><br />';
                    }
                    label_text += "";
                    document.getElementById("labels").innerHTML = label_text;
                }
                else {
                    document.getElementById("fmessage3").innerHTML = ('Too many rows to import!');
                    alert('Maximum call stack exceeded. Cannot import more than 120,000 rows');
                }
            } else {
                alert('No data to import!');
            }
        };
        reader.onerror = function() {
            alert('Unable to read ' + file.fileName);
        };
    }
    console.log("Labels dict AFTER", labelsDict);
}, false);

var labelSelector = document.getElementById("label_selector");
labelSelector.addEventListener("change", function () {
    var selectedText = labelSelector.options[labelSelector.selectedIndex].text;
    console.log("Choosing label: selectedIndex", labelSelector.selectedIndex);
    console.log("Choosing label: selectedText", selectedText);
    var X = labelsDict[selectedText][4];
    var Y = labelsDict[selectedText][5];
    var C = labelsDict[selectedText][6];
    var D = labelsDict[selectedText][7];
    erase();
    drawEmbedding(canvas, X, Y, C);
    descriptions_array = D;
    canvasData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    canvasDataWithPath = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    // Display labels on left of canvas
    var labels = listLabels(labelsDict[selectedText][8]);
    var label_text = "<strong>Labels (if any)</strong><hr />";
    for (var i=0; i<labels.length; i++) {
        label_text += '<span style="color: ' + color_picker(labels[i]) + '">' + labels[i] + '</span><br />';
    }
    label_text += "";
    document.getElementById("labels").innerHTML = label_text;

    console.log("Choosing label: colors", C);
});


});


var isFileDetailsSubmitted = false;
var x_name = null;
var y_name = null;
var class_name = null;
var desc_name = null;
var ignored_col = null;
var ignored_row = null;

// Canvas code
var canvas, ctx, flag, canvasData = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    width = 0,
    height = 0;

var highDimensions = null;
var dimensionLabels = null;

function setHighDimensions(hd) {
    // Read header line first
    highDimensions = [];
    dimensionLabels = hd[0];
    numDim = hd[0].length;
    var tempRow = null;
    
    if (isFileDetailsSubmitted !== false && ignored_col !== "") {
        var ignored_col_ind = ignored_col.trim().split(',');
        var tempHeader = hd[0];
        for (var col=ignored_col_ind.length-1; col>=0; col--) {
            tempHeader.splice(ignored_col_ind[col], 1);
        }
        dimensionLabels = tempHeader;
        console.log("indexes to remove", ignored_col_ind);
        for (var row=1; row<hd.length; row++) {
            tempRow = hd[row];
            console.log("original tempRow:", tempRow);
            for (var col=ignored_col_ind.length-1; col>=0; col--) {
                tempRow.splice(ignored_col_ind[col], 1);
            }
            highDimensions.push(tempRow.map(Number));
            console.log("spliced tempRow:", tempRow);
        }
    } else {
        for (var i=1; i<hd.length; i++) {
            highDimensions.push(hd[i].map(Number));
        }
    }
}

function neighborList(x, y) {
    // Gives the nearest neighbors (according to list index) to a data point
    var shell = [];
    var radius = 0;
    var list = [];
    while (list.length < 1 && radius < 50) {
        shell = neighbor_shell(x, y, radius++);
        for (var i = 0; i < shell.length; i++) {
            //arr is either [] or [some_int]
            arr = occupancyArray[shell[i][0]][shell[i][1]];//index of that point in the original data set
            if (arr.length > 0) { // arr.length only equals 0 if that pixel is empty
                for (var j=0; j<arr.length; j++) {
                    list.push(arr[j]); // add to list of nearest neighbours in 2D embedding
                }
            }
        }
    }
    return list;
}

function avgValue(x, y) {
    var list = neighborList(x, y);
    // Gives a higher dimensional space
    if (list.length < 1 || highDimensions.length < 1) {
        return new Array(highDimensions.length).fill(0);
    }
    //highDimensions[list[0]].length is the number of nearest neighbours
    var vec_sum = Array(highDimensions[list[0]].length);
    for (var i=0; i<vec_sum.length; i++) {
        vec_sum[i]=0; //initialize vector sum to 0s 
    }

    var vec = Array(highDimensions[list[0]].length);
    if (list.length>1) {
        for (var i = 0; i < list.length; i++) {
            curr_vec = highDimensions[list[i]];//grabs a row from data set
            for (var j=0; j<vec_sum.length; j++) {
                vec_sum[j] += curr_vec[j];//get the average of all the original nearest neighbours
            }
        }
        for (var j=0; j<vec.length; j++) {
            vec[j] = vec_sum[j]/list.length;
        }
    } else {
        vec = highDimensions[list[0]];
    }
    return vec;
}

function init() {
    canvas = document.getElementById('can');
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    canvasData = ctx.getImageData(0, 0, width, height);
    canvasDataWithPath = ctx.getImageData(0, 0, width, height);

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e)
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);


    blankOccupancyArray();

    canvas2 = document.getElementById('can2');
    ctx2 = canvas2.getContext("2d");
    canvas2Data = ctx2.getImageData(0, 0, width, height);

    canvas2.addEventListener("mousemove", function (e) {
        findxy2('move', e)
    }, false);
    canvas2.addEventListener("mouseout", function (e) {
        findxy2('out', e)
    }, false);
}

var path_history = [];
function pathPush(X,Y) {
    path_history.push([X, Y]);
    document.getElementById("points").value += [X,Y] + "\n";
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
        for (var i=1; i<ph.length; i++) {
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

var xval = 0;
function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    pathPush(currX, currY);
    canvasDataWithPath = ctx.getImageData(0, 0, width, height);
}

function drawPath(canvas, path_history) {
    ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(path_history[0][0],path_history[0][1]);
    for (var i=1; i<path_history.length; i++) {
        pt = path_history[i];
        ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
    ctx.closePath();
    canvasDataWithPath = ctx.getImageData(0, 0, width, height);
}

function erase() {
    //var m = confirm("Want to clear");
    var m = true;
    if (m) {
        reset();
        ctx.clearRect(0, 0, width, height);
        canvasData = ctx.getImageData(0, 0, width, height);
        blankOccupancyArray();
        // document.getElementById("txtFileUpload2").value = '';
        // document.getElementById("progress2").value = 0;
        // document.getElementById("fmessage2").innerHTML = ('');
        // highDimensions = null;
        // variables =[];
    }
}

function reset() {
    //var m = confirm("Want to reset");
    if (true) {
        ctx.putImageData(canvasData, 0, 0);
        canvasDataWithPath = ctx.getImageData(0, 0, width, height);
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        canvas2Data = ctx2.getImageData(0, 0, width, height);
        xval = 0;
        path_history = [];
        document.getElementById("fft_progress").value=0;
        document.getElementById("points").value="";
        $('#variables').DataTable().clear().draw();
        smoothed = [];
        for (var i=0; i<512; i++) {
            smoothed.push([0,0]);
        }
        document.getElementById("fft_error").innerHTML = ('');
    }
}

function findxy(res, e) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.pageX - canvas.offsetLeft - 2; // Subtract out border pixels
        currY = e.pageY - canvas.offsetTop - 2;

        flag = true;
    }
    if (res == 'up' || res == "out") {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.pageX - canvas.offsetLeft - 2;
            currY = e.pageY - canvas.offsetTop - 2;
            draw();
        }
        if (descriptions_array.length > 0) {
            var hoverX = e.pageX - canvas.offsetLeft - 2;
            var hoverY = e.pageY - canvas.offsetTop - 2;
            neighbors = neighborList(hoverX, hoverY);
            putDesc(neighbors[0]);
        }
    }
}

function findxy2(res, e) {
    if (res == 'move') {
        currX = e.pageX - canvas2.offsetLeft - 2; // Subtract out border pixels
        currY = e.pageY - canvas2.offsetTop - 2;
        drawguidelines(currX, currY);
    }
    if (res == "out") {
        ctx.putImageData(canvasDataWithPath, 0, 0);
        ctx2.putImageData(canvas2Data, 0, 0);
    }
}

// puts guidelines on the first canvas based
function drawguidelines(x) {
    x1 = smoothed[x][0];
    y1 = smoothed[x][1];
    ctx.putImageData(canvasDataWithPath, 0, 0);
    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x1, canvas.height);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.moveTo(0, y1);
    ctx.lineTo(canvas.width, y1);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx2.putImageData(canvas2Data, 0, 0);
    ctx2.beginPath();
    ctx2.moveTo(x, 0);
    ctx2.lineTo(x, canvas.height);
    ctx2.strokeStyle = "grey";
    ctx2.lineWidth = 1;
    ctx2.stroke();

    if (descriptions_array.length > 0) {
        neighbors = neighborList(x1, y1);
        putDesc(neighbors[0]);
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

function computeFourier(fourier_mags, variables, bins, progressNode) {
    // Modifies fourier_mags in place by appending to it
    progressNode.max = variables.length;
    computeFourierLim(fourier_mags, variables, bins, 0);
    if (fourier_mags.length < variables.length) {
        setTimeout(function() {computeFourier(fourier_mags, variables, bins, progressNode);}, 0);
    } 
    progressNode.value = fourier_mags.length;
}

// Initialize smoothed to 0-array of 512 rows and 2 columns
var smoothed = [];
for (var i=0; i<512; i++) {
    smoothed.push([0,0]);
}
var var_call = false;
var FFT_call = false;
var auto_call = false;
var variables = new Array();
function fft_call() {
    var_call = false;
    FFT_call = true;
    if (highDimensions === null) {
        document.getElementById("fft_error").innerHTML = ('<span style="color:red">Features not properly loaded.</span>');
    } else {
        document.getElementById("fft_error").innerHTML = ('');
    }
    $('#variables').DataTable().clear().draw();
    var progressNode = document.getElementById("fft_progress");
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    bin_num = 512;// we will have 512 points, chosen from the smoothed path
    fftobj = new FFTNayuki(bin_num);
    smoothed = smoothedPath(path_history, bin_num);

    for (var i=0; i<highDimensions[0].length; i++) { // for the number of features
        variables[i] = new Array(bin_num).fill(0); // let variables have #features rows, with each row having bin_num columns
    }
    for (var j=0; j<bin_num; j++) { // for each column
        var timepoint = avgValue(smoothed[j][0], smoothed[j][1]); // update for each of the 512 columns
        // timepoint is the back-projected point from the smoothed point
        for (var i=0; i<variables.length; i++) { // for each row
            variables[i][j] = timepoint[i]; //fix the column, and move down row-by-row, updating the entire column with timepoint i
        }
    }
    /*                  Sample 1    Sample 2    Sample 3
        Dimension 1        *            *           *
        Dimension 2        *            *           *
        Dimension 3        *            *           *

        where each column contains the back-projected point
     */
    console.log("Variables in FFT; ", variables);
    var fourier_mags = [];
    computeFourier(fourier_mags, variables, bin_num, progressNode);
    console.log("Untouched Fourier mags:", fourier_mags)

    fidx = sortIndex(fourier_mags);
    // gives indexes of elements sorted in descending order
    console.log("SortIndex results:", fidx)
    
    var fourierSorted = [];
    for (var i=0; i<fidx.length; i++) {
        fourierSorted.push(fourier_mags[fidx[i]]);
    }
    // sorted fourier magnitudes

    // from https://personal.sron.nl/~pault/

    var table = $('#variables').DataTable();// top 8 
    for (var i=0; i<Math.min(fidx.length, 8); i++) {
        v = variables[fidx[i]];
        lbl = dimensionLabels[fidx[i]];
        insertVariable(i, color_picker(lbl), lbl, fourier_mags[fidx[i]]);
    }
    table.rows().select();
    for (var i=8; i<Math.min(fidx.length, 100); i++) {
        v = variables[fidx[i]];
        lbl = dimensionLabels[fidx[i]];
        insertVariable(i, color_picker(lbl), lbl, fourier_mags[fidx[i]]);
    }
}

function variance_call() {
    var_call = true;
    FFT_call = false;
    if (highDimensions === null) {
        document.getElementById("fft_error").innerHTML = ('<span style="color:red">Features not properly loaded.</span>');
    } else {
        document.getElementById("fft_error").innerHTML = ('');
    }
    $('#variables').DataTable().clear().draw();
    var progressNode = document.getElementById("fft_progress");
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    bin_num = 512;// we will have 512 points, chosen from the smoothed path
    fftobj = new FFTNayuki(bin_num);
    smoothed = smoothedPath(path_history, bin_num);

    for (var i=0; i<highDimensions[0].length; i++) { // for the number of features
        variables[i] = new Array(bin_num).fill(0); // let variables have #features rows, with each row having bin_num columns
    }
    for (var j=0; j<bin_num; j++) { // for each column
        var timepoint = avgValue(smoothed[j][0], smoothed[j][1]); // update for each of the 512 columns
        // timepoint is the back-projected point from the smoothed point
        for (var i=0; i<variables.length; i++) { // for each row (ie., number of features)
            variables[i][j] = timepoint[i]; //fix the column, and move down row-by-row, updating the entire column with timepoint i
        }
    }
    progressNode.max = variables.length;
    /* variables:
                     Sample 1    Sample 2    Sample 3
        Dimension 1        *            *           *
        Dimension 2        *            *           *
        Dimension 3        *            *           *

        where each column contains the back-projected point
     */
    console.log("Variables in Variance; ", variables);
    progressNode.value = 0;
    var variance_mags = [];
    for (var l=0; l<variables.length; l++) {
        var dim = variables[l];
        var total = 0;
        
        for(var i = 0; i < dim.length; i++) {
            total += dim[i];
        }
        var avg = total / dim.length;
        
        var variance = 0;
        for (var i = 0; i < dim.length; i++) {
            variance += ((dim[i] - avg) ** 2);
        }
        variance = variance / (dim.length - 1);
        variance_mags.push(variance);
        progressNode.value = variance_mags.length;
    }
    console.log("Variance Mags: ", variance_mags);
    
    /*var fourier_mags = [];
    computeFourier(fourier_mags, variables, bin_num, progressNode);
    console.log("Untouched Fourier mags:", fourier_mags)
     */

    vidx = sortIndex(variance_mags);
    // gives indexes of elements sorted in descending order
    console.log("SortIndex results:", vidx)

    var varianceSorted = [];
    for (var i=0; i<vidx.length; i++) {
        varianceSorted.push(variance_mags[vidx[i]]);
    }

    var table = $('#variables').DataTable();// top 8 
    for (var i=0; i<Math.min(vidx.length, 8); i++) {
        v = variables[vidx[i]];
        lbl = dimensionLabels[vidx[i]];
        insertVariable(i, color_picker(lbl), lbl, variance_mags[vidx[i]]);
    }
    table.rows().select();
    for (var i=8; i<Math.min(vidx.length, 100); i++) {
        v = variables[vidx[i]];
        lbl = dimensionLabels[vidx[i]];
        insertVariable(i, color_picker(lbl), lbl, variance_mags[vidx[i]]);
    }
}

function autocorr_call() {
    auto_call = true;
    var_call = false;
    FFT_call = false;
    if (highDimensions === null) {
        document.getElementById("fft_error").innerHTML = ('<span style="color:red">Features not properly loaded.</span>');
    } else {
        document.getElementById("fft_error").innerHTML = ('');
    }
    $('#variables').DataTable().clear().draw();
    var progressNode = document.getElementById("fft_progress");
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    bin_num = 512;// we will have 512 points, chosen from the smoothed path
    fftobj = new FFTNayuki(bin_num);
    smoothed = smoothedPath(path_history, bin_num);

    for (var i=0; i<highDimensions[0].length; i++) { // for the number of features
        variables[i] = new Array(bin_num).fill(0); // let variables have #features rows, with each row having bin_num columns
    }
    for (var j=0; j<bin_num; j++) { // for each column
        var timepoint = avgValue(smoothed[j][0], smoothed[j][1]); // update for each of the 512 columns
        // timepoint is the back-projected point from the smoothed point
        for (var i=0; i<variables.length; i++) { // for each row (ie., number of features)
            variables[i][j] = timepoint[i]; //fix the column, and move down row-by-row, updating the entire column with timepoint i
        }
    }
    progressNode.max = variables.length;
    /* variables:
                     Sample 1    Sample 2    Sample 3
        Dimension 1        *            *           *
        Dimension 2        *            *           *
        Dimension 3        *            *           *

        where each column contains the back-projected point
     */
    console.log("Variables in Variance; ", variables);

    /*
    Below, we compute the auto-correlation of each dimension with lag values
    up to 22 (as 22^2 < 500). 
     */
    progressNode.value = 0;
    var autocorr_mags = [];
    for (var l=0; l<variables.length; l++) {
        var dim = variables[l];
        var total = 0;

        for(var i = 0; i < dim.length; i++) {
            total += dim[i];
        }
        var mean = total / dim.length;
        
        var autocorrelations = [];
        for (var lag = 1; lag < 23; lag++) { //compute autocorrelation with this lag
            var lag_difference = 0 ;
            var difference = 0;
            for (var i = lag; i < dim.length; i++) {
                lag_difference += (dim[i] - mean) * (dim[i - lag] - mean)**2;
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
        progressNode.value = autocorr_mags.length;
    }
    console.log("Autocorr Mags: ", autocorr_mags);

    /*var fourier_mags = [];
    computeFourier(fourier_mags, variables, bin_num, progressNode);
    console.log("Untouched Fourier mags:", fourier_mags)
     */

    aidx = sortIndex(autocorr_mags);
    // gives indexes of elements sorted in descending order
    console.log("SortIndex results:", aidx)

    var autoSorted = [];
    for (var i=0; i<aidx.length; i++) {
        autoSorted.push(autocorr_mags[aidx[i]]);
    }

    var table = $('#variables').DataTable();// top 8 
    for (var i=0; i<Math.min(aidx.length, 8); i++) {
        v = variables[aidx[i]];
        lbl = dimensionLabels[aidx[i]];
        insertVariable(i, color_picker(lbl), lbl, autocorr_mags[aidx[i]]);
    }
    table.rows().select();
    for (var i=8; i<Math.min(aidx.length, 100); i++) {
        v = variables[aidx[i]];
        lbl = dimensionLabels[aidx[i]];
        insertVariable(i, color_picker(lbl), lbl, autocorr_mags[aidx[i]]);
    }
}

function sparse_linear() {
    auto_call = true;
    var_call = false;
    FFT_call = false;
    if (highDimensions === null) {
        document.getElementById("fft_error").innerHTML = ('<span style="color:red">Features not properly loaded.</span>');
    } else {
        document.getElementById("fft_error").innerHTML = ('');
    }
    $('#variables').DataTable().clear().draw();
    var progressNode = document.getElementById("fft_progress");
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    bin_num = 512;// we will have 512 points, chosen from the smoothed path
    fftobj = new FFTNayuki(bin_num);
    smoothed = smoothedPath(path_history, bin_num);

    for (var i=0; i<highDimensions[0].length; i++) { // for the number of features
        variables[i] = new Array(bin_num).fill(0); // let variables have #features rows, with each row having bin_num columns
    }
    for (var j=0; j<bin_num; j++) { // for each column
        var timepoint = avgValue(smoothed[j][0], smoothed[j][1]); // update for each of the 512 columns
        // timepoint is the back-projected point from the smoothed point
        for (var i=0; i<variables.length; i++) { // for each row (ie., number of features)
            variables[i][j] = timepoint[i]; //fix the column, and move down row-by-row, updating the entire column with timepoint i
        }
    }
    progressNode.max = variables.length;
    /* variables:
                     Sample 1    Sample 2    Sample 3
        Dimension 1        *            *           *
        Dimension 2        *            *           *
        Dimension 3        *            *           *

        where each column contains the back-projected point
     */
    console.log("Variables in Variance; ", variables);

    /*
    Below, we compute the auto-correlation of each dimension with lag values
    up to 22 (as 22^2 < 500).
     */
    progressNode.value = 0;
    var autocorr_mags = [];
    for (var l=0; l<variables.length; l++) {
        var dim = variables[l];
        var total = 0;

        for(var i = 0; i < dim.length; i++) {
            total += dim[i];
        }
        var mean = total / dim.length;

        var autocorrelations = [];
        for (var lag = 1; lag < 23; lag++) { //compute autocorrelation with this lag
            var lag_difference = 0 ;
            var difference = 0;
            for (var i = lag; i < dim.length; i++) {
                lag_difference += (dim[i] - mean) * (dim[i - lag] - mean)**2;
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
        progressNode.value = autocorr_mags.length;
    }
    console.log("Autocorr Mags: ", autocorr_mags);

    /*var fourier_mags = [];
    computeFourier(fourier_mags, variables, bin_num, progressNode);
    console.log("Untouched Fourier mags:", fourier_mags)
     */

    aidx = sortIndex(autocorr_mags);
    // gives indexes of elements sorted in descending order
    console.log("SortIndex results:", aidx)

    var autoSorted = [];
    for (var i=0; i<aidx.length; i++) {
        autoSorted.push(autocorr_mags[aidx[i]]);
    }

    var table = $('#variables').DataTable();// top 8
    for (var i=0; i<Math.min(aidx.length, 8); i++) {
        v = variables[aidx[i]];
        lbl = dimensionLabels[aidx[i]];
        insertVariable(i, color_picker(lbl), lbl, autocorr_mags[aidx[i]]);
    }
    table.rows().select();
    for (var i=8; i<Math.min(aidx.length, 100); i++) {
        v = variables[aidx[i]];
        lbl = dimensionLabels[aidx[i]];
        insertVariable(i, color_picker(lbl), lbl, autocorr_mags[aidx[i]]);
    }
}

function featImportanceSubmitted() {
    if(document.getElementById('fft').checked) {
        fft_call();
    } else if(document.getElementById('variance').checked) {
        variance_call();
    } else {
        autocorr_call();
    }
}

function fileDetailsSubmitted() {
    isFileDetailsSubmitted = true;
    x_name = document.getElementById('x_col_name').value;
    y_name = document.getElementById('y_col_name').value;
    class_name = document.getElementById('class_column_name').value;
    desc_name = document.getElementById('desc_column_name').value;
    ignored_col = document.getElementById('ignored_columns').value;
    ignored_row = document.getElementById('ignored_rows').value;
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

function sortIndexAscend(arr) {
    // Get sort indices
    len = arr.length;
    var indices = new Array(len);
    for (var i=0; i<len; i++) indices[i] = i;//0 1 2 ... len
    indices.sort(function (a,b) {
        if (isNaN(arr[a]) && isNaN(arr[b])) return 0;
        if (isNaN(arr[a])) return -1;
        if (isNaN(arr[b])) return 1;
        return arr[a] > arr[b] ? 1 : arr[a] < arr[b] ? -1 : 0;
        // if arr[a] > arr[b], then return -1
        // else if arr[a] < arr[b], then return 1
        // else return 0
    });
    return indices;// return indices in
}

function insertVariable(i, color, label, fft_mag) {
    var table = $('#variables').DataTable();
    table.row.add( {"ids": i, "color": color, "label": label, "fft": fft_mag.toFixed(5)}).draw();
}

function togglePathPoints() {
    var obj = document.getElementById("points");
    if (obj.disabled == true) {
        obj.disabled = false;
    } else {
        obj.disabled = true;
        path_history = [];
        ctx.putImageData(canvasData, 0, 0);
        var arr = Papa.parse(obj.value, {fastMode: true, skipEmptyLines: true}).data;
        obj.value = "";
        for (var i=0; i<arr.length; i++) {
            var x = Number(arr[i][0]);
            var y = Number(arr[i][1]);
            if (!isNaN(x) && !isNaN(y)) {
                pathPush(Number(arr[i][0]), Number(arr[i][1]));
            }
        }

        drawPath(canvas, path_history);
    }
}

function putDesc(i) {
    document.getElementById("descriptions").innerHTML = (descriptions_array[i]);
}
