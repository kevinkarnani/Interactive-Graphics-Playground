#version 300 es
in vec2 aPosition;
in vec4 aColor;
out vec4 vColor;
uniform mat3 modelMatrix;

void main()
{
    vec3 newPos = modelMatrix * vec3(aPosition, 1.0);
    gl_Position = vec4(newPos, 1.0);
    vColor = aColor;
}