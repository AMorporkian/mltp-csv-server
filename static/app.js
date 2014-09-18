$().ready(
    function() {
        var csvTable = $("#csvs");
        $.get("/csvs", function(data) {
            data.forEach(function(csv) {
                csvTable.append('<tr><td>'+csv.submitter+'</td><td>'+moment(csv.date).fromNow()+'</td><td><a href="/csv/'+csv.id+'">CSV</a></td></tr>');
            })
        })
    }
);