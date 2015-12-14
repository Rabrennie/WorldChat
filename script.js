// This example displays a marker at the center of Australia.
// When the user clicks the marker, an info window opens.
var map, myPos, myMarker, myInfoWindow;
var myFirebaseRef = new Firebase("https://googlemapmessages.firebaseio.com/");
var mode = "text";


function initMap() {
  var center = {lat: -0, lng: 0};

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: center,
    disableDefaultUI: true,
    minZoom: 2
  });

  myInfowindow = new google.maps.InfoWindow({map: map});

  myPos = {lat:0,lng:0};
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      myPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      myInfowindow.setPosition(myPos);
      myInfowindow.setContent('<div id="messageTabs"><span id="textButton" onclick="text()">Text</span><span id="drawButton" onclick="draw()">Draw</span><div><div id="messageArea"><textarea id="message"></textarea><button onclick="saveMessage()">Save</button><div>');
      map.setCenter(myPos);
      myMarker = new google.maps.Marker({
        position: myPos,
        map: map,
      });
      myInfowindow.open(map,myMarker);



    }, function() {
      handleLocationError(true, myInfowindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, myInfowindow, map.getCenter());
  }





  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng);
  });

  myFirebaseRef.on("child_added", function(snapshot) {
    console.log(snapshot.val());
    newMessage(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function placeMarker(location) {
  console.log(location)
  myMarker.setMap(null)
  myPos = {lat:location.lat(), lng:location.lng()};

  myMarker = new google.maps.Marker({
    position: myPos,
    map: map,
  });
  myInfowindow = new google.maps.InfoWindow({
    content: '<div id="messageTabs"><span id="textButton" onclick="text()">Text</span><span id="drawButton" onclick="draw()">Draw</span><div><div id="messageArea"><textarea id="message"></textarea><button onclick="saveMessage()">Save</button><div>'
  });
  myInfowindow.open(map,myMarker);
  document.getElementById('message').focus()

  myMarker.addListener('click', function() {
    myInfowindow.open(map,myMarker);
    document.getElementById('message').focus()
  });
}



function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
  }

  function saveMessage(){
    var pos = myPos
    if(mode =='text'){
      myFirebaseRef.push({
        type:'text',
        message: _.escape(document.getElementById('message').value),
        location: pos
      });
    } else {
      imageData = $('#simple_sketch')[0].toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, "");
      $.ajax({
        url: 'https://api.imgur.com/3/image',
        headers: {
          'Authorization': 'Client-ID a2bb58386e94eb0'
        },
        type: 'POST',
        data: {
          'image': imageData
        },
        success: function(data) { myFirebaseRef.push({
          type:'image',
          message: data.data.link,
          location: pos
        }); }
      });
    }
    myMarker.setMap(null)
  }
  function draw(){
    $('#messageArea').html('<canvas id="simple_sketch" width="300" height="100"></canvas><button onclick="saveMessage()">Save</button>')
    $(function() {
      $('#simple_sketch').sketch();
    });
    mode = 'draw';
  }
  function text(){
    $('#messageArea').html('<textarea id="message"></textarea><button onclick="saveMessage()">Save</button>')
    mode = 'text';
  }

  function newMessage(data){
    console.log(data)

    var marker = new google.maps.Marker({
      position: data.location,
      map: map,
      animation: google.maps.Animation.DROP,
      icon:'http://i.imgur.com/UYAVMth.png'
    });

    if(data.type != 'image'){
      var infoWindow = new google.maps.InfoWindow({
        content: _.escape(data.message).split('\n').join('</br>')
      });
    } else {
      var infoWindow = new google.maps.InfoWindow({
        content: '<img src="'+data.message+'">'
      });
    }
    marker.addListener('click', function() {
      infoWindow.open(map, marker);
    });

    $('#log').append('<p onclick="centerMap({lat:'+data.location.lat+',lng:'+data.location.lng+'})"><span>lat '+data.location.lat+' lng '+data.location.lng+'</span>'+_.escape(data.message).split('\n').join('</br>')+'</p>')
  }

  function centerMap(location){
    map.setCenter(location);
  }
