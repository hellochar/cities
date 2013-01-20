function Actor(gameworld, model, bodyDef, fixDef) {
  this.gameworld = gameworld;
  this.model = model;

  this.gameworld.actors.push(this);

  bodyDef.userData = this;
  this.body = gameworld.world.CreateBody(bodyDef);
  this.body.CreateFixture(fixDef);

  scene.add(this.model);
  this.setModelTransformFromWorld();
}

Actor.prototype.setModelTransformFromWorld = function () {
  var bodyVec2 = this.position();
  var posVec3 = this.gameworld.terrain.onTerrain( new THREE.Vector2(bodyVec2.x, bodyVec2.y) );

  this.model.position.copy( posVec3 );

  this.model.rotation.y = -this.azimuth(); //we want the negative angle
}

Actor.prototype.azimuth = function () {
  return this.body.GetAngle() % (Math.PI * 2);
}
Actor.prototype.position = function () {
  return this.body.GetPosition();
}

Actor.prototype.update = function() {
  this.body.SetAngularVelocity(0);
  this.body.SetLinearVelocity(new b2Vec2());

  (this.logic && this.logic());

  this.setModelTransformFromWorld();
}

Actor.prototype.kill = function() {
  this.gameworld.actors.remove(this);

  scene.remove(this.model);
  this.gameworld.world.DestroyBody(this.body);
}

Actor.defaultBodyDef = function (x, y) {
  if(y === undefined) {
    y = x.y;
    x = x.x;
  }
  var bodyDef = new b2BodyDef();
  bodyDef.position.x = x;
  bodyDef.position.y = y;
  bodyDef.type = b2Body.b2_dynamicBody;

  return bodyDef;
}
Actor.defaultFixDef = function (radius) {
  var fixDef = new b2FixtureDef;

  fixDef.shape = new b2CircleShape(radius);
  fixDef.restitution = 0.5;
  fixDef.friction = 0;
  fixDef.density = 1;

  return fixDef;
}
