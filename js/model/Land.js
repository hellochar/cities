
// @author zz85
// Boids and Buildings
// http://www.lab4games.net/zz85/blog/2012/11/19/making-of-boids-and-buildings/

function Land(width, height, done, options) {
  this.width = width;
  this.height = height;

  options = options || {};
  window.minDist = options.minDist || 5;
  window.maxDist = options.maxDist || 15;
  window.roadSpeed = options.roadSpeed || 1;
  var 
    ROAD_FREQUENCY = options.frequency || 0.12,
    CURRENT_ROAD_LIMIT = options.limit || 40,
    TOTAL_ROAD_LIMIT = options.max || 300;

  var roads = [];
  var all_roads = [];

  var canvas = document.createElement( 'canvas' );
  canvas.width = width;
  canvas.height = height;

  var context = canvas.getContext( '2d' );

  this.context = context;
  this.canvas = canvas;
  this.all_roads = all_roads;

  // context.strokeStyle = '#999999';

  this.init = function() {

    // Create 4 custom roads for the boundaries
    var b1 = new Road(null, null, null, null, roads, all_roads, context);
    var b2 = new Road(null, null, null, null, roads, all_roads, context);
    var b3 = new Road(null, null, null, null, roads, all_roads, context);
    var b4 = new Road(null, null, null, null, roads, all_roads, context);

    // Dead roads
    b1.dead = b2.dead = b3.dead = b4.dead = true;

    // Starting points
    b1.start.set(0, 0);
    b2.start.set(width, 0);
    b3.start.set(width, height);
    b4.start.set(0, height);

    // Ending Points
    b1.end = b2.start;
    b2.end = b3.start;
    b3.end = b4.start;
    b4.end = b1.start;

    b1.collides = b2;
    b2.collides = b3;
    b3.collides = b4;
    b4.collides = b1;

    all_roads.push( b1 );
    all_roads.push( b2 );
    all_roads.push( b3 );
    all_roads.push( b4 );

    var e1 = new Edge(b1.start, b1.end);
    var e2 = new Edge(b2.start, b2.end);
    var e3 = new Edge(b3.start, b3.end);
    var e4 = new Edge(b4.start, b4.end);

    e1.next = e2;
    e2.next = e3;
    e3.next = e4;
    e4.next = e1;

    e1.road = b1;
    e2.road = b2;
    e3.road = b3;
    e4.road = b4;

    b1.rightEdges = [e1];
    b2.rightEdges = [e2];
    b3.rightEdges = [e3];
    b4.rightEdges = [e4];

    b1.leftEdges =
    b2.leftEdges =
    b3.leftEdges =
    b4.leftEdges = [];

    // Start the first road

    var b = new Road( width / 2, height / 2, ~~(Math.random() * 4) * 90 * Math.PI / 180,
    null, roads, all_roads, context );

    roads.push( b );
    all_roads.push( b );

  }

  this.update = function() {
    var i = roads.length;

    if (i == 0) {
      done && done(this);
    }

    for (i = 0; i < roads.length; i ++ ) {

      var road = roads[ i ];
      road.update();
      if(road.dead) continue;
      if(roads.length >= CURRENT_ROAD_LIMIT || all_roads.length >= TOTAL_ROAD_LIMIT) continue;
      if(road.distance - road.lastDist < road.minDist) continue;

      if (Math.random() < ROAD_FREQUENCY || road.distance - road.lastDist > road.maxDist) {

        b = new Road(
          road.end.x,
          road.end.y, // Same position
          ( Math.random() > 0.5 ? 90 : - 90 ) // left or right
           * Math.PI / 180 + road.angle, // of the current angle
           road, // parent
           roads,
           all_roads,
           context
        );

        road.lastDist = road.distance;

        roads.push( b );
        all_roads.push( b );

      }

    }
  }

}
