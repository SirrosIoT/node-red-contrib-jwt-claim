module.exports = function (RED) {
    var jwtLib = require('jsonwebtoken');

    class JwtConf {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.name = config.name;
            this.audience = config.audience;
            this.alg = config.alg;
        }
    }

    RED.nodes.registerType(
        "jwt-conf",
        JwtConf,
        {
            credentials: {
                secret: {
                    type: "password"
                }
            }
        });

    class JwtClaimVerify {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.name = n.name;
            this.role = n.role;
            this.jwtConf = n.jwtConf;
            this.config = RED.nodes.getNode(this.jwtConf);

            var node = this;

            node.on('input', function (msg) {
                if (msg.req === undefined) {
                    let error = { statusCode: 412, message: 'request on message not found' };

                    msg['payload'] = error;
                    msg['statusCode'] = error.statusCode;
                    node.error(error.message, msg);
                    return;
                }

                let bearer;

                if (msg.req.get('authorization') !== undefined) {
                    var authz = msg.req.get('authorization').split(' ');
                    if (authz.length == 2 && authz[0] === 'Bearer') {
                        bearer = authz[1];
                    }
                }
                else if (msg.req.query.access_token !== undefined) {
                    bearer = msg.req.query.access_token;
                }
                else if (msg.req.body !== undefined && msg.req.body.access_token !== undefined) {
                    bearer = msg.req.body.access_token;
                }
                else {
                    let error = { statusCode: 412, message: 'authorization header not found' };

                    msg['payload'] = error;
                    msg['statusCode'] = error.statusCode;
                    node.error(error.message, msg);
                    return;
                }

                let secret = process.env.NODE_RED_NODE_JWT_CLAIM_SECRET || node.config.credentials.secret;

                let options = { algorithm: node.config.alg };

                if (node.config.audience)
                    options['audience'] = node.config.audience;

                jwtLib.verify(bearer, secret, options, function (error, decoded) {
                    if (error) {
                        error['statusCode'] = 401;

                        msg['payload'] = error;
                        msg['statusCode'] = error.statusCode;
                        node.error(error, msg);
                    }
                    else {
                        if (node.role !== undefined && node.role !== "" && node.role.length > 0) {
                            if (decoded.roles !== undefined && Array.isArray(decoded.roles)) {
                                if (!decoded.roles.includes(node.role)) {
                                    let error = { name: "Forbidden", statusCode: 403, message: 'you are not allowed role to access this resource' };
                                    msg['payload'] = error;
                                    msg['statusCode'] = error.statusCode;
                                    node.error(error, msg);
                                    return;
                                }
                            }
                            else {
                                let error = { name: "Forbidden", statusCode: 403, message: 'your token does not have roles' };
                                msg['payload'] = error;
                                msg['statusCode'] = error.statusCode;
                                node.error(error, msg);
                                return;
                            }
                        }

                        msg['dataAuth'] = decoded;
                        node.send([msg, null]);
                    }
                });
            });
        }
    }
    RED.nodes.registerType("jwt verify", JwtClaimVerify);

    class JwtClaimSign {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.name = n.name;
            this.config = RED.nodes.getNode(n.jwtConf);

            var node = this;

            node.on('input', function (msg) {
                let secret = process.env.NODE_RED_NODE_JWT_CLAIM_SECRET || node.config.credentials.secret;

                let options = { algorithm: node.config.alg };

                if (msg.aud)
                    options['audience'] = msg.aud;
                else if (node.config.audience)
                    options['audience'] = node.config.audience;

                if (msg.exp) {
                    if (msg.exp > 0)
                        options['expiresIn'] = msg.exp;
                }
                else {
                    options['expiresIn'] = 86400;
                }

                msg.payload['token'] = jwtLib.sign(msg.payload, secret, options);
                node.send([msg, null]);
            });
        }
    }
    RED.nodes.registerType("jwt sign", JwtClaimSign);
};


