function FirstPersonControls(element) { //element should be a canvas
  this.element = element;
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
  var d_azimuth = ( THREE.Math.mapLinear(this.movementXTotal, 0, renderer.domElement.width/2, 0, this.fovx() / 2) ) * Math.PI / 180;
  var d_altitude = ( THREE.Math.mapLinear(this.movementYTotal, 0, renderer.domElement.height/2, 0, -camera.fov/2 ) ) * Math.PI / 180;
  this.movementXTotal = this.movementYTotal = 0;

  gameworld.player.moveHeading(d_azimuth, d_altitude);

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
  gameworld.player.setMoveDirection(offset.toBox2D());

  //move camera to reflect new state
  var pos2 = gameworld.player.position().toTHREE();

  var camera_position = terrain.onTerrain( pos2 );
  camera_position.y += gameworld.player.tall;

  camera.position.copy( camera_position );
  var heading = new THREE.Vector3(
      Math.cos(gameworld.player.azimuth()) * Math.cos(gameworld.player.altitude()),
      Math.sin(gameworld.player.altitude()),
      Math.sin(gameworld.player.azimuth()) * Math.cos(gameworld.player.altitude())
      );
  camera.lookAt( camera_position.clone().addSelf( heading ) );
};

FirstPersonControls.prototype.fovx = function () {
  return camera.fov * camera.aspect;
}
