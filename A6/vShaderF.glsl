#version 300 es
in vec4 aPosition;
in vec3 aNormal;
out vec3 fN;
out vec3 fE;
out vec3 fL;
uniform mat4 modelMatrix;
uniform mat4 camMatrix;
uniform mat4 projMatrix;
uniform vec4 lightPos;

void main() {
    //the vertex in camera coordinates
    vec3 pos = (camMatrix * modelMatrix * aPosition).xyz;
    //the light in camera coordinates
    vec3 lightPosInCam = (camMatrix * lightPos).xyz;
    //normal in camera coordinates
    fN = normalize(camMatrix * modelMatrix * vec4(aNormal, 0)).xyz;
    //the ray from the vertex towards the camera
    fE = normalize(vec3(0, 0, 0) - pos);
    //the ray from the vertex towards the light
    fL = normalize(lightPosInCam.xyz - pos);
    gl_Position = projMatrix * camMatrix * modelMatrix * aPosition;
}