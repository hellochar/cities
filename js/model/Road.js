// @author zz85
// Boids and Buildings
// http://www.lab4games.net/zz85/blog/2012/11/19/making-of-boids-and-buildings/

// A 3D extension of @mrdoob Map Generator http://jsdo.it/mrdoob/xI3u
// Based on Jared Tarbell's Substrate algorithm concept.
// http://www.complexification.net/gallery/machines/substrate/index.php

// See http://en.wikipedia.org/wiki/Doubly_connected_edge_list
// http://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/
// http://mrl.nyu.edu/~dzorin/ig04/lecture24/meshes.pdf

function Road( x, y, angle, parent, roads, all_roads, context ) {

  var me = this;

  this.start = new THREE.Vector2( x, y );
  this.end = new THREE.Vector2( x, y );

  this.angle = Math.pow( Math.random(), 20 ) + angle;
  this.dx = Math.cos( this.angle );
  this.dy = Math.sin( this.angle );
  this.distance = 0;

  this.dead = false;

  this.leftEdges = [];
  this.rightEdges = [];

  this.speed = window.roadSpeed;

  this.minDist = window.minDist;
  this.maxDist = window.maxDist;
  this.lastDist = 0;

  var rightEdge = new Edge(this.start, this.end);
  var leftEdge = new Edge(this.end, this.start);

  rightEdge.road = me;
  leftEdge.road = me;

  rightEdge.next = leftEdge;
  leftEdge.next = rightEdge; // A source will break this circular link. Only the first road has this.

  this.leftEdges.push(leftEdge);
  this.rightEdges.push(rightEdge);

  var its, its2, e, subEdges, newEdge, edge, i;

  if (parent) {

    this.parent = parent;

    var direction = this.angle - parent.angle;
    var right = direction >= 0;

    subEdges = right ? parent.rightEdges : parent.leftEdges;

    for (e=subEdges.length-1, its2 = null; e >= 0 && !its2;e--) {

      edge = subEdges[e];

      its2 = right ? edge.end.equals(this.start) : edge.start.equals(this.start);

      if ( its2 ) {

        its2 = new THREE.Vector2( x, y );

        newEdge = new Edge(its2, edge.end);
        newEdge.next = edge.next;
        newEdge.road = parent;

        edge.next = rightEdge;
        edge.end = its2;

        leftEdge.next = newEdge;

        subEdges.push(newEdge);

      }

    }

  }

  this.update = function () {


    context.beginPath();
    context.moveTo( x, y );

    var tmpx = this.start.x;
    var tmpy = this.start.y;

    this.distance += this.speed;
    x = this.start.x + this.dx * this.distance;
    y = this.start.y + this.dy * this.distance;

    this.end.set(x, y);

    var deathPoint;

    for (var j=0;j<all_roads.length;j++) {
      b = all_roads[j];

      if (me.dead) continue;
      if (b==me) continue;

      if (b.parent && b.parent==me) continue;
      if (me.parent && me.parent==b) continue;
      if (b.collides && b.collides==me) continue;


      its = intersection(me, b);
      // me.start.set(tmpx, tmpy);

      if (its) {

        // TODO support multiple collisions?

        // Collision detected

        me.collides = b;
        me.kill();

        deathPoint = its;

        var dx1 = b.end.x - b.start.x;
        var dy1 = b.end.y - b.start.y;

        var dx2 = me.start.x - b.start.x;
        var dy2 = me.start.y - b.start.y;

        var da1 = Math.atan2(dy1, dx1); //collided
        var da2 = Math.atan2(dy2, dx2); //this

        var angle = da2 - da1;
        if (angle<-Math.PI) angle += Math.PI * 2;

        right = angle >= 0;

        var meCollidingLeftEdge = null;
        var meCollidingRightEdge = null;
        var subEdges = me.leftEdges;
        meCollidingLeftEdge = subEdges[0];

        subEdges = me.rightEdges;
        for (e=subEdges.length-1;e>=0;e--) {
          edge = subEdges[e];
          if (edge.end==me.end) {
            meCollidingRightEdge = edge;
          }
        }

        subEdges = right ? b.rightEdges : b.leftEdges;


        // We start to split the collided road

        var ccc = 0;

        for (e=subEdges.length-1, its2=null;e>=0 ;e--) {

          edge = subEdges[e];
          its2 = intersection(me, edge);

          if (its2) {

            // debugEdge(edge);

            newEdge = new Edge(its2, edge.end);
            newEdge.next = edge.next;
            meCollidingRightEdge.next = newEdge;
            newEdge.road = b;

            edge.end = its2;
            edge.next = meCollidingLeftEdge;

            subEdges.push(newEdge);
            ccc++;

            me.end.copy(deathPoint);

            // testEdge(newEdge);
            // testEdge(edge);

          }

        }


        // console.assert(ccc == 1, '!?#$$^', ccc);
        // tripleCheck(subEdges[0]);
        // tripleCheck(subEdges[subEdges.length-1]);
        // doubleCheck();

        // if (ccc != 1) continue;


      }
    }


    if (me.dead) {
      me.end.copy(deathPoint);

      context.lineTo( me.end.x, me.end.y );
      context.stroke();
    } else {
      context.lineTo( x, y );
      context.stroke();

    }



  }

  this.kill = function () {

    roads.splice( roads.indexOf( this ), 1 );
    this.dead = true;

  }

}
