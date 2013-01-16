function GameWorld(terrain, city) {

  this.terrain = terrain;
  this.city = city;

  //the x-z coordinates of the renderer map to the xy coordinates of the game
  var world = this.world = new b2World(
      new b2Vec2(0, 0)    //gravity
      ,  true                 //allow sleep
      );

  //create city blocks
  var bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.position.x = 0;
  bodyDef.position.y = 0;

  var cityBody = world.CreateBody(bodyDef);

  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;
  fixDef.shape = new b2PolygonShape;

  this.city.faces.forEach(function (face) {
    var v2_array = face.vertices;
    fixDef.shape.SetAsArray(v2_array.map(function (three_v2) { return new b2Vec2(three_v2.x, three_v2.y); }), v2_array.length);
    cityBody.CreateFixture(fixDef);
  });

  //create player object

  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.linearDamping = 17;
  // bodyDef.userData =
  this.playerBody = world.CreateBody(bodyDef);

  fixDef.shape = new b2CircleShape(.1); //radius
  fixDef.restitution = 0.5;
  fixDef.friction = 0;
  fixDef.density = 10;

  this.playerBody.CreateFixture(fixDef);

}

GameWorld.prototype.update = function() {

  this.world.Step( 1/60, 10, 10);
  this.world.ClearForces();

  // updateRenderer();
}
