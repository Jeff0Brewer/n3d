attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform vec3 center;
uniform float radius;

void main() {
    vec4 pos = vec4(position * radius + center, 1.0);
    gl_Position = projMatrix * viewMatrix * modelMatrix * pos;
}
