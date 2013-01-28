function Player(gameworld, movespeed, tall, pos) {

  this.movespeed = movespeed || 50;
  this.tall = tall || 5;
  pos = pos || new b2Vec2(0, 0);

  this.health = 100;
  this.items = [];
  this.heldItem = undefined;

  this._altitude = 0; //how "up" or "down" you are looking at [-pi/2-pi/2]; -pi/2 means down at the ground

  var bodyGeom = new THREE.CubeGeometry(2, this.tall, 2).makeTranslation(new THREE.Vector3(0, this.tall/2, 0) );
  var bodyModel = new THREE.Mesh(bodyGeom, new THREE.MeshLambertMaterial({color: 0xff0000}));

  Actor.call(
      this,
      gameworld,
      bodyModel,
      Actor.defaultBodyDef(pos.x, pos.y),
      Actor.defaultFixDef(2)
  );

  this.axis = new THREE.AxisHelper(20);
  this.axis.position.set(0, this.tall, 0);
  this.model.add(this.axis);

  this.setMoveDirection(new b2Vec2());
}

Player.prototype = Object.create( Actor.prototype );
Player.prototype.constructor = Player;

Player.prototype.setModelTransformFromWorld = function () {
  Actor.prototype.setModelTransformFromWorld.call(this);
  if( this.axis ) {
    this.axis.rotation.z = this.altitude();
  }
}

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

  // if(this.heldItem) {

  //   this.heldItem.model.position.copy( this.model.position ).
  //     addSelf(this.heading().setLength(2)).
  //     addSelf(0, this.tall - 1, 0).
  //     addSelf(cameraRight);


  //   this.heldItem.model.rotation.y = -this.azimuth();
  // }

  //grab items near you
  gameworld.items.
    filter(function (item) { return item.pos.clone().subSelf( this.position().toTHREE() ).length() < 3; }, this).
    forEach(this.pickUp, this);

  $('#hp').text(this.health);
  $('#items').html(this.items.map(function (item) { return item.toString() + '<br>'; }));
}

Player.prototype.heading = function() {
  return THREE.Vector3.spherical(this.azimuth(), this.altitude());
}

Player.prototype.pickUp = function(item) {
  this.items.push(item);

  // this.gameworld.actors.remove(this);
  // scene.remove(item.model);
  // this.gameworld.world.DestroyBody(this.body);
  //
  //

  if(this.heldItem === undefined) {
    this.holdItem(item);
  }
}

Player.prototype.holdItem = function(item) {
  if(item === undefined) throw 'noooo';

  this.heldItem = item;

  this.axis.add(item.model);

  item.model.position.set(1.5, -1.5, 1);
  item.model.rotation.set(0, .2, 0);
}
