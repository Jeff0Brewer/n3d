attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 rotation;
uniform float width;

void main() {
    vec4 pos = rotation * vec4(position.x * width, position.y, position.z * width, 1.0);
    gl_Position = projMatrix * viewMatrix * modelMatrix * pos;
}
