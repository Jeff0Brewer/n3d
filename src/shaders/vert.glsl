attribute vec3 position;
attribute vec3 color;
attribute vec3 selectColor;
attribute float visibility;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 invMatrix;
uniform float devicePixelRatio;
uniform vec2 mousePos;
uniform int selecting;

varying vec3 vColor;
varying float vVisibility;

float distLinePoint(vec3 line0, vec3 line1, vec3 point) {
    return length(cross(point - line0, point - line1)) / length(line1 - line0);
}

void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_PointSize = visibility * (6.0 * devicePixelRatio) / gl_Position.w;
    vVisibility = visibility;
    vColor = color / 255.0;

    if (selecting == 0) { return; }

    vec4 mouseNear = invMatrix * vec4(mousePos, 0.0, 1.0);
    vec4 mouseFar = invMatrix * vec4(mousePos, 1.0, 1.0);
    float mouseDist = distLinePoint(
        mouseNear.xyz / mouseNear.w,
        mouseFar.xyz / mouseFar.w,
        position
    );

    float mouseRange = 0.02 * gl_Position.w;

    if (mouseDist < mouseRange) {
        vColor = selectColor / 255.0;
        gl_PointSize = gl_PointSize + 5.0 * (1.0 - (mouseDist / mouseRange));
    }
}
