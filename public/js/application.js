$( document ).ready( function() {

    var heading_canvas = $('div#heading canvas')[0];

    if (heading_canvas.getContext('2d')) {
        heading_ctx = heading_canvas.getContext('2d');
    } else {
        alert("Canvas not supported!");
    }

    var checkpoint_radius = 4;

    /* Connect to socket */
    var socket = io.connect("/");

    socket.on('message', function(data) {

        console.log(data);

        if (data.substring(0,6) == "STATUS") {

            $('div#status').text(data);

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
            asv_port_motor_thrust = data_array[15];
            asv_stbd_motor_thrust = data_array[16];

            draw_indicator(heading_ctx, asv_wanted_heading, asv_current_heading);

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

    function clear_canvas(ctx) {
        ctx.clearRect(0, 0, 200, 200);
    }

    function draw(degrees) {

        clear_canvas();

        // Draw the compass onto the canvas
        ctx.drawImage(compass, 0, 0);

        // Save the current drawing state
        ctx.save();

        // Now move across and down half the 
        ctx.translate(100, 100);

        // Rotate around this point
        ctx.rotate(degrees * (Math.PI / 180));

        // Draw the image back and up
        ctx.drawImage(needle, -100, -100);

        // Restore the previous drawing state
        ctx.restore();

        // Increment the angle of the needle by 5 degrees
        //degrees += 5;
    }

    function draw_indicator(ctx, degrees_wanted, degrees_current) {

        ctx.clearRect(0, 0, 200, 200);

        var center_x = 100;
        var center_y = 100;

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(center_x, center_y, 90, 0, 2*Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fill();
        ctx.stroke();

        // Draw N, S, E, W
        ctx.save();
        ctx.translate(center_x, center_y);
        ctx.fillStyle = "#666";
        ctx.font = "bold 16px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.save();
        ctx.translate(0, -50);
        ctx.fillText("N", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(50, 0);
        ctx.fillText("E", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(0, 50);
        ctx.fillText("S", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(-50, 0);
        ctx.fillText("W", 0, 0);
        ctx.restore();
        ctx.restore();

        // Draw wanted heading
        ctx.lineWidth = 2;
        ctx.setLineDash([5]);
        ctx.strokeStyle = '#f00';
        draw_needle(85, degrees_wanted);
        ctx.setLineDash([]);

        // Draw needle mounting
        ctx.beginPath();
        ctx.arc(center_x, center_y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#00F';
        ctx.fill();
        ctx.closePath();

        draw_tics();

        // Draw current heading
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00F';
        draw_needle(85, degrees_current);

        function draw_tics() {
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;

            // 360/72 = 5 degrees
            var nr_of_tics = 72;

            for (var i = 0; i < nr_of_tics; i++) {
                ctx.save();
                ctx.beginPath();
                ctx.translate(center_x, center_y);
                var angle = (i * (360/nr_of_tics)) * Math.PI/180;
                ctx.rotate(angle);
                ctx.translate(0, -160/2);

                ctx.moveTo(0, 0);
                ctx.lineTo(0, 10);
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
            }
        }

        function draw_needle(length, angle) {
                ctx.save();
                ctx.beginPath();
                ctx.translate(center_x, center_y);

                // Correct for top left origin
                ctx.rotate(-180 * Math.PI/180);

                ctx.rotate(angle * Math.PI/180);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, length);
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
        }

    }
});
