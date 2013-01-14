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
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  this.offsetY = THREE.GeometryUtils.center(geometry).y; //put terrain at y=0

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
  return this.terrainFn(x, z) + this.offsetY; //todo: change to linear interpolation
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
  var base_0 = makeNoiseFunc(6000, 15);
  var base = makeNoiseFunc(2000, 3);
  // var features1 = makeNoiseFunc(480, 1);
  // var features2 = makeNoiseFunc(100, 1);

  var hill = function (x, y) {
    return 2 / Math.pow( Math.pow( (x*x+y*y) / (5000 * 5000), 2) + 1, 2 );
  };
  var hillNoise = makeNoiseFunc(8000, 1);

  return function (x, y) {
    if(debugTerrain === true) return 0;
    var value = (base_0(x, y) + base(x, y) + /* features1(x, y) * (1+features2(x, y))/2 + */ hill(x, y)*(4+hillNoise(x, y))/5) * 100;
    return value;
  };
})();
