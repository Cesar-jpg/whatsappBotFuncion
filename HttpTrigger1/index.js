const https = require('https');
let message_body;
let e_ubicacion = String.fromCodePoint(0x1F4CD), e_telefono = String.fromCodePoint(0x260E), e_mapa = String.fromCodePoint(0x1F5FA), e_reloj = String.fromCodePoint(0x1F553);
let mensaje, phone_number_id,from,idmsg;

const VERIFY_TOKEN = "prueba";
const WHATSAPP_TOKEN = "EAAMkdeprlb8BAGxaF4JiA1CoZCwvcpcWZCwrhwHkjONNtYDBxZBx3MLM1b5TPVB2LmOJarAN3ZCmsJF587WhixdfkjbZA3qurcp6emMcVvJMLVZBZCZBHaCKJjYCmZAL1668BtxyZBR0lzcCr7Rym5hRp0ltxTjE04EbU2lZApsvP0QnUeEe0njQ4jBZBZC7G3s9dlmNZA0THIBLo2vACoX9tpXiQ9";
module.exports = async function (context, req) {
    let response;
    //get para poder usar el enlace en facebook
    if (req.method == "GET") {
        // https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
        // to learn more about GET request for webhook verification
        let queryParams = req.query;
        if (queryParams != null) {
            const mode = queryParams["hub.mode"];
            if (mode == "subscribe") {
                const verifyToken = queryParams["hub.verify_token"];
                if (verifyToken == VERIFY_TOKEN) {
                    let challenge = queryParams["hub.challenge"];
                    response = {
                        "status": 200,
                        "body": parseInt(challenge)
                    };
                } else {
                    const responseBody = "Error, wrong validation token";
                    response = {
                        "status": 403,
                        "body": JSON.stringify(responseBody)
                    };
                }
            } else {
                const responseBody = "Error, wrong mode";
                response = {
                    "status": 403,
                    "body": JSON.stringify(responseBody)
                };
            }
        }
        else {
            const responseBody = "Error, no query parameters";
            response = {
                "status": 403,
                "body": JSON.stringify(responseBody)
            };
        }
    } else if (req.method == "POST") {
        //si no se necesita ingresar de nuevo el webhook entra a esta parte
        let body = req.body;
        let entries = body.entry;
        for (let entry of entries) {
            for (let change of entry.changes) {
                let value = change.value;
                if (value != null) {
                    phone_number_id = value.metadata.phone_number_id;
                    if (value.messages != null) {
                        for (let message of value.messages) {
                            //en este if solo confirma que exista un mensaje, ya sea por el cliente o por una opcion predeterminada
                            if (message.type === 'text' || message.type === 'interactive') {
                                //ya que existe un mensaje entra aqui, type text es para los mensajes que haya enviado directamente el cliente
                                //el interactive es para mensajes que ya estaban predeterminados en la lista 
                                if (message.text == null) {
                                    message_body = message.interactive.list_reply.title;
                                } else {
                                    message_body = message.text.body;
                                }
                                from = message.from;
                                idmsg = message.id; //el id del mensaje al que se quiere responder
                                ////////////////////////////////
                                mensaje = message_body.toUpperCase();//convierte todos los mensajes entrantes a mayusculas
                                context.log(mensaje);
                                //estos son los IF del menu
                                if (mensaje == "HOLA" || mensaje == "BUENOS DIAS" || mensaje == "BUENAS TARDES" || mensaje == "BUENAS NOCHES" || mensaje == "DISCULPE") {
                                    sendResMenu(phone_number_id, WHATSAPP_TOKEN, from);
                                } else if (mensaje == "CONSULTAR PRODUCTO") {
                                    sendResProd(phone_number_id, WHATSAPP_TOKEN, from, idmsg);
                                } else if (mensaje == "HORARIO") {
                                    //await sendResHorario(phone_number_id, WHATSAPP_TOKEN, from, idmsg);
                                    sendSucMenu(phone_number_id, WHATSAPP_TOKEN, from);
                                }

                                else {
                                    menu_de_ciudades();
                                    //primer consulta//
                                    //Esta consulta se trae el texto que el cliente escribio por medio de un GET para el API en amazon
                                    const inhttps1 = require("http");
                                    let url1 = 'http://sysc-mbr.trevino.mx/index.php/web/whatsApp_catalogo/nopartesWhastapp/BUSQUEDA?parte=' + mensaje;
                                    function getnoparte() {
                                        return new Promise((resolve, reject) => {
                                            const req = inhttps1.get(url1, res => {
                                                let rawData = '';
                                                res.on('data', chunk => {
                                                    rawData += chunk;
                                                });
                                                res.on('end', () => {
                                                    try {
                                                        resolve(JSON.parse(rawData));
                                                    } catch (err) {
                                                        reject(new Error(err));
                                                    }
                                                });
                                            });
                                            req.on('error', err => {
                                                reject(new Error(err));
                                            });
                                        });
                                    }
                                    const result1 = await getnoparte(); //se ejecuta la funcion
                                    let resNoparte1 = JSON.stringify(result1); //se trae en un string
                                    let parsedResult1 = JSON.parse(resNoparte1);//se convierte en un array para poder sacar el numero de parte para la segunda funcion
                                    //termina primer consulta//
                                    //segunda consulta//
                                    const inhttps = require("http");
                                    let url = 'http://sysc-mbr.trevino.mx/index.php/syscontrol/obtener/noparte_info?noparte=' + parsedResult1[0].noparte;
                                    function getInfo() {
                                        return new Promise((resolve, reject) => {
                                            const req = inhttps.get(url, res => {
                                                let rawData = '';
                                                res.on('data', chunk => {
                                                    rawData += chunk;
                                                });
                                                res.on('end', () => {
                                                    try {
                                                        resolve(JSON.parse(rawData));
                                                    } catch (err) {
                                                        reject(new Error(err));
                                                    }
                                                });
                                            });
                                            req.on('error', err => {
                                                reject(new Error(err));
                                            });
                                        });
                                    }
                                    const result = await getInfo();
                                    let resNoparte = JSON.stringify(result);
                                    let parsedResult = JSON.parse(resNoparte);
                                    context.log(parsedResult);
                                    //mensaje construido por las consultas//
                                    let reply_message = "*Producto:* " + parsedResult[0].noparte + "\n" + "*Descripcion:* " + parsedResult1[0].descripcion + "\n" + "*Costo:* " + parsedResult[0].level4 + " SIN IVA INCLUIDO";
                                    let reply_img = parsedResult[0].ruta_imagen;//esto es solo para sacar la imagen por aparte del mensaje
                                    // termina mensaje//
                                    //envia la respuesta
                                    if (parsedResult[0].noparte == 'GEN-JERSEY' || parsedResult[0].noparte == null)//cuando la consulta en la BDD no encuentra el archivo siempre arroja este producto
                                    //asi que se usa para los mensajes que no reconozca y envia un mensaje de error 
                                    {
                                        await sendMsgErro(phone_number_id, WHATSAPP_TOKEN, from, idmsg);
                                        const palabras = mensaje.split(" ");                                        //en caso de ser algun tipo de query en el GET entonces convierte en array el string y busca las palabras dentro del IF
                                        //en caso de encontrar alguna palabra entonces borrara el texto y guardara el numero y texto ingresado en un LOG
                                        for (let i = 0; i < palabras.length; i++) {
                                            palabras[i];
                                            if (palabras[i] == 'INSERT' || palabras[i] == "DELETE" || palabras[i] == "DROP" || palabras[i] == "ALTER" || palabras[i] == "UPDATE" || palabras[i] == "QUERY") {
                                                context.log(mensaje + '<>' + from);
                                                reply_message = "";
                                                const responseBody = "Error";
                                                response = {
                                                    "status": 500,
                                                    "body": JSON.stringify(responseBody)
                                                };
                                            }
                                        };

                                    }
                                    const palabras = mensaje.split(" ");
                                    for (let i = 0; i < palabras.length; i++) {
                                        palabras[i];
                                        if (palabras[i] == 'VALVOLINE' || palabras[i] == 'VAL') {
                                            reply_img = 'https://media.istockphoto.com/id/1216251206/vector/no-image-available-icon.jpg?s=170667a&w=0&k=20&c=N-XIIeLlhUpm2ZO2uGls-pcVsZ2FTwTxZepwZe4DuE4=';
                                        }
                                    }
                                    await sendReply(phone_number_id, WHATSAPP_TOKEN, reply_message, reply_img, from, idmsg);
                                    const responseBody = "Done";
                                    response = {
                                        "status": 200,
                                        "body": JSON.stringify(responseBody)
                                    };
                                }
                            }
                            /////////////////////////////////
                        }
                    }
                }
            }
        }
    } else {
        const responseBody = "Unsupported method";
        response = {
            "status": 403,
            "body": JSON.stringify(responseBody),
            "isBase64Encoded": false
        };
    }
    context.res = response;
};
//funcion que envia las respuestas 
const sendReply = (phone_number_id, whatsapp_token, reply_message, reply_img, to, id) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        context: {
            message_id: id
        },
        type: "image",
        image: {
            link: reply_img,
            caption: reply_message
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    console.log(options);
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => {
        });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
//esta opcional, para agregar la opcion de "menu" para el cliente
const sendResMenu = (phone_number_id, whatsapp_token, to) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: "Bienvenido"
            },
            body: {
                text: "Soy tu asistente virtual y hoy tengo las siguientes opciones disponibles:"
            },
            footer: {
                text: "Treviño refacciones"
            },
            action: {
                button: "MENU",
                sections: [
                    {
                        title: "Busqueda de productos",
                        rows: [
                            {
                                id: "horario",
                                title: "Horario",
                                description: "Horario de nuestras sucursales"
                            },
                            {
                                id: "producto",
                                title: "Consultar producto"
                            },
                        ]
                    }
                ]
            }
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
//en caso de seleccionar "buscar producto" el mensaje se envia, solo es ina instruccion, no tiene funcionalidad
const sendResProd = (phone_number_id, whatsapp_token, to, id) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        context: {
            message_id: id
        },
        type: "text",
        text: {
            preview_url: false,
            body: "Por favor, ingresa una pequeña descripción del producto que estas buscando"
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
const sendResHorario = (phone_number_id, whatsapp_token, to, id) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        context: {
            message_id: id
        },
        type: "text",
        text: {
            preview_url: false,
            body: "Estamos disponibles de lunes a sabado de 8:00 am a 8:00 pm y domingos de 9:00 am 6:00pm"
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
//mensaje de error 
const sendMsgErro = (phone_number_id, whatsapp_token, to, id) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        context: {
            message_id: id
        },
        type: "text",
        text: {
            preview_url: false,
            body: "Lo siento, no pude encontrar el producto, por favor intenta con otra descripción, por ejemplo: *aceite multigrado 5W-40*"
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
//menu de regiones
const sendSucMenu = (phone_number_id, whatsapp_token, to) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: "Seleccione su region"
            },
            body: {
                text: "Le mostraremos los estados donde puede encontrar nuestras sucursales:"
            },
            footer: {
                text: "Treviño refacciones"
            },
            action: {
                button: "MENU",
                sections: [
                    {
                        title: "Busqueda de estado",
                        rows: [
                            {
                                id: "tamaulipas",
                                title: "Tamaulipas",
                            },
                            {
                                id: "nuevo leon",
                                title: "Nuevo Leon"
                            },
                            {
                                id: "coahuila",
                                title: "Coahuila"
                            }
                        ]
                    }
                ]
            }
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
//Enviar sucursales en reynosa 
const sendSucReynosa = (phone_number_id, whatsapp_token, to) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
            preview_url: false,
            body: " *Suc. Lib. Monterrey*" + "\n" +
                e_ubicacion + " Libramiento Mty Reynosa 226, Col. Lomas Real De Jarachina Sur, Reynosa, Tamaulipas Cp. 88736" + "\n" +
                e_reloj + " L-S: 8 a.m. - 9 p.m. / D: 8 a.m. - 7 p.m." + "\n"
                + e_telefono + " (899) 951-4761" + "\n" +
                e_mapa + " https://goo.gl/maps/S2juPojLwVnH2R6BA" + "\n" + "\n" +

                " *Suc. carretera a Monterrey*" + "\n" +
                e_ubicacion + " Carretera A Monterrey Km 208 S/n, Col. Solidaridad, Reynosa, Tamaulipas Cp. 88730" + "\n" +
                e_reloj + " L-S: 8 a.m. - 9 p.m. / D: 8 a.m. - 7 p.m." + "\n"
                + e_telefono + " (899) 952-2990" + "\n" +
                e_mapa + " https://goo.gl/maps/1B5tLC6tMiDkhKuB6"


        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
//menu de ciudades
const sendCiuMenu = (phone_number_id, whatsapp_token, to) => {
    let json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: "Seleccione su ciudad"
            },
            body: {
                text: "Le mostraremos las ciudades donde puede encontrar nuestras sucursales:"
            },
            footer: {
                text: "Treviño refacciones"
            },
            action: {
                button: "MENU",
                sections: [
                    {
                        title: "Busqueda de productos",
                        rows: [
                            {
                                id: "reynosa",
                                title: "Reynosa",
                            },
                            {
                                id: "rio bravo",
                                title: "Rio bravo"
                            }
                        ]
                    }
                ]
            }
        }
    };
    let data = JSON.stringify(json);
    let path = "/v16.0/" + phone_number_id + "/messages?access_token=" + whatsapp_token;
    let options = {
        host: "graph.facebook.com",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    let callback = (response) => {
        let str = "";
        response.on("data", (chunk) => {
            str += chunk;
        });
        response.on("end", () => { });
    };
    let req = https.request(options, callback);
    req.on("error", (e) => { });
    req.write(data);
    req.end();
};
function menu_de_estados() {
    if (mensaje == "TAMAULIPAS") {
        sendCiuMenu(phone_number_id, WHATSAPP_TOKEN, from);
    } else if (mensaje == "NUEVO LEON") {
        console.log("ENTRO A NL");
    }
    else if (mensaje == "COAHUILA") {
        console.log("COAHUILA");
    }
    else if (mensaje == "REYNOSA") {
        console.log("Menu de REYNOSA");
        sendSucReynosa(phone_number_id, WHATSAPP_TOKEN, from);
    }
    else if (mensaje == "RIO BRAVO") {
        console.log("ENTRO A rb");
    }
}

