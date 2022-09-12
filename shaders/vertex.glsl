varying vec2 vUv;
varying vec2 vCoordinates;
attribute vec3 aCoordinates;

void main() {
	vUv = uv;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_PointSize = 2000. * (1. / - mvPosition.z);
	gl_Position = projectionMatrix * mvPosition;

	vCoordinates = aCoordinates.xy;
}
