function Player(gameworld, movespeed, tall, pos) {
  
  this.movespeed = movespeed || 50;
  this.tall = tall || 5;
  pos = pos || new b2Vec2(0, 0);

  this.health = 100;

  this._altitude = 0; //how "up" or "down" you are looking at [-pi/2-pi/2]; -pi/2 means down at the ground

  var model = new THREE.Mesh(new THREE.CubeGeometry(2, this.tall * 10, 2), new THREE.MeshLambertMaterial({color: 0xff0000}));

  Actor.call(
      this,
      gameworld,
      model,
      Actor.defaultBodyDef(pos.x, pos.y),
      Actor.defaultFixDef(2)
  );

  this.setMoveDirection(new b2Vec2());
}

Player.prototype = Object.create( Actor.prototype );

Player.prototype.altitude = function () {
  return this._altitude;
}

Player.prototype.moveHeading = function(d_azimuth, d_altitude) {
  this.body.SetAngle(this.azimuth() + d_azimuth);
  this._altitude = THREE.Math.clamp(this._altitude + d_altitude, -Math.PI/2 * .999, Math.PI/2 * .999);
}

//moveDirection should be a b2Vec2 containing the offset in the local coordinate frame
Player.prototype.setMoveDirection = function(moveDirection) {
  this.moveDirection = moveDirection;
}

Player.prototype.logic = function () {

  //update my state based on input
  var moveDirectionWorld = this.body.GetWorldVector(this.moveDirection);
  moveDirectionWorld.Multiply(this.movespeed);
  moveDirectionWorld.Multiply(this.body.GetMass());
  gameworld.player.body.ApplyImpulse(moveDirectionWorld, this.position());

  $('#hp').text(this.health);
}
