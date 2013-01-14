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
              return [this.segment(face, 1, -2), this.segment(face, 2, -1)];
            },
  levels  : function (face, height, inset, thickness, offset) {
              return _.range(0, height, offset).map(function (y) {
                return Builder.level(face, thickness, inset, y);
              });
            },
  corners : function (face, height, extrusion) {
              return face.vertices.map(function (v) {
                var cube = new THREE.CubeGeometry(extrusion*2, height, extrusion*2);
                cube.makeTranslation( terrain.onTerrain(v).addSelf(0, height/2, 0) );
                return cube;
              });
            },
  insignias : function (face, shape, sectionWidth, insetAmount, yPos) {
                yPos = yPos || 0;
                var features = [];
                return face.getEdges().map(function (edge) {
                  var numSections = ~~(edge.offset.length() / sectionWidth);
                  var remainder = numSections * sectionWidth - edge.offset.length();

                  return _.range(numSections).map(function (i) {
                    var geom = shape.extrude({amount: insetAmount * 2, bevelEnabled: false});
                    geom.makeTranslation( new THREE.Vector3( 0, yPos, -insetAmount) );

                    var loc = terrain.onTerrain( edge.start.clone().addSelf( edge.offset.clone().setLength(sectionWidth * (i + .5)) ) );
                    var matrix = new THREE.Matrix4();
                    matrix.translate(loc);
                    matrix.rotateY( -Math.atan2( edge.offset.y, edge.offset.x ) );

                    geom.applyMatrix( matrix );
                    return geom;
                  });

                });
              },
};

function randomBuilding(face, height) {
  var sections = [];

  var baseInset = Math.randFloat(0, 15);

  if(Math.randBoolean()) sections.push(Builder.segment(face, height, baseInset));

  if(Math.randBoolean(.25)) sections.push(Builder.levels(face, height, Math.randFloat(-2, baseInset), Math.randFloat(1, 10), Math.randFloat(15, 40)));

  if(Math.randBoolean()) sections.push(Builder.stairs(face));

  if(Math.randBoolean()) sections.push(Builder.corners(face, height, Math.randFloat(2, 10)));


  if(false) {
    for(var i = 0; i < 3; i++) {
      if(Math.randBoolean()) { //insignia
        var insignia_width = Math.randFloat(10, 50),
            insginia_height = Math.randFloat(5, 25);
        var shape = (_.values(Insignias).random())(insginia_width, insignia_height);

        var sectionWidth = width * Math.randFloat(.5, 3);
        (function () {
          var edge_lengths = face.getEdges().map(function (x) { return x.offset; }),
              longest_edge = _.max(edge_lengths);
          var num = ~~(longest_edge / sectionWidth);
          if(num > 10) { //too computationally expensive
            sectionWidth *= 3;
          }
        })();

        var insetAmount = Math.randFloat(5, baseInset*2);
        var yPos = Math.randFloat(20*i, height - insignia_height);

        var insignias = Builder.insignias(face, shape, sectionWidth, insetAmount, yPos);
        
        sections.push(insignias);
      }
    }
  }

  var built = unioned(_.flatten(sections));

  return built.toGeometry();
}

function simpleBuilding(face, height) {
  var sections = [
    Builder.segment(face, height, 0),
    ];

  var built = unioned(_.flatten(sections));

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

