function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

var WebSocketServer = require('websocket').server;
var http = require('http');
var ejs = require('ejs');
var fs = require('fs');
var math = require('mathjs');

var lastPng;

var server = http.createServer(function(req, res){
	console.log((new Date())+' Received request for '+req.url);
	
	if(req.url === '/'){
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(fs.readFileSync('./index.html'));
	}
	else if(req.url === '/favicon.ico'){
		res.writeHead(200, {'Content-Type': 'image/vnd.icrosoft.icon'});
		res.end(fs.readFileSync('./imgs/favicon.ico', 'binary'));
	}else{
		//send the named file.
		try{
			var fileToReturn = fs.readFileSync('.'+req.url);
			
			var isImage = false;
			var contentType = 'text/html';			
			if(strEndsWith(req.url, '.js')){
				contentType = 'application/javascript';
			}else if(strEndsWith(req.url, '.css')){
				contentType = 'text/css';
			}else if(strEndsWith(req.url, '.png')){
				contentType = 'image/png';
				isImage = true;
			}else if(strEndsWith(req.url, '.jpg')){
				contentType = 'image/jpg';
				isImage = true;
			}
			
			res.writeHead(200, {'Content-Type': contentType});
			if(isImage){
				res.end(fileToReturn, 'binary');
			}else{
				res.end(fileToReturn);
			}
		}catch(e){
			console.log('no path for '+req.url);
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end();
		}
	}
});

server.listen(8080, function(){
	console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function setControlEnabled(enabled){
	controlEnabled = enabled;
	if(controlEnabled){
		console.log("control enabled");
	}else{
		console.log("control disabled");
	}
}

var Leap = require('leapjs');
var arDrone = require('ar-drone');

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var droneControl = arDrone.createUdpControl();
    var drone  = arDrone.createClient({udpControl: droneControl});
    
    //drone.config('general:navdata_demo', 'FALSE');	//enable datas
    //var droneControl = drone._udpControl;
    var ref = {};
    var pcmd = {};
    var clientControlEnabled = false; //used to know if the user want to send controls to the drone, or not
    var serverControlEnabled = false; //used to know if the drone can receive commands. Example : if the drone is currently taking off, it can't receive anything else
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    
    //init drone state
    connection.send(JSON.stringify({action: "updateDroneBattery", battery: drone._lastBattery}));
    connection.send(JSON.stringify({action: "updateDroneAltitude", altitude: drone._lastAltitude}));
   
   	var controller = new Leap.Controller();
   	connection.send(JSON.stringify({action: "updateLeapState", connected: false}));
   	//var frameCount = 0;
   	var currentNbOfHands = 0;
   	
   	controller.on("frame", function(frame) {
   	  //frameCount++;
   	  //console.log(frame);
   	  if(frame.hands.length>0){
   	  	  serverControlEnabled = true;
   	  	  var hand = frame.hands[0];
   	  	  var horizonAngle = math.atan(hand.palmNormal[0]/hand.palmNormal[1]) * (180/math.pi);
   	  	  var directionAngle = math.atan(hand.palmNormal[2]/hand.palmNormal[1]) * (180/math.pi);
   	  	  var clockWiseAngle = -(math.atan(hand.direction[0]/hand.direction[2]) * (180/math.pi)-45);
   	  	  connection.send(JSON.stringify({action: "updateFrame",
	   	  							  leapNumberOfHands: frame.hands.length,
   	  								  direction: hand.direction,
   	  								  clockWiseAngle: clockWiseAngle,
   	  								  directionAngle: directionAngle,
   	  								  palmNormal: hand.palmNormal,
   	  								  horizonAngle: horizonAngle,
   	  								  palmPosition: hand.palmPosition,
   	  								  handHeight: hand.palmPosition[1],
   	  								  palmVelocity: hand.palmVelocity,
   	  								  stabilizedPalmPosition: hand.stabilizedPalmPosition,
   	  								  sphereCenter: hand.sphereCenter,
   	  								  sphereRadius: hand.sphereRadius,
   	  								  valid: hand.valid,
   	  								  }));
   	  								  
   	  	 if(clientControlEnabled && serverControlEnabled){
	   	  	 var detectionLimit = 10;
	   	  	 if(horizonAngle < -detectionLimit){
	   	  	 	pcmd.left = 0.2;
	   	  	 }else if(horizonAngle > detectionLimit){
	   	  	 	pcmd.left = -0.2;
	   	  	 }else{
	   	  	 	pcmd.left = 0;
	   	  	 }
	   	  	 if(directionAngle < -detectionLimit){
	   	  	 	pcmd.front = 0.2;
	   	  	 }else if(directionAngle > detectionLimit){
	   	  	 	pcmd.front = -0.2;
	   	  	 }else{
	   	  	 	pcmd.front = 0;
	   	  	 }
	   	  	 if(clockWiseAngle < -detectionLimit){
	   	  	 	//movement.clockwise = -0.2;
	   	  	 }else if(clockWiseAngle > detectionLimit){
	   	  	 	//movement.clockwise = 0.2;
	   	  	 }else{
	   	  	 	//pcmd.clockwise = 0;
	   	  	 }
	   	  	 if(hand.palmPosition[1] > 230){
	   	  	 	pcmd.up = 0.2;
	   	  	 }else if(hand.palmPosition[1] < 170){
	   	  	 	pcmd.up = -0.2;
	   	  	 }else{
	   	  	 	pcmd.up = 0;
	   	  	 }
   	  	 }
   	  }else if (currentNbOfHands != 0 || clientControlEnabled){
   	  	  serverControlEnabled = false;
   	  	  clientControlEnabled = false;
   	  	  connection.send(JSON.stringify({action: "handLeftLeap"}));
   	  	  pcmd = {};
   	  }
   	  currentNbOfHands = frame.hands.length;
   	});
   	controller.on('ready', function() {
   	    connection.send(JSON.stringify({action: "updateLeapState", connected: true}));
   	});
   	controller.on('disconnect', function() {
   	    connection.send(JSON.stringify({action: "updateLeapState", connected: false}));
   	});
   	controller.on('focus', function() {
   	    console.log("focus");
   	});
   	controller.on('blur', function() {
   	    console.log("blur");
   	});
   	controller.on('deviceConnected', function() {
   	    connection.send(JSON.stringify({action: "updateLeapState", connected: true}));
   	});
   	controller.on('deviceDisconnected', function() {
   	    connection.send(JSON.stringify({action: "updateLeapState", connected: false}));
   	});
   	controller.connect();
    
    //next method receive all messages from client
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            try{
            	var json = JSON.parse(message.utf8Data);
            }catch(e){
            	console.log('this is not json : ',message.utf8Data);
            	return;
            }
            if(json.action === 'updateControlEnabled'){
            	clientControlEnabled = json.controlEnabled;
            	if(!clientControlEnabled){
            		pcmd = {};
            	}
            }else if(json.action === 'takeOff'){
            	console.log('taking off...');
            	ref.fly = true;
            	pcmd = {};
            }else if(json.action === 'land'){
            	console.log('landing...');
            	ref.fly = false;
            	pcmd = {};
            }else{
            	console.log("unknown action : "+json);
            }
        }
        else{
        	console.log('Received weird message of type : '+message.type);
        }
    });
    
    //function called when the user leaves
    connection.on('close', function(reasonCode, description) {
    	pcmd = {};
    	drone.land();
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    
    //drone events
    drone.on('navdata', function(navdata){
    	//handle more datas ?
    });
    drone.on("batteryChange", function(battery){
    	connection.send(JSON.stringify({action: "updateDroneBattery", battery: battery}));
    });
    drone.on("altitudeChange", function(altitude){
    	connection.send(JSON.stringify({action: "updateDroneAltitude", altitude: altitude}));
    });
    
    //using the low level api, we can't know if the drone has received our orders. We must then send them repetedly, here every 30ms.
    setInterval(function(){
    	//droneControl.ref(ref);
    	//droneControl.pcmd(pcmd);
    	drone._ref = ref;
    	drone._pcmd = pcmd;
    	//droneControl.flush();
    }, 30);
});