$( document ).ready( function() {

    var checkpoint_radius = 4;

    /* Connect to socket */
    var socket = io.connect("/");

    socket.on('message', function(data) {

        console.log(data);
        $('div#status').text(data);

        if (data.substring(0,6) == "STATUS") {

            var data_array = data.split(",");

            asv_date = data_array[1];
            asv_time = data_array[2];
            asv_latitude = data_array[3];
            asv_longitude = data_array[4];
            asv_current_heading = data_array[5];
            asv_wanted_heading = data_array[6];
            asv_distance_from_wp = data_array[7];
            asv_nr_of_wp = data_array[8];
            asv_mag_accuracy = data_array[9];
            asv_run_motors = data_array[10];
            asv_first_waypoint_latitude = data_array[11];
            asv_first_waypoint_longitude = data_array[12];
            asv_next_waypoint_latitude = data_array[13];
            asv_next_waypoint_longitude = data_array[14];

            asv_marker.options.angle = asv_current_heading; //direction * (180 / Math.PI);
            asv_marker.update();

            if (asv_latitude != 0 && asv_longitude != 0) {
                var asv_position = new L.LatLng(asv_latitude, asv_longitude);
                asv_marker.setLatLng(asv_position);
                asv_history.addLatLng(asv_position);
                //asv_history.options.smoothFactor = 1;
            }

            first_waypoint.setLatLng(new L.LatLng(asv_first_waypoint_latitude, asv_first_waypoint_longitude));
            next_waypoint.setLatLng(new L.LatLng(asv_next_waypoint_latitude, asv_next_waypoint_longitude));

            if (asv_nr_of_wp < 2) {
            }

        //} else if (data == "next") {

            /*
            if (asv_nr_of_wp < 2) {
                planned_checkpoints.getLayers()[0].spliceLatLngs(0,1)[0];
                var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
                console.log("checkpoint at latitude " + last_cleared_checkpoint.lat + " and longitude " + last_cleared_checkpoint.lng + " cleared");
                cleared_checkpoints.addLatLng(last_cleared_checkpoint);
                next_checkpoint.setLatLng(last_cleared_checkpoint);
                socket.emit('message', 'NWP,'+ last_cleared_checkpoint.lat + "," + last_cleared_checkpoint.lon);
            }
            */
        }
    });

    socket.emit('message', 'ASV Control Panel started');

    /* Init map */
    var map = L.map('map', {zoomControl: false}).setView([59.936637, 10.717087], 17);
    //L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-i87786ca/{z}/{x}/{y}.png', {
    L.tileLayer('img/tiles/{x}/{y}.png', {
            zoom: 18,
            maxZoom: 18,
            detectRetina: true
            }).addTo(map);

    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    //if (map.tap) map.tap.disable();

    var asv_marker = L.rotatedMarker(new L.LatLng(59.936637, 10.717087), {
        icon: L.icon({
            iconUrl: 'img/asv_marker.png',
            iconRetinaUrl: 'img/asv_marker@2x.png',
            iconSize: [26, 50],
            iconAnchor: [13, 25],
        })
    });

    asv_marker.addTo(map);

    /* Init buttons */

    L.easyButton('fa-send', function() {
        // MORE TODO
        //socket.emit('message', 'NWP, 59.937638, 10.717012');
        socket.emit('message', 'NWP, 59.938354, 10.717946');
        //var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
        //socket.emit('message', 'NWP,' + last_cleared_checkpoint.lat.toFixed(6) + "," + last_cleared_checkpoint.lng.toFixed(6));

        /*
        //planned_checkpoints.getLayers()[0].spliceLatLngs(0,1)[0];
        var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
        //console.log("checkpoint at latitude " + last_cleared_checkpoint.lat + " and longitude " + last_cleared_checkpoint.lng + " cleared");
        cleared_checkpoints.addLatLng(last_cleared_checkpoint);
        //next_checkpoint.setLatLng(last_cleared_checkpoint);
        //socket.emit('message', 'NWP,' + last_cleared_checkpoint.lat.toFixed(6) + "," + last_cleared_checkpoint.lng.toFixed(6));
        */
    }, "Send wp", map);

    L.easyButton('fa-play', function() {
        socket.emit('message', 'RUN');
    }, "Start the ASV", map);

    L.easyButton('fa-stop', function() {
        socket.emit('message', 'HLT');
    }, "Stop the ASV", map);

    /* Init planned checkpoints */
    var planned_checkpoints = new L.FeatureGroup();
    map.addLayer(planned_checkpoints);

    var draw_control = new L.Control.Draw({
        draw: {
            circle: false,
            rectangle: false,
            polygon: false,
            marker: false
        },
        edit: {
            edit: true,
            featureGroup: planned_checkpoints
        }
    });
    map.addControl(draw_control);

    map.on('draw:created', function(e) {
        console.log(e.layer.getLatLngs());
        //var current_asv_position = new L.LatLng(asv_marker.getLatLng().lat, asv_marker.getLatLng().lng);
        //e.layer.spliceLatLngs(0, 0, current_asv_position);
        ////next_checkpoint.setLatLng(e.layer.getLatLngs()[1]);
        //cleared_checkpoints.addLatLng(current_asv_position);
        planned_checkpoints.addLayer(e.layer);
    });

    map.on('draw:edited', function(e) {
        e.layers.eachLayer(function (layer) {
            console.log(layer.getLatLngs());
        });
    });

    /* Init asv history */
    var asv_history_points = [ [59.936637, 10.717087] ];

    var asv_history_options = {
        smoothFactor: 2,
        color: '#000'
    };

    var asv_history = L.polyline(asv_history_points, asv_history_options).addTo(map);

    /* Init cleared checkpoints */
    //var cleared_checkpoints_points = [ [59.936637, 10.717087] ];
    var cleared_checkpoints_points = [];

    var cleared_checkpoints_option = {
        smoothFactor: 0,
        color: '#00f'
    };

    var cleared_checkpoints = L.polyline(cleared_checkpoints_points, cleared_checkpoints_option).addTo(map);

    /* Init future waypoint markers */
    var waypoint_options = {
        color: '#ff0',
        opacity: 1,
        weight: 10,
        fillColor: '#ff0',
        fillOpacity: 0.5
    };
    var first_waypoint = L.circle([0, 0], checkpoint_radius, waypoint_options).addTo(map);
    var next_waypoint = L.circle([0, 0], checkpoint_radius/2, waypoint_options).addTo(map);

    window.setInterval(function() {
        if (!map.getBounds().contains(asv_marker.getLatLng())) {
            map.panTo(asv_marker.getLatLng());
        }
    }, 1000);
});
