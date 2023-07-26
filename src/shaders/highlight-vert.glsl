attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform float devicePixelRatio;

void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_PointSize = (6.0 * devicePixelRatio) / gl_Position.w;
}
