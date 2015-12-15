// This example displays a marker at the center of Australia.
// When the user clicks the marker, an info window opens.
var map, myPos, myMarker, myInfoWindow;
var myFirebaseRef = new Firebase("https://googlemapmessages.firebaseio.com/");
var mode = "text";
var id = 0;

function initMap() {
  var center = {lat: -0, lng: 0};

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: center,
    disableDefaultUI: true,
    minZoom: 2
  });


  myPos = {lat:0,lng:0};
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var tempPos = {
        lat: function(){return position.coords.latitude},
        lng: function(){return position.coords.longitude},
      };
      placeMarker(tempPos)

    }, function() {
      placeMarker(map.getCenter())
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, myInfowindow, map.getCenter());
  }


  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng);
  });

  myFirebaseRef.on("child_added", function(snapshot) {
    newMessage(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function placeMarker(location) {
  myPos = {lat:location.lat(), lng:location.lng()};

  if (myMarker == undefined) {
    mode = 'text';

    myMarker = new google.maps.Marker({
      position: myPos,
      map: map,
    });
    myInfowindow = new google.maps.InfoWindow({
      content: '<div id="messageTabs"><span style="font-weight: bold;" id="textButton" onclick="text()">Text</span><span id="drawButton" onclick="draw()">Draw</span><div><div id="messageArea"><textarea id="message"></textarea><button onclick="saveMessage()">Save</button><div>'
    });


  } else {
    myMarker.setPosition(myPos)

  }

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
  myInfowindow.close(map,myMarker);
}

function draw(){
  $('#messageArea').html('<canvas id="simple_sketch" width="300" height="100"></canvas><button onclick="saveMessage()">Save</button>')
  $(function() {
    $('#simple_sketch').sketch();
  });
  mode = 'draw';
  $('#textButton').css('font-weight','normal')

  $('#drawButton').css('font-weight','bold')
}

function text(){
  $('#messageArea').html('<textarea id="message"></textarea><button onclick="saveMessage()">Save</button>')
  mode = 'text';
  $('#textButton').css('font-weight','bold')
  $('#drawButton').css('font-weight','normal')
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
    message = _.remove(_.unescape(_.escape(data.message)).split("\n"), function(str){return str}).join("<br>");
    var infoWindow = new google.maps.InfoWindow({
      content: message

    });
    $('#log').append('<p id="message'+id+'"onclick="centerMap({lat:'+data.location.lat+',lng:'+data.location.lng+'})"><span>lat '+data.location.lat+' lng '+data.location.lng+'</span>'+message+'</p>')

  } else {
    var infoWindow = new google.maps.InfoWindow({
      content: '<img src="'+_.escape(data.message)+'">'
    });
    $('#log').append('<p id="message'+id+'"onclick="centerMap({lat:'+data.location.lat+',lng:'+data.location.lng+'})"><span>lat '+data.location.lat+' lng '+data.location.lng+'</span><img src="'+_.unescape(_.escape(data.message))+'"></p>')

  }
  marker.addListener('click', function() {
    infoWindow.open(map, marker);
  });

  $('#message'+id).click(function(){
    infoWindow.open(map,marker)
  })
  id+=1;

  $('#log').scrollTop($('#log')[0].scrollHeight)
}

function centerMap(location){
  map.setCenter(location);
}
