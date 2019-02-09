function color_picker(x) {
    // hashes a name to a color
    var m = color_palette.length;
    var i = ((hashCode(x) % m) + m) % m;
    return color_palette[i];
}

hashCode = function(str) {
    var hash = 0;
    if (str.length == 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

var color_palette = [
"#70DB93",
"#5C3317",
"#9F5F9F",
"#B5A642",
"#A9A919",
"#A62A2A",
"#8C7853",
"#A67D3D",
"#5F9F9F",
"#D98719",
"#B87333",
"#FF7F00",
"#42426F",
"#5C4033",
"#2F4F2F",
"#4A766E",
"#4F4F2F",
"#9932CD",
"#871F78",
"#6B238E",
"#97694F",
"#7093DB",
"#855E42",
"#545454",
"#856363",
"#8E2323",
"#238E23",
"#CD7F32",
"#527F76",
"#93AA70",
"#215E21",
"#4E2F2F",
"#9F9F5F",
"#A8A8A8",
"#8F8FBD",
"#32CD32",
"#E47833",
"#8E236B",
"#32CD99",
"#3232CD",
"#6B8E23",
"#9370DB",
"#426F42",
"#7F00FF",
"#7FFF00",
"#DB7093",
"#A68064",
"#2F2F4F",
"#23238E",
"#4D4DFF",
"#FF6EC7",
"#00009C",
"#CFB53B",
"#FF7F00",
"#FF2400",
"#DB70DB",
"#8FBC8F",
"#BC8F8F",
"#5959AB",
"#6F4242",
"#8C1717",
"#238E68",
"#6B4226",
"#8E6B23",
"#3299CC",
"#007FFF",
"#FF1CAE",
"#00CC7C",
"#66CC7C",
"#236B8E",
"#38B0DE",
"#5C4033",
"#4F2F4F",
"#CC3299",
"#99CC32",
"#FF0000"
];
