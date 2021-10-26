#version 300 es
out vec3 texCoord;
in vec4 aPosition;
uniform mat4 modelMatrix;
uniform mat4 camMatrix;
uniform mat4 projMatrix;

void main() {
    gl_Position = projMatrix * camMatrix * modelMatrix * aPosition;
    texCoord = normalize(aPosition.xyz);
}