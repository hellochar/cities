//returns a geometry given an array of geometries or CSGs
function unionGeometries(geoms) {
  var unioned = geoms[0].toGeometry();
  _.rest(geoms).forEach(function (geom) {
    unioned.union(geom);
  });
  return unioned;
}

//returns a CSG given an array of geometries or csgs
function construct(geoms, method) {
  //union, intersection, or subtract

  geoms = _.isArray(geoms) ? geoms : [geoms];
  var csgTotal = geoms[0].toCSG();
  _.rest(geoms).forEach(function (section) {
    var csgSection = section.toCSG();
    csgTotal = csgTotal[method](csgSection);
  });

  return csgTotal;
}

function unioned(geoms) {
  return construct(geoms, "union");
}

function subtracted(geoms) {
  return construct(geoms, "subtract");
}

function intersected(geoms) {
  return construct(geoms, "intersect");
}
