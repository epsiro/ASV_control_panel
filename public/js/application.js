$( document ).ready( function() {

    var ready_for_new_wp = false;
    //var ready_to_send_wp = false;
    var draw_wanted = false;
    var got_message = false;

    var asv_planned_route = [
        [59.95990811, 10.79299452],
        [59.95978586, 10.79244960],
        [59.95966608, 10.79192318],
        [59.95951144, 10.79206993]
    ];

    var heading_canvas = $('div#heading canvas')[0];

    if (heading_canvas.getContext('2d')) {
        heading_ctx = heading_canvas.getContext('2d');
    } else {
        alert("Canvas not supported!");
    }

    var checkpoint_radius = 4;

    var asv_nr_of_msg = 0;

    /* Connect to socket */
    var socket = io.connect("/");

    socket.on('message', function(data) {

        //console.log(data);

        if (data.substring(0,6) == "STATUS") {

            $('div#status_bar').text(data);

            var data_array = data.split(",");

            asv_date = data_array[1];
            asv_time = data_array[2];
            asv_latitude = data_array[3];
            asv_longitude = data_array[4];
            asv_gps_ok = data_array[5];
            asv_current_heading = data_array[6];
            asv_wanted_heading = data_array[7];
            asv_distance_from_wp = data_array[8];
            asv_nr_of_wp = data_array[9];
            asv_mag_accuracy = data_array[10];
            asv_run_motors = data_array[11];
            asv_first_waypoint_latitude = data_array[12];
            asv_first_waypoint_longitude = data_array[13];
            asv_next_waypoint_latitude = data_array[14];
            asv_next_waypoint_longitude = data_array[15];
            asv_port_motor_thrust = data_array[16];
            asv_stbd_motor_thrust = data_array[17];

            //$("span#asv_latitude_longitude").text();
            $("span#asv_nr_of_wp").text(asv_nr_of_wp + " WP");
            //$("span#asv_mag_accuracy").text();
            //$("span#asv_run_motors").text();
            $("span#asv_port_motor_thrust").text(asv_port_motor_thrust);
            $("span#asv_stbd_motor_thrust").text(asv_stbd_motor_thrust);

            //$("span#asv_motor_running").removeClass("fa-spin");
            $("span#asv_motor_running").siblings('i').removeClass("fa-spin");
            if (asv_run_motors == "1") {
                $("span#asv_motor_running").siblings('i').addClass("fa-spin");
                $("span#asv_motor_running").text("Running")
            } else {
                $("span#asv_motor_running").text("Not running")
                //$("span#asv_motor_running").text(ready_for_new_wp)
            }

            if (asv_gps_ok == "1") {
                $("span#asv_gps_ok").text("OK").css('color', 'green');
                $("span#asv_date").text("20" + asv_date.substring(4,6) + "-" + asv_date.substring(2,4) + "-" + asv_date.substring(0,2));
                $("span#asv_time").text(parseInt(asv_time.substring(0,2))+2 + ":" + asv_time.substring(2,4) + ":" + asv_time.substring(4,6));
            } else {
                $("span#asv_gps_ok").text("Not OK").css('color', 'red');
                $("span#asv_date").text("N/A");
                $("span#asv_time").text("N/A");
            }

            if (parseInt(asv_mag_accuracy) >= 3) {
                $("span#asv_compass_ok").text("OK").css('color', 'green');
            } else {
                $("span#asv_compass_ok").text("Not OK").css('color', 'red');
            }

            if (asv_gps_ok = "1" && parseInt(asv_first_waypoint_latitude) != 0 && parseInt(asv_first_waypoint_longitude) != 0) {
                $("span#asv_distance_from_wp").text(asv_distance_from_wp + " m to WP");
                draw_wanted = true;
            } else {
                $("span#asv_distance_from_wp").text("N/A");
                draw_wanted = false;
            }

            $("span#asv_nr_of_msg").text(++asv_nr_of_msg);
            $("span#asv_nr_of_msg").siblings('i').addClass("fa-spin");

            if (asv_nr_of_msg >= 99) {
                asv_nr_of_msg = 0
            }
            got_message = true;

            draw_indicator(heading_ctx, asv_wanted_heading, asv_current_heading, draw_wanted);

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

            if (parseInt(asv_nr_of_wp) < 2 && ready_for_new_wp == true) {
                //planned_checkpoints.getLayers()[0].spliceLatLngs(0,1)[0];
                //var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
                //console.log("checkpoint at latitude " + last_cleared_checkpoint.lat + " and longitude " + last_cleared_checkpoint.lng + " cleared");
                //cleared_checkpoints.addLatLng(last_cleared_checkpoint);
                //next_checkpoint.setLatLng(last_cleared_checkpoint);
                //socket.emit('message', 'NWP,'+ last_cleared_checkpoint.lat + "," + last_cleared_checkpoint.lon);
                var next = asv_planned_route.shift();
                socket.emit('message', 'NWP,'+ next[0] + "," + next[1]);
                ready_for_new_wp = false;
            }
        } else if (data.substring(0,6) == "ACKRWP") {
                ready_for_new_wp = true;
        }
    });

    socket.emit('message', 'ASV Control Panel started');

    /* Init map */
    //var map = L.map('map', {zoomControl: false}).setView([59.936637, 10.717087], 17);
    //var map = L.map('map', {zoomControl: true}).setView([59.959707, 10.792272], 19);
    var map = L.map('map', {zoomControl: false}).setView([59.95974031, 10.79310980], 19);
    //L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-i87786ca/{z}/{x}/{y}.png', {
    L.tileLayer('img/tiles/{z}/{x}/{y}.png', {
            zoom: 21,
            maxZoom: 21,
            detectRetina: true
            }).addTo(map);

    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    //if (map.tap) map.tap.disable();

    var asv_marker = L.rotatedMarker(new L.LatLng(59.959707, 10.792272), {
    //var asv_marker = L.rotatedMarker(new L.LatLng(59.936637, 10.717087), {
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
        ready_for_new_wp = true;
        //ready_to_send_wp = true;
/*
        // MORE TODO
        //socket.emit('message', 'NWP, 59.937638, 10.717012');
        //socket.emit('message', 'NWP, 59.938354, 10.717946'); // corner fys
        socket.emit('message', 'NWP, 59.959531, 10.792848'); // kjelsaas
        //59.959747, 10.792734
        //
        //var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
        //socket.emit('message', 'NWP,' + last_cleared_checkpoint.lat.toFixed(6) + "," + last_cleared_checkpoint.lng.toFixed(6));
*/

        /*
        //planned_checkpoints.getLayers()[0].spliceLatLngs(0,1)[0];
        var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
        //console.log("checkpoint at latitude " + last_cleared_checkpoint.lat + " and longitude " + last_cleared_checkpoint.lng + " cleared");
        cleared_checkpoints.addLatLng(last_cleared_checkpoint);
        //next_checkpoint.setLatLng(last_cleared_checkpoint);
        //socket.emit('message', 'NWP,' + last_cleared_checkpoint.lat.toFixed(6) + "," + last_cleared_checkpoint.lng.toFixed(6));
        */
    }, "Send WP", map);

    L.easyButton('fa-trash', function() {
        socket.emit('message', 'DEL');
    }, "Delete WP", map);

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
    //var asv_history_points = [ [59.936637, 10.717087] ];
    //var asv_history_points = [ [59.959707, 10.792272] ];
    var asv_history_points = [ [59.95974031, 10.79310980] ];

    var asv_history_options = {
        smoothFactor: 1,
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
        color: '#f00',
        opacity: 1,
        weight: 10,
        fillColor: '#f00',
        fillOpacity: 0.5
    };
    var first_waypoint = L.circle([0, 0], checkpoint_radius, waypoint_options).addTo(map);
    var next_waypoint = L.circle([0, 0], checkpoint_radius/2, waypoint_options).addTo(map);


    var circle_options = {
        color: '#ff0',
        opacity: 1,
        weight: 3
    };

    L.circle([59.95974031, 10.79310980], 1, circle_options).addTo(map);
    L.circle([59.95990811, 10.79299452], 1, circle_options).addTo(map);
    L.circle([59.95978586, 10.79244960], 1, circle_options).addTo(map);
    L.circle([59.95966608, 10.79192318], 1, circle_options).addTo(map);
    L.circle([59.95951144, 10.79206993], 1, circle_options).addTo(map);

    //var seconds_counter = 0;
    window.setInterval(function() {
        if (!map.getBounds().contains(asv_marker.getLatLng())) {
            //map.panTo(asv_marker.getLatLng());
        }

        if (got_message == false) {
            $("span#asv_nr_of_msg").siblings('i').removeClass("fa-spin");
        }
        got_message = false;

/*
        if (seconds_counter >= 1) {
            ready_for_new_wp = true;
            seconds_counter = 0;
        } else {
            seconds_counter++;
        }
*/

    }, 1000);

    //var s = Snap("#svg");

    //var rect = s.rect(10, 10, 100, 100);
    //rect.animate({
            //x: 50,
            //y: 50
    //}, 1000);

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

    function draw_indicator(ctx, degrees_wanted, degrees_current, draw_wanted) {

        ctx.clearRect(0, 0, 200, 200);

        var center_x = 100;
        var center_y = 100;

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(center_x, center_y, 100, 0, 2*Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fill();
        //ctx.stroke();

        // Draw N, S, E, W
        ctx.save();
        ctx.translate(center_x, center_y);
        ctx.fillStyle = "black";
        ctx.font = "1.3em open_sansregular";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.save();
        ctx.translate(0, -60);
        ctx.fillText("N", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(60, 0);
        ctx.fillText("E", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(0, 60);
        ctx.fillText("S", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(-60, 0);
        ctx.fillText("W", 0, 0);
        ctx.restore();
        ctx.restore();

        if (draw_wanted == true) {
            // Draw wanted heading
            ctx.lineWidth = 2;
            ctx.setLineDash([2]);
            ctx.strokeStyle = '#f00';
            draw_needle(90, degrees_wanted);
            ctx.setLineDash([]);
        }

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
        draw_needle(90, degrees_current);

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
                ctx.translate(0, -180/2);

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
