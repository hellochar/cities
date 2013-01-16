function FirstPersonControls(speed, tall, element) { //element should be a canvas
  this.speed = speed;
  this.tall = tall;
  this.element = element;

  // this.pos2 = new THREE.Vector2();

  //these two angles determine the heading
  this.azimuth = 0; //x-z; your heading projected down onto the ground plane [0-2pi]
  this.altitude = 0; //how "up" or "down" you are looking at [-pi/2-pi/2]; -pi/2 means down at the ground

  this.movementYTotal = this.movementXTotal = 0;
}

FirstPersonControls.prototype.register = function() {
  var havePointerLock = 'pointerLockElement' in document ||
                        'mozPointerLockElement' in document ||
                        'webkitPointerLockElement' in document;
  if(!havePointerLock) alert("no pointer lock!");

  var element = this.element;
  element.requestPointerLock = element.requestPointerLock ||
                               element.mozRequestPointerLock ||
                               element.webkitRequestPointerLock;

  document.exitPointerLock = document.exitPointerLock ||
                             document.mozExitPointerLock ||
                             document.webkitExitPointerLock;

  this.onClick = function() {
    // Ask the browser to lock the pointer
    element.requestPointerLock();
  };

  element.addEventListener('click', this.onClick, false);

  var moveCallback = function(e) {
    var movementX = e.movementX ||
                    e.mozMovementX          ||
                    e.webkitMovementX       ||
                    0,
        movementY = e.movementY ||
                    e.mozMovementY      ||
                    e.webkitMovementY   ||
                    0;

    this.movementXTotal += movementX;
    this.movementYTotal += movementY;

  }.bind(this);

  var keyState = this.keyState = {};
  function keyDown(evt) {
    keyState[String.fromCharCode(evt.keyCode)] = true;
  };

  function keyUp(evt) {
    delete keyState[String.fromCharCode(evt.keyCode)];
  };

  function lockChangeCallback(evt) {
    var requestedElement = element;
    if (document.pointerLockElement === requestedElement ||
        document.mozPointerLockElement === requestedElement ||
        document.webkitPointerLockElement === requestedElement) {
      console.log("got lock");
      // Pointer was just locked - register fps event listeners
      document.addEventListener("mousemove", moveCallback, false);

      document.addEventListener('keydown', keyDown, false);
      document.addEventListener('keyup', keyUp, false);
    } else {
      console.log("released lock");
      // Pointer was just unlocked - unregister
      document.removeEventListener("mousemove", moveCallback, false);

      document.removeEventListener("keydown", keyDown, false);
      document.removeEventListener("keyup", keyUp, false);
    }
  };

  document.addEventListener('pointerlockchange', lockChangeCallback, false);
  document.addEventListener('mozpointerlockchange', lockChangeCallback, false);
  document.addEventListener('webkitpointerlockchange', lockChangeCallback, false);
};

FirstPersonControls.prototype.unregister = function() {
  document.exitPointerLock();
  this.element.removeEventListener('click', this.onClick);
};

FirstPersonControls.prototype.update = function() {
  var LRAngle = ( THREE.Math.mapLinear(this.movementXTotal, 0, renderer.domElement.width/2, 0, camera.fov/2 * camera.aspect) ) * Math.PI / 180;
  var UDAngle = ( THREE.Math.mapLinear(this.movementYTotal, 0, renderer.domElement.height/2, 0, -camera.fov/2 ) ) * Math.PI / 180;

  this.azimuth = (this.azimuth + LRAngle) % (Math.PI*2);
  this.altitude = THREE.Math.clamp(this.altitude + UDAngle, -Math.PI/2 * .999, Math.PI/2 * .999);

  var keyMap = {};
  keyMap['W'] = new THREE.Vector2(1, 0);
  keyMap['S'] = new THREE.Vector2(-1, 0);
  keyMap['D'] = new THREE.Vector2(0, 1);
  keyMap['A'] = new THREE.Vector2(0, -1);

  var offset = new THREE.Vector2();
  for(key in this.keyState) {
    if(key in keyMap) { offset.addSelf(keyMap[key]); }
  }
  offset.normalize();
  offset.multiplyScalar(this.speed);
  var offset3 = new THREE.Vector3(offset.x, 0, offset.y);
  var rotationMatrix = new THREE.Matrix4().makeRotationY( -this.azimuth );
  rotationMatrix.multiplyVector3(offset3);

  var offsetCorrect = new THREE.Vector2(offset3.x, offset3.z);

  var velocity = gameworld.playerBody.GetLinearVelocity();
  // var speedDifference = - (this.speed - velocity.Length() );
  var speedDifference = this.speed;
  var movementVector = new b2Vec2(offsetCorrect.x, offsetCorrect.y);
  movementVector.Multiply(speedDifference * gameworld.playerBody.GetMass()); //have to do -1 for some reason; not sure why yet
  gameworld.playerBody.ApplyImpulse(movementVector, gameworld.playerBody.GetPosition());

  // var dragForce = velocity.Copy();
  // dragForce.Multiply(-2);
  // gameworld.playerBody.ApplyForce( dragForce, gameworld.playerBody.GetWorldCenter());


  var bodyPos = gameworld.playerBody.GetPosition();
  this.pos2 = new THREE.Vector2(bodyPos.x, bodyPos.y);

  // this.pos2.x += offset3.x;
  // this.pos2.y += offset3.z;

  var y = this.calculateY(this.pos2);
  this.position = new THREE.Vector3(this.pos2.x, y, this.pos2.y);

  this.movementXTotal = this.movementYTotal = 0;

  camera.position.copy( this.position );
  var heading = new THREE.Vector3(
      Math.cos(this.azimuth) * Math.cos(this.altitude),
      Math.sin(this.altitude),
      Math.sin(this.azimuth) * Math.cos(this.altitude)
      );
  camera.lookAt( this.position.clone().addSelf( heading ) );
};

FirstPersonControls.prototype.calculateY = function(vector) {
  return terrain.getHeight( vector.x, vector.y ) + this.tall;
};
