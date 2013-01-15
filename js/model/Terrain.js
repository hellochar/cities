function Terrain(width, height, widthSegments, heightSegments, terrainFn) {
  this.width = width;
  this.height = height;

  this.widthSegments = widthSegments;
  this.heightSegments = heightSegments;

  this.terrainFn = terrainFn || Terrain.defaultTerrainFn;

  var geometry = this.geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

  geometry.dynamic = true;

  for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
    var x = geometry.vertices[i].x,
        z = geometry.vertices[i].z,
        y = this.terrainFn(x, z);

    geometry.vertices[i].set(x, y, z);
    // console.log(x+', '+y+', '+z);
  }
  this.offsetY = THREE.GeometryUtils.center(geometry).y; //put terrain at y=0
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  geometry.dynamic = false;

//
//                           0                      width-1
//                            +--------------------+-----> +X
//                            |(-w/2, 0, -h/2)     |(w/2, 0, -h/2)
//                            |                    |
//                            |                    |
//                            |                    |
//                            |                    |
//                            |                    |
//                            |                    |
//                            |                    |
//                            |                    |
//                            (-w/2, 0, h/2)       |(w/2, 0, h/2)
//                            +--------------------+
//            (height-1)*width|                     height*width-1
//                            |
//                            |
//                            |
//                            v
//                           +Z

  // this.data = [];

  // for(var i = 0, l = width * height; i < l; i++) {
  //   var x = -width / 2 + ( i % width ),
  //       z = -height / 2 + ~~( i / width );
  //   data.push(this.terrainFn( x, z ));
  // }

  var material = new THREE.MeshLambertMaterial({color: 0xa2d986, shading: THREE.FlatShading});
  // var material = new THREE.MeshNormalMaterial({shading: THREE.FlatShading});
  // var material = undefined;

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
  this.mesh.name = "Terrain";
};

Terrain.prototype.onTerrain = function (x, z) {
  if(z === undefined && x instanceof THREE.Vector2) {
    z = x.y;
    x = x.x;
  }

  var y = this.getHeight(x, z);
  return new THREE.Vector3( x, y, z );
}

Terrain.prototype.getHeight = function (x, z) {
  if(z === undefined && x instanceof THREE.Vector2) {
    z = x.y;
    x = x.x;
  }

  //get the face you are on, and interpolate between the points of that face

  var geometry = this.geometry;

  var gridX = geometry.widthSegments,
      gridZ = geometry.heightSegments;
  
  var width_half = geometry.width / 2,
      height_half = geometry.height / 2;

  var segment_width = geometry.width / gridX,
      segment_height = geometry.height / gridZ;

  var ix = ~~((x + width_half) / segment_width),
      iz = ~~((z + height_half) / segment_height);
  //ix/iz hold the bottom-left corner index

  var face_idx = ix + iz * gridX;
  var face = geometry.faces[face_idx];

  var top_left = geometry.vertices[face.a],
      bottom_left = geometry.vertices[face.b],
      bottom_right = geometry.vertices[face.c],
      top_right = geometry.vertices[face.d];

  //we go from a->b and d->c, and then from ab -> dc
  var z_interpolation_amt = (z - top_left.z) / segment_height,
      x_interpolation_amt = (x - top_left.x) / segment_width;

  var left_interpolation_y = Math.mapLinear(z_interpolation_amt, 0, 1, top_left.y, bottom_left.y),
      right_interpolation_y = Math.mapLinear(z_interpolation_amt, 0, 1, top_right.y, bottom_right.y);


  var middle_z = Math.mapLinear( x_interpolation_amt, 0, 1, left_interpolation_y, right_interpolation_y);

  return middle_z;

  // return this.terrainFn(x, z) + this.offsetY; //todo: change to linear interpolation
};

//bigger inputScale <=> flatter
function makeNoiseFunc(inputScale, outputScale) {
  var noise = new ClassicalNoise();
  var randomZ = Math.random() * 10000;
  return function(x, y) {
    return (1+noise.noise(x / inputScale, y / inputScale, randomZ))/2 * outputScale;
  }
}

Terrain.defaultTerrainFn = (function (){
  var base_0 = makeNoiseFunc(1500, 150);
  var base = makeNoiseFunc(4, 25);
  // var features1 = makeNoiseFunc(480, 1);
  // var features2 = makeNoiseFunc(100, 1);

  var hill = function (x, y) {
    return 200 / Math.pow( Math.pow( (x*x+y*y) / (1600 * 1600), 2) + 1, 4 );
  };
  var hillNoise = makeNoiseFunc(4000, 1);

  return function (x, y) {
    if(debugTerrain === true) return 0;
    // var value = (base_0(x, y) + base(x, y) + /* features1(x, y) * (1+features2(x, y))/2 + */ hill(x, y)*(4+hillNoise(x, y))/5) * 100;
    // var value = (base_0(x, y) + base(x, y) + hill(x, y)*(4+hillNoise(x, y))/5) * 1;
    var value = (base_0(x, y) + base(x, y) + hill(x, y) * (3+hillNoise(x, y))/4 ) * 1;
    return value;
  };
})();
