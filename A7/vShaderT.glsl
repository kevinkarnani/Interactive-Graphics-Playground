#version 300 es
in vec2 aTCoord;
out vec2 texCoord;
in vec4 aPosition;
in vec3 aNormal;
out vec4 color;
uniform mat4 modelMatrix;
uniform mat4 camMatrix;
uniform mat4 projMatrix;
uniform vec4 matAmbient, matDiffuse, matSpecular;
uniform float matAlpha;
uniform vec4 lightAmbient, lightDiffuse, lightSpecular;
uniform vec4 lightPos;

void main() {
    //compute vectors
    //the vertex in camera coordinates
    vec3 pos = (camMatrix * modelMatrix * aPosition).xyz;
    vec3 lightPosInCam = (camMatrix * lightPos).xyz;
    //the ray from the vertex towards the light
    vec3 L = normalize(lightPosInCam.xyz - pos);
    //the ray from the vertex towards the camera
    vec3 E = normalize(vec3(0, 0, 0) - pos);
    //normal in camera coordinates
    vec3 N = normalize(camMatrix * modelMatrix * vec4(aNormal, 0)).xyz;
    //half-way vector
    vec3 H = normalize(L + E);
    //compute colors
    vec4 ambient = lightAmbient * matAmbient;
    float Kd = max(dot(L, N), 0.0);
    vec4 diffuse = Kd * lightDiffuse * matDiffuse;
    float Ks = pow(max(dot(N, H), 0.0), matAlpha);
    vec4 specular = Ks * lightSpecular * matSpecular;
    if(dot(L, N) < 0.0)
        specular = vec4(0, 0, 0, 1);
    color = ambient + diffuse + specular;
    color.a = 1.0;
    gl_Position = projMatrix * camMatrix * modelMatrix * aPosition;
    texCoord = aTCoord;
}