
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
            var progressNode = document.getElementById("progress1");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            erase();
            document.getElementById("fmessage1").innerHTML = ('...Importing...');
            var csvData = event.target.result;
            //data = $.csv.toArrays(csvData);
            res = Papa.parse(csvData, {fastMode: true, skipEmptyLines: true});
            data = res.data;
            if (data && data.length > 0) {
                if (data.length < 120001) {
                    document.getElementById("fmessage1").innerHTML = ('Imported -' + data.length + '- rows successfully!');

                    drawEmbedding(canvas, data);
                    canvasData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
                    var labels = listLabels(data);
                    var label_text = "";
                    for (var i=0; i<labels.length; i++) {
                        label_text += '<span style="color: ' + color_picker(labels[i]) + '">' + labels[i] + '</span><br />';
                    }
                    label_text += "";
                    document.getElementById("labels").innerHTML = label_text;
                }
                else {
                    document.getElementById("fmessage1").innerHTML = ('Too many rows to import!');
                    alert('Maximum call stack exceeded. Do not import more than 120,000 rows');
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
            var progressNode = document.getElementById("progress2");
            progressNode.max = event.total;
            progressNode.value = event.loaded;
        }
        reader.onload = function(event) {
            document.getElementById("fmessage2").innerHTML = ('...Importing...');
            var csvData = event.target.result;
            //data = $.csv.toArrays(csvData);
            res = Papa.parse(csvData, {fastMode: true, skipEmptyLines: true, quoteChar: '\v'});
            data = res.data;
            if (data && data.length > 0) {
                document.getElementById("fmessage2").innerHTML = ('Imported -' + data.length + '- rows successfully!');

                setHighDimensions(data);

            } else {
                alert('No data to import!');
            }
        };
        reader.onerror = function() {
            alert('Unable to read ' + file.fileName);
        };
    }
}
});

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
    for (var i=1; i<hd.length; i++) {
        highDimensions.push(hd[i].map(Number));
    }
}

function avgValue(x, y) {
    // Gives a higher dimensional space
    var shell = [];
    var radius = 0;
    var list = [];
    while (list.length < 1 && radius < 50) {
        shell = neighbor_shell(x, y, radius++);
    //    shell = [[x,y]]
        for (var i = 0; i < shell.length; i++) {
            arr = occupancyArray[shell[i][0]][shell[i][1]];
            if (arr.length > 0) {
                for (var j=0; j<arr.length; j++) {
                    list.push(arr[j]);
                }
            }
        }
    }
    if (list.length < 1 || highDimensions.length < 1) {
        return new Array(highDimensions.length).fill(0);
    }

    var vec_sum = Array(highDimensions[list[0]].length);
    for (var i=0; i<vec_sum.length; i++) {
        vec_sum[i]=0;
    }

    var vec = Array(highDimensions[list[0]].length);
    if (list.length>1) {
        for (var i = 0; i < list.length; i++) {
            curr_vec = highDimensions[list[i]];
            for (var j=0; j<vec_sum.length; j++) {
                vec_sum[j] += curr_vec[j];
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

    blankOccupancyArray();

    canvas2 = document.getElementById('can2');
    ctx2 = canvas2.getContext("2d");
}

var path_history = [];
function pathPush(X,Y) {
    path_history.push([X, Y]);
    document.getElementById("points").value += [X,Y] + "\n";
}

function smoothedPath(ph, n) {
    // Takes a 2D path history and smooths it out to ensure that distance between adjacent points is approximately equal
    // Returns a vector of n points
    var pX, pY, cX, cY, dX, dY, dist = 0;
    var smoothed = [];
    var ans = new Array(n);
    if (ph.length < 2) {
        return ph;
    } else {
        smoothed.push(ph[0]);
        for (var i=1; i<ph.length; i++) {
            pX = ph[i-1][0];
            pY = ph[i-1][1];
            cX = ph[i][0];
            cY = ph[i][1];
            dX = cX - pX;
            dY = cY - pY;
            dist = Math.sqrt(dX*dX + dY*dY);
            //for (var t=0; t<dist*16; t++) {
            var t=0;
            while (t < dist*16) {
                // Interpolation
                smoothed.push([Math.floor(pX + dX*t/16), Math.floor(pY + dY*t/16)]);
                t++;
            }
        }
        var l = smoothed.length;
        for (var i=0; i<n; i++) {
            ans[i] = smoothed[Math.floor(i*l/n)];
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
}

function erase() {
    //var m = confirm("Want to clear");
    var m = true;
    if (m) {
        reset();
        ctx.clearRect(0, 0, width, height);
        canvasData = ctx.getImageData(0, 0, width, height);
        blankOccupancyArray();
    }
}

function reset() {
    //var m = confirm("Want to reset");
    if (true) {
        ctx.putImageData(canvasData, 0, 0);
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        xval = 0;
        path_history = [];
        document.getElementById("fft_progress").value=0;
        document.getElementById("points").value="";
        $('#variables').DataTable().clear().draw();
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
        //console.log(X);
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


var variables = new Array();
function fft_call() {
    $('#variables').DataTable().clear().draw();
    var progressNode = document.getElementById("fft_progress");
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    bin_num = 512;
    fftobj = new FFTNayuki(bin_num);
    var smoothed = smoothedPath(path_history, bin_num);

    for (var i=0; i<highDimensions[0].length; i++) {
        variables[i] = new Array(bin_num).fill(0);
    }
    for (var j=0; j<bin_num; j++) {
        var timepoint = avgValue(smoothed[j][0], smoothed[j][1]);
        for (var i=0; i<variables.length; i++) {
            variables[i][j] = timepoint[i];
        }
    }
    var fourier_mags = [];
    computeFourier(fourier_mags, variables, bin_num, progressNode);

    fidx = sortIndex(fourier_mags);
    
    var fourierSorted = [];
    for (var i=0; i<fidx.length; i++) {
        fourierSorted.push(fourier_mags[fidx[i]]);
    }

    // from https://personal.sron.nl/~pault/

    var table = $('#variables').DataTable();
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

function sortIndex(arr) {
    // Get sort indices
    len = arr.length;
    var indices = new Array(len);
    for (var i=0; i<len; i++) indices[i] = i;
    indices.sort(function (a,b) {
        if (isNaN(arr[a]) && isNaN(arr[b])) return 0;
        if (isNaN(arr[a])) return 1;
        if (isNaN(arr[b])) return -1;
        return arr[a] > arr[b] ? -1 : arr[a] < arr[b] ? 1 : 0;
    });
    return indices;
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

