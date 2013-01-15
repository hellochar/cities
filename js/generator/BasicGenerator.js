Builder = {
  segment : function (face, height, inset) {
              height = height || Math.randFloat(25, 75);
              inset = inset || 0;
              return face.getInset(inset).extrudeY(height, true);
            },
  level   : function (face, thickness, inset, yPos) {
              thickness = thickness || 3;
              inset = inset || -2;
              yPos = yPos || 15;
              var seg = this.segment(face, thickness, inset);
              seg.makeTranslation( new THREE.Vector3( 0, yPos, 0 ) );
              return seg;
            },
  stairs  : function (face) {
              return [this.segment(face, .5, -1), this.segment(face, 1, -.5)];
            },
  levels  : function (face, height, inset, thickness, offset) {
              return _.range(0, height, offset).map(function (y) {
                return Builder.level(face, thickness, inset, y);
              });
            },
  corners : function (face, height, inset, outset) {
              return face.getInset(inset).vertices.map(function (v) {
                var cube = new THREE.CubeGeometry(outset*2, height, outset*2);
                cube.makeTranslation( terrain.onTerrain(v).addSelf(0, height/2, 0) );
                return cube;
              });
            },
  perimeter : function (face, outset, thickness, yPos) {
                outset = outset || 0;
                thickness = thickness || 1;
                yPos = yPos || 3;
                return face.getInset(-outset).terrainEdges().map(function (edge3) {
                  var length = edge3.offset.length() + thickness / 2;
                  var geom = new THREE.CubeGeometry(thickness, length, thickness);

                  geom.makeTranslation( new THREE.Vector3( 0, length/2, 0 ) );
                  geom.applyMatrix( makeSetDirectionMatrix( new THREE.Vector3(0, 1, 0), edge3.offset ) );
                  geom.makeTranslation(edge3.start.clone().addSelf(0, yPos, 0));

                  return geom;
                });
              },
  insignias : function (face, shape, sectionWidth, insetAmount, yPos) {
                // return []; //DEBUG IT
                yPos = yPos || 0;
                var features = [];
                var baseGeom = shape.extrude({amount: insetAmount * 2, bevelEnabled: false});
                return face.getEdges().map(function (edge) {
                  var numSections = ~~(edge.offset.length() / sectionWidth);
                  var remainder = numSections * sectionWidth - edge.offset.length();

                  console.log("making "+numSections+" insignias");

                  return _.range(numSections).map(function (i) {
                    var geom = baseGeom.clone();
                    geom.makeTranslation( new THREE.Vector3( 0, yPos, -insetAmount) );

                    var matrix = new THREE.Matrix4();
                    // matrix.translate( new THREE.Vector3( 0, yPos, -insetAmount) );
                    var loc = terrain.onTerrain( edge.start.clone().addSelf( edge.offset.clone().setLength(sectionWidth * (i + .5)) ) );
                    matrix.translate(loc);
                    matrix.rotateY( -Math.atan2( edge.offset.y, edge.offset.x ) );

                    geom.applyMatrix( matrix );
                    return geom;
                  });

                });
              },
};

Builder.randomBuilding = function(face, height) {
  console.log("making sections...");
  var sections = [];

  var baseInset = Math.randFloat(0, 15);

  if(Math.randBoolean(.75)) sections.push(Builder.segment(face, height, baseInset));

  if(true) sections.push(Builder.perimeter(face));

  if(Math.randBoolean()) sections.push(Builder.levels(face, height, Math.randFloat(-2, baseInset), Math.randFloat(1, 10), Math.randFloat(15, 40)));

  if(Math.randBoolean()) sections.push(Builder.stairs(face));

  if(Math.randBoolean()) {
    var inset = Math.randFloat(0, baseInset),
        outset = Math.randFloat(inset/2, inset);
    console.log("inset: "+inset+", outset: "+outset);
    sections.push(Builder.corners(face, height, inset, outset));
  }

  if(Math.randBoolean()) {
    var num = 3;
    var edge_lengths = face.getEdges().map(function (x) { return x.offset; }),
        longest_edge = _.max(edge_lengths);

    for(var i = 0; i < num; i++) {
      if(Math.randBoolean(1 / num)) { //insignia
        var insignia_width = Math.randFloat(10, 50),
            insignia_height = insignia_width * Math.randFloat(.5, 2);
        var shape = (_.values(Insignias).random())(insignia_width, insignia_height);

        var sectionWidth = insignia_width * Math.randFloat(1, 3);
        (function () {
          var num = ~~(longest_edge / sectionWidth);
          console.log("insignias: "+num);
          if(num > 10) { //too computationally expensive
            sectionWidth *= 3;
          }
        })();

        var insetAmount = Math.randFloat(2, baseInset);
        var yPos = Math.randFloat(20*i, height - insignia_height);

        var insignias = Builder.insignias(face, shape, sectionWidth, insetAmount, yPos);
        
        sections.push(insignias);
      }
    }
  }

  console.log("finished sections. Unioning...");

  var built = unionGeometries(_.flatten(sections));
  console.log("finished union");

  return built.toGeometry();
}

Builder.simpleBuilding = function(face, height) {
  // (face, shape, sectionWidth, insetAmount, yPos)
  var sections = [
    // Builder.segment(face, height, 0),
    Builder.perimeter(face),
    Builder.insignias(face, Insignias.archway(10, 10), 40, 5, 0),
    ];

  console.log("       finished building sections");

  var built = unionGeometries(_.flatten(sections));

  console.log("       finished union");

  return built.toGeometry();
}


Insignias = {
  rect    : function (width, height) { //occupies [-width/2, width/2] and [0, height]
              var rectShape = new THREE.Shape();

              rectShape.moveTo(-width/2, 0);
              rectShape.lineTo(width/2, 0);
              rectShape.lineTo(width/2, height);
              rectShape.lineTo(-width/2, height);

              return rectShape;
            },
  fan     : function (width) { //occupies [-width/2, width/2] and [0, width]
              var fanShape = new THREE.Shape();

              var radius = width / 2;

              fanShape.moveTo(0, 0);
              fanShape.arc(0, radius, radius, 0, Math.PI, false);

              return fanShape;
            },
  archway : function (width, height) { //occupies [-width/2, width/2] and [0, height+width/2]
              var archShape = new THREE.Shape();

              var radius = width/2;

              archShape.moveTo(-radius, height);
              archShape.lineTo(-radius, 0);
              archShape.lineTo(radius, 0);
              archShape.lineTo(radius, height);

              var angleOffset = 5 / (2 * Math.PI * radius);
              for(var angle = angleOffset; angle < Math.PI; angle += angleOffset ) {
                archShape.lineTo( radius * Math.cos(angle), radius * Math.sin(angle) + height);
              }
              // archShape.arc(0, 0, width/2, .2, .8, false);

              return archShape;
            },

};


City.builders.push(Builder.randomBuilding);
