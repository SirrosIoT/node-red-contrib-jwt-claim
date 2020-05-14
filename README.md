# node-red-contrib-jwt-claim
Node-red node for signing and validating claims-based JWT tokens.

## Functions
* Sign msg.payload, using HS\* algorithm.
* Validate role req.headers.authorization or access_token Bearer var using HS* algorithm.

## Demo Flows

### Sign
This flow starts with the injection of a json in msg.payload, the content will be signed by JWT using the node settings.

![Sign Example](./docs/sign.png)

Flow JSON:
```
[{"id":"4e58c1b1.b55b2","type":"inject","z":"54b30bae.696344","name":"","topic":"","payload":"{\"data\":\"test\",\"roles\":[\"canDelPer\",\"canGetPer\",\"canUpdPer\"]}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":300,"wires":[["77bbdb7e.4ca084"]]},{"id":"2a1d9c33.67c464","type":"debug","z":"54b30bae.696344","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":550,"y":300,"wires":[]},{"id":"77bbdb7e.4ca084","type":"jwt sign","z":"54b30bae.696344","name":"","jwtConf":"66bc45c0.f09b8c","x":360,"y":300,"wires":[["2a1d9c33.67c464"]]},{"id":"66bc45c0.f09b8c","type":"jwt-conf","z":"","name":"jwt","audience":"B1","alg":"HS256"}]
```

### Validate
This flow begins with an http in where the token must be present in the header in the authorization property, or body access_token.

In the next node Jwt Verify checks if the token is valid and if the role corresponds to the token.

![Validate Example](./docs/validate.png)

Flow JSON:
```
[{"id":"4eee469e.94e338","type":"jwt verify","z":"54b30bae.696344","name":"","role":"canUpdPer","jwtConf":"66bc45c0.f09b8c","x":330,"y":320,"wires":[["a81a8ae5.c30fe8","d85d4291.949"]]},{"id":"892ceb57.9dc018","type":"http in","z":"54b30bae.696344","name":"","url":"/get","method":"get","upload":false,"swaggerDoc":"","x":140,"y":320,"wires":[["4eee469e.94e338"]]},{"id":"a81a8ae5.c30fe8","type":"http response","z":"54b30bae.696344","name":"","statusCode":"","headers":{"authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Im5hbWUiOiJTaXJyb3MgSW9UIiwiZW1haWwiOiJzaXJyb3NAc2lycm9zLm5ldCIsInR5cGUiOiJhZG1pbiIsInN0YXR1cyI6MX0sImlhdCI6MTU4OTM4OTU1NiwiZXhwIjoxNTg5NDc1OTU2LCJhdWQiOiJkYXRhbGFrZSJ9.kBRVCERM-gWWqxpKHz-mT6QmTmBmeOgWYWNRNM5pzoE"},"x":550,"y":320,"wires":[]},{"id":"a64683b6.c5b8e","type":"catch","z":"54b30bae.696344","name":"","scope":["4eee469e.94e338"],"uncaught":false,"x":350,"y":400,"wires":[["a81a8ae5.c30fe8"]]},{"id":"d85d4291.949","type":"debug","z":"54b30bae.696344","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":510,"y":240,"wires":[]},{"id":"66bc45c0.f09b8c","type":"jwt-conf","z":"","name":"jwt","audience":"B1","alg":"HS256"}]
```

### Errors
If the token is not valid a formatted response will be returned by the catch node

#### Status code
* 401 - Problem token
* 403 - Token Ok but role not allowed
* 412 - Request without token information

![Erro Example](./docs/error.png)