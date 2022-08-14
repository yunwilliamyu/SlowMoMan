$(document).ready(function() {
    $('#variables').DataTable( {
        dom: 'Bfrtip',
        buttons: [
           'copy',
           {
                extend: 'csvHtml5',
                title: 'variables'
            },
            'selectAll',
            'selectNone'
        ],
        select: {
            style: 'os'
        },
        "columns": [
            { "data": "ids" },
            { "data": "color" },
            { "data": "label", "width": "65%" },
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

} );

function regen_canvas(table) {
    var ids = table.rows('.selected').data().pluck('ids');
    var colors = table.rows('.selected').data().pluck('color');
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    for (var i=0; i<ids.length; i++) {
        if (var_call === true) {
            drawLine(canvas2, variables[vidx[ids[i]]], colors[i]);
        } else if (auto_call === true) {
            drawLine(canvas2, variables[aidx[ids[i]]], colors[i]);
        } else {
            drawLine(canvas2, variables[fidx[ids[i]]], colors[i]);
        }
    }
    canvas2Data = ctx2.getImageData(0, 0, width, height);

}
