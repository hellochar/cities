// @author zz85
// Boids and Buildings
// http://www.lab4games.net/zz85/blog/2012/11/19/making-of-boids-and-buildings/

// ###############

function Edge(v1, v2, next) {
  this.start = v1;
  this.end = v2;
  this.next = next; // Next Edge
  this.offset = v2.clone().subSelf(v1);
}

// ###############

// see http://paulbourke.net/geometry/lineline2d/
function intersection(road1, road2, debug) {
  var x1 = road1.start.x, x2 = road1.end.x, x3 = road2.start.x, x4 = road2.end.x;
  var y1 = road1.start.y, y2 = road1.end.y, y3 = road2.start.y, y4 = road2.end.y;

  var dem = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (dem == 0 ) return;  // lines are parrallel
  var ua_num = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  var ub_num = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

  var ua = ua_num / dem;
  var ub = ub_num / dem;

  if(debug) {
    console.log("isect: "+ua+", "+ub);
  }

  // if ua_num == 0 && ub_num == 0 // lines are the same
  if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
    var x = x1 + ua * (x2 - x1);
    var y = y1 + ua * (y2 - y1);
    var v = new THREE.Vector2( x, y );
    v.ua = ua;
    v.ub = ub;

    return v;
  }

  return;
}

// ############################

function tripleCheck(edge) {
  var start = edge;

  var tmp = [];

  do {
    tmp.push(edge);
    if (edge.visited) {
      console.log('edge should not be visited!!!');
      // debugger;
      // break;
      var p;
      while(p = tmp.pop()) p.visited = false;
      return;
    }

    edge.visited = true;
    edge = edge.next;
  } while (edge != start);


  edge = start;
  do {
    edge.visited = false;
    edge = edge.next;
  } while (edge != start);
}

function testEdge(edge) {
  if (edge.next) {
    var pass =
      (Math.abs(edge.end.x - edge.next.start.x)<2 &&
      Math.abs(edge.end.y - edge.next.start.y)<2);


    console.assert(pass,
      'links failed this', edge.end, edge.next.start, edge);

    if (!pass) debugger;
  }
}

function doubleCheck() {

  all_roads.forEach(function(road) {
    road.rightEdges.forEach(testEdge);
    road.leftEdges.forEach(testEdge);
  });

}


function detectFaces(all_roads) {

  var faceCount = 0;
  var faces = [];

  // context2.clearRect(0, 0, width, height);
  // context2.strokeStyle = 'blue';

  function traverseEdge(edge) {


    if (!edge.visited) {
      var start = edge;
      faceCount++;
      var face = [];

      // var b = edge;
      // context2.beginPath();
      // context2.moveTo(b.start.x,b.start.y);
      // context2.lineTo(b.end.x,b.end.y);
      // context2.stroke();
      // context2.closePath();

      do {
        edge.visited = true;
        face.push(edge);
        edge = edge.next;


        // var b = edge;
        // context2.beginPath();
        // context2.moveTo(b.start.x,b.start.y);
        // context2.lineTo(b.end.x,b.end.y);
        // context2.stroke();
        // context2.closePath();


      } while (edge && edge!==start && !edge.visited );

      // context2.clearRect(0, 0, width, height);

      faces.push(face);
    }
  }

  all_roads.forEach(function(road) {
    road.rightEdges.forEach(traverseEdge);
    road.leftEdges.forEach(traverseEdge);
  });

  return faces;

}

function debugFace(edges) {

  context2.clearRect(0, 0, width, height);
  var r = 1.0;
  edges.forEach(function(b) {
    // context2.strokeStyle = 'yellow';
    context2.strokeStyle = 'rgba(0,0,0,?)'.replace(/[?]/g, r);

    r -= 0.1;
    context2.beginPath();
    context2.moveTo(b.start.x,b.start.y);
    context2.lineTo(b.end.x,b.end.y);
    context2.stroke();
    context2.closePath();

    context2.fillStyle = 'blue';
    context2.beginPath();
    context2.arc(b.start.x,b.start.y,1,0,2*Math.PI);
    context2.fill();
    context2.closePath();

    context2.fillStyle = 'purple';
    context2.beginPath();
    context2.arc(b.end.x,b.end.y,1,0,2*Math.PI);
    context2.fill();
    context2.closePath();
  });

}

function debugEdge(c) {

  context2.strokeStyle = 'pink';
  context2.beginPath();
  context2.moveTo(c.start.x,c.start.y);
  context2.lineTo(c.end.x,c.end.y);
  context2.stroke();
  context2.closePath();

  context2.fillStyle = 'green';
  context2.beginPath();
  context2.arc(c.start.x,c.start.y,2,0,2*Math.PI);
  context2.fill();
  context2.closePath();

  context2.fillStyle = 'red';
  context2.beginPath();
  context2.arc(c.end.x,c.end.y,1,0,2*Math.PI);
  context2.fill();
  context2.closePath();

}

function lerpColor(color1, color2, amount) {
  var color = new THREE.Color();
  color.r = THREE.Math.mapLinear( amount, 0, 1, color1.r, color2.r );
  color.g = THREE.Math.mapLinear( amount, 0, 1, color1.g, color2.g );
  color.b = THREE.Math.mapLinear( amount, 0, 1, color1.b, color2.b );
  return color;
}

//Create a Text Mesh and add it to the Scene
//text: string to be displayed
//loc: Vector3 for the location
function makeText(text, loc, size, height, material) {
  size = size || 40;
  height = height || size / 4;
  var geom = new THREE.TextGeometry(text, {size: size, height: height, font: "helvetiker"});
  material = material || new THREE.MeshNormalMaterial();
  var mesh = new THREE.Mesh(geom, material);
  mesh.position = loc;
  scene.add(mesh);
  return mesh;
}

//Stroke a polygon in the canvas of the global city variable
//vector2s: an array of Vector2 objects describing a polygon
function strokePolygon(vector2s) {
  var ctx = city.context;
  ctx.beginPath();
  vector2s.forEach(function (v) { ctx.lineTo(v.x, v.y); });
  ctx.closePath();
  ctx.stroke();
}

function salvageBadFace(face) {
  //first, collect very similar points together; 
}

function adjacents(arr, wrap) {
  var ret = [];
  wrap = (wrap === undefined ? true : wrap);
  var l = wrap ? arr.length : arr.length - 1;
  for(var i = 0; i < l; i++) {
    ret.push([arr[i], arr[(i+1)%arr.length]]);
  }
  return ret;
}
function debugNormals(obj) {
  var geometry = obj instanceof THREE.Mesh ? obj.geometry : obj;
  function addNormal(loc, dir) {
    var arrow = new THREE.ArrowHelper(dir, loc, dir.length());
    scene.add(arrow);
  }
  geometry.faces.forEach( function (face) { addNormal(face.centroid, face.normal); } );
}

function debugWireframe(obj) {
  var geometry = obj instanceof THREE.Mesh ? obj.geometry : obj;
  var material = new THREE.MeshBasicMaterial({color:0x00ff00, wireframe: true, transparent: true});
  var mesh = new THREE.Mesh(geometry.clone(), material);
  scene.add(mesh);
}

function makeSetDirectionMatrix(up, dir) {
  if(dir === undefined) { //called with one argument: dir only
    dir = up;
    up = new THREE.Vector( 0, 1, 0 );
  }
  var axis = up.clone().crossSelf( dir );

  var radians = Math.acos( up.dot( dir.clone().normalize() ) );

  return new THREE.Matrix4().makeRotationAxis( axis.normalize(), radians );
}

//=======================================================================================
//================================MONKEYPATCHING    ==============================
//=======================================================================================
//Monkeypatch randFloat to make the low optional (default to 0)
//Move THREE.Math into just Math
(function () {
  var _original = window.original = THREE.Math.randFloat;
  THREE.Math.randFloat = function (x, y) {
    if(y === undefined) { // called with only a high
      y = x;
      x = 0;
    }
    return _original.call(THREE.Math, x, y);
  }

  _.extend( Math, THREE.Math );

  Math.randBoolean = function (prob_for_true) { return Math.random() < (prob_for_true || .5); }
})();

//Fix a bug in ArrowHelper.setDirection that makes pointing straight down actually point straight up
(function() {
  var original = THREE.ArrowHelper.prototype.setDirection;
  THREE.ArrowHelper.prototype.setDirection = function ( dir ) {
    if(dir.x === 0 && dir.z === 0 && dir.y < 0) {
      this.matrix = new THREE.Matrix4().makeRotationX( Math.PI );
      this.rotation.setEulerFromRotationMatrix( this.matrix, this.eulerOrder );
    } else {
      original.call(this, dir);
    }
  }

})();

//monkeypatch Geometry with the makeXXX methods from matrix4
(function() {
  for(var name in THREE.Matrix4.prototype) {
    if (THREE.Matrix4.prototype.hasOwnProperty(name)) {

      if(/make/.test(name)) {

        (function () { //wrap code in a surrounding function to copy value of name at this point
          var fnName = name;
          THREE.Geometry.prototype[fnName] = function() {
            var matrix =  new THREE.Matrix4();
            matrix = matrix[fnName].apply(matrix, arguments);
            this.applyMatrix( matrix );
            return this;
          }
        })();

      }

    }
  }
})();

//monkeypatch Shape extrude to go in X/Y directions too
// (function() {
//   THREE.Shape.extrudeY = {
//   }
// })();

//Conversion operations
CSG.prototype.toGeometry = function() {
  return THREE.CSG.fromCSG(this);
}
CSG.prototype.toCSG = function() {
  return this;
}

THREE.Geometry.prototype.toCSG = function() {
  return THREE.CSG.toCSG(this);
}
THREE.Geometry.prototype.toGeometry = function() {
  return this;
}


THREE.Geometry.prototype.union = function(thing) {
  if(thing instanceof CSG) {
    thing = thing.toGeometry();
  }
  THREE.GeometryUtils.merge(this, thing);
  return this;
}

//Monkeypatch array with a few nice methods
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.flatten = function(shallow) {
  return _.flatten(this, shallow);
}

Array.prototype.random = function() {
  return this[_.random(this.length - 1)];
}


//Vector etc.
THREE.Vector2.prototype.wedge = function (b) {
  return this.x * b.y - this.y * b.x;
}

THREE.Vector2.prototype.toString = function() { return "("+this.x+", "+this.y+")"; }

THREE.Vector2.prototype.round = function() { this.x = Math.round(this.x); this.y = Math.round(this.y); return this; }

THREE.Vector3.prototype.toString = function() { return "("+this.x+", "+this.y+", "+this.z+")"; }

THREE.Vector3.prototype.lerp = function(end, amount) {
  return new THREE.Vector3(
      Math.mapLinear(amount, 0, 1, this.x, end.x),
      Math.mapLinear(amount, 0, 1, this.y, end.y),
      Math.mapLinear(amount, 0, 1, this.z, end.z)
      );
}


function makeRandomTree(size) {
  //trunk diameter vs height is about 1/3 - 1/5 for good bulky looking ones

  var trunkLen = Math.randFloat(40, 200);
  if(Math.random() < .01) trunkLen = Math.randFloat(600, 800);
  var trunkRadius = trunkLen / 4;
  var foliageLength = trunkLen * 1.2;
  // var trunkRadius = Math.randFloat(10, 40);
  // var foliageLength = Math.randFloat(30, 80);
  var segments = 3;

  var tree = new Tree(trunkLen, trunkRadius, foliageLength, segments);
  var ang = Math.random()*2*Math.PI;
  var mag = Math.randFloat(worldWidth/4, worldWidth/2);

  var x = Math.cos(ang) * mag,
      z = Math.sin(ang) * mag,
      y = noiseFunc(x, z);
  tree.position.set( x, y, z );
  scene.add(tree);
}
