//a set of vertices defined in clockwise order
function Face(obj) {
  if(obj[0] instanceof Edge) {
    this.vertices = obj.map(function (e) { return e.start; });
  } else if(obj[0] instanceof THREE.Vector2) {
    this.vertices = obj;
  } else {
    throw 'unknown input type ' + obj;
  }
  //detect and reverse ccw orderings
  if( this.vertices[1].clone().subSelf(this.vertices[0]).wedge(
      this.vertices[2].clone().subSelf(this.vertices[1]) ) < 0 ){
    console.log("ccw!");
    this.vertices.reverse();
  }
}

Face.prototype._extrude = function (height, sloped, correctionFn) {
  var shape = new THREE.Shape( this.vertices );

  var extrusionSettings = {
    bevelEnabled: false,
    amount: height,
  };

  var geom = shape.extrude(extrusionSettings);

  correctionFn(geom);

  if(sloped) {
    geom.dynamic = true;
    geom.vertices.forEach(function (v) {
      v.setY( v.y + terrain.getHeight(v.x, v.z) );
    });
    geom.computeFaceNormals();
    geom.computeCentroids();
    geom.dynamic = false;
  } else {
    console.log( 'need to implement' );
  }

  return geom;
}
// Face.prototype._extrudeHandle

Face.prototype.extrudeZ = function (height, sloped) {
  return this._extrude(height, sloped, function (geom) {
    //do nothing to the geom; it's already correct
  });
}

Face.prototype.extrudeY = function (height, sloped) {
  return this._extrude(height, sloped, function (geom) {
    var matrix = new THREE.Matrix4();
    matrix.rotateX( Math.PI / 2);
    matrix.scale( new THREE.Vector3( 1, 1, -1 ) );
    geom.applyMatrix( matrix );

    //we've scaled by -1 so all the face orderings are reversed (i.e. they're left-handed instead of righthanded); reverse the ordering
    geom.faces.forEach(function (x) {
      if(x instanceof THREE.Face3) {
        var newA = x.c,
      newB = x.b,
      newC = x.a;
    x.a = newA;
    x.b = newB;
    x.c = newC;
      } else if(x instanceof THREE.Face4) {
        var newA = x.d,
      newB = x.c,
      newC = x.b,
      newD = x.a;
    x.a = newA;
    x.b = newB;
    x.c = newC;
    x.d = newD;
      }
    });
  });
};

Face.prototype.getInset = function(insetAmount) {
  var vertices = this.vertices;
  var insetVertices = [];
  for(var i = 0, l = vertices.length; i < l; i++) {
    var last_idx = (i - 1 + l) % l;
    var this_idx = i;
    var next_idx = (i + 1) % l;

    var last_pt = vertices[last_idx];
    var this_pt = vertices[this_idx];
    var next_pt = vertices[next_idx];

    var prev_offset = this_pt.clone().subSelf(last_pt);
    var next_offset = next_pt.clone().subSelf(this_pt);

    function getInset(offset) {
      var angle = Math.atan2( offset.y, offset.x ) + Math.PI / 2;
      return new THREE.Vector2( insetAmount * Math.cos(angle), insetAmount * Math.sin(angle) );
    }
    var prev_inset = getInset(prev_offset);
    var next_inset = getInset(next_offset);

    var inset_pt = this_pt.clone().addSelf( prev_inset ).addSelf( next_inset );
    insetVertices.push( inset_pt );
  }
  return new Face(insetVertices);
};

Face.prototype.selfIntersects = function(debug) { //array of vertices or edges
  var edges = this.getEdges();
  for(var i = 0; i < edges.length; i++) {
    for(var j = i+1; j < edges.length; j++) {
      if(edges[i].next === edges[j] || edges[j].next === edges[i]) continue;
      var isect = intersection(edges[i], edges[j]);
      if(debug && isect !== undefined) console.log(i+", "+j);
      if(isect !== undefined) return true;
    }
  }
  return false;
};

Face.prototype.isConcave = function() { return ! this.isConvex(); }

Face.prototype.isConvex = function() {
  var adj_edges = adjacents(this.getEdges(), true);
  return _.every(adj_edges, function (edge_pair) {
    var e1 = edge_pair[0],
        e2 = edge_pair[1];
    return e1.offset.wedge(e2.offset) > 0;
  });
}

Face.prototype.getEdges = function() {
  var edges = [];
  for(var i = 0, l = this.vertices.length; i < l; i++) {
    var this_idx = i;
    var next_idx = (i + 1) % l;

    var this_pt = this.vertices[this_idx];
    var next_pt = this.vertices[next_idx];

    var edge = new Edge(this_pt, next_pt);

    if(this_idx > 0) edges[this_idx - 1].next = edge;

    edges.push(edge);
  }
  _.last(edges).next = edges.x;
  return edges;
};

Face.prototype.getCentroid = function() {
  var polyarea = this.getArea();

  var centroid = new THREE.Vector2();

  var e1, e2;
  for (var i=0; i < this.vertices.length-1 ; i++) {
    e1 = this.vertices[i];
    e2 = this.vertices[i+1];

    centroid.x += (e1.x + e2.x) * (e1.x*e2.y-e2.x*e1.y);
    centroid.y += (e1.y + e2.y) * (e1.x*e2.y-e2.x*e1.y);
  }

  centroid.divideScalar( 6 * polyarea );

  return centroid;
};

Face.prototype.getArea = function() {

  var n = this.vertices.length;
  var a = 0.0;

  for( var p = n - 1, q = 0; q < n; p = q++ ) {
    a += this.vertices[ p ].x * this.vertices[ q ].y - this.vertices[ q ].x * this.vertices[ p ].y;
  }

  return a * 0.5;
};

["addSelf", "subSelf", "multiplyScalar", "divideScalar"].forEach(function (fnName) {

  Face.prototype[fnName] = function(arg) {

    var newVertices = this.vertices.map(function (v) { return (v.clone())[fnName](arg); });

    return new Face(newVertices);
  };

});

Face.prototype.terrainVertices = function() {
  return this.vertices.map(function (v) {
    return terrain.onTerrain(v);
  });
}

Face.prototype.terrainEdges = function() {
  return this.getEdges().map(function (e) {
    e.start = terrain.onTerrain(e.start);
    e.end = terrain.onTerrain(e.end);
    e.offset = e.end.clone().subSelf(e.start);
    return e;
  });
}

//returns a Face object
Face.getConvexHull = function(vertices) {
  //taken from http://blogs.infoecho.net/echo/2007/03/13/demonstrate-quickhull-implementation-in-javascript/
  function getDistant(cpt, bl) {
    Vy = bl[1][0] - bl[0][0];
    Vx = bl[0][1] - bl[1][1];
    return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]))
  }


  function findMostDistantPointFromBaseLine(baseLine, points) {
    var maxD = 0;
    var maxPt = [];
    var newPoints = [];
    for(var idx = 0; idx < points.length; idx++) {
      var pt = points[idx];
      var d = getDistant(pt, baseLine);

      if ( d > 0) {
        newPoints.push(pt);
      } else {
        continue;
      }

      if ( d > maxD ) {
        maxD = d;
        maxPt = pt;
      }

    }
    return {'maxPoint':maxPt, 'newPoints':newPoints};
  }




  function buildConvexHull(baseLine, points) {

    var convexHullBaseLines = [];
    var t = findMostDistantPointFromBaseLine(baseLine, points);
    if (t.maxPoint.length) {
      convexHullBaseLines = convexHullBaseLines.concat( buildConvexHull( [baseLine[0],t.maxPoint], t.newPoints) );
      convexHullBaseLines = convexHullBaseLines.concat( buildConvexHull( [t.maxPoint,baseLine[1]], t.newPoints) );
      return convexHullBaseLines;
    } else {
      return [baseLine];
    }
  }

  function getConvexHull(points) {
    //find first baseline
    var maxX, minX;
    var maxPt, minPt;
    for(var idx = 0; idx < points.length; idx++) {
      var pt = points[idx];
      if (pt[0] > maxX || !maxX) {
        maxPt = pt;
        maxX = pt[0];
      }
      if (pt[0] < minX || !minX) {
        minPt = pt;
        minX = pt[0];
      }
    }
    var ch = [].concat(buildConvexHull([minPt, maxPt], points),
                       buildConvexHull([maxPt, minPt], points));
      return ch;
  }

  var points = vertices.map(function (v2) { return [v2.x, v2.y]; });

  var hull = getConvexHull(points);

  var vertices = hull.map(function (edge) { return new THREE.Vector2(edge[0][0], edge[0][1]); });

  return new Face(vertices);
}
