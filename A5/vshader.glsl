#version 300 es

in vec3 aPosition;
uniform mat4 modelMatrix;
uniform mat4 projMatrix;
uniform mat4 camMatrix;

void main() {
    gl_Position = projMatrix * camMatrix * modelMatrix * vec4(aPosition, 1);
}
