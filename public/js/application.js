$( document ).ready( function() {

    var checkpoint_radius = 2;

    /* Connect to socket */
    var socket = io.connect("/");

    socket.on('message', function(data) {
        console.log(data);
        if (data == "next") {
            planned_checkpoints.getLayers()[0].spliceLatLngs(0,1)[0];
            var last_cleared_checkpoint = planned_checkpoints.getLayers()[0].getLatLngs()[0];
            console.log("checkpoint at latitude " + last_cleared_checkpoint.lat + " and longitude " + last_cleared_checkpoint.lng + " cleared");
            cleared_checkpoints.addLatLng(last_cleared_checkpoint);
            next_checkpoint.setLatLng(last_cleared_checkpoint);
        }
    });

    socket.emit('message', 'started');

    /* Init map */
    var map = L.map('map').setView([59.936637, 10.717087], 17);
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-i87786ca/{z}/{x}/{y}.png', {
            zoom: 18,
            maxZoom: 18,
            detectRetina: true
            }).addTo(map);

    //map.dragging.disable();
    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();
    //map.scrollWheelZoom.disable();
    //map.boxZoom.disable();
    map.keyboard.disable();

    var asv_marker = L.rotatedMarker(new L.LatLng(59.936637, 10.717087), {
        icon: L.icon({
            iconUrl: 'img/asv_marker.png',
            iconRetinaUrl: 'img/asv_marker@2x.png',
            iconSize: [26, 50],
            iconAnchor: [13, 25],
        })
    });

    asv_marker.addTo(map);

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
        var current_asv_position = new L.LatLng(asv_marker.getLatLng().lat, asv_marker.getLatLng().lng);
        e.layer.spliceLatLngs(0, 0, current_asv_position);
        next_checkpoint.setLatLng(e.layer.getLatLngs()[1]);
        cleared_checkpoints.addLatLng(current_asv_position);
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

    /* Init next checkpoint */
    var next_checkpoint_options = {
        color: '#ff0',
        opacity: 1,
        weight: 10,
        fillColor: '#ff0',
        fillOpacity: 0.5
    };
    var next_checkpoint = L.circle([59.936637, 10.717087], checkpoint_radius, next_checkpoint_options).addTo(map);

    var direction = 0;
    var manual = false;

    window.setInterval(function() {
        asv_marker.options.angle = direction * (180 / Math.PI);
        var ll = asv_marker.getLatLng();
        ll.lat += Math.cos(direction) / 100000;
        ll.lng += Math.sin(direction) / 100000;
        asv_marker.setLatLng(ll);
        asv_history.addLatLng(new L.LatLng(ll.lat, ll.lng));
        //asv_history.options.smoothFactor = 1;
        if (!manual && Math.random() > 0.95) {
            direction += (Math.random() - 0.5) / 2;
        }
    }, 100);

    window.setInterval(function() {
        if (!map.getBounds().contains(asv_marker.getLatLng())) {
            map.panTo(asv_marker.getLatLng());
        }
    }, 1000);

    document.body.addEventListener('keydown', function(e) {
        if (e.which == 37) {
            direction -= 0.1;
            socket.emit('message', "" + direction);
            manual = true;
        }
        if (e.which == 39) {
            direction += 0.1;
            socket.emit('message', "" + direction);
            manual = true;
        }
    }, true);

});
