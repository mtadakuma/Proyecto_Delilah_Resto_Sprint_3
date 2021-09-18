//importar librerías
const compression = require("compression");
const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const expressJwt = require("express-jwt");
const cors = require("cors");

//puerto del servidor
const PORT = process.env.SERVER_PORT;

//importar modelos
const {
    Pedidos,
    Platos,
    Usuarios,
    PedidosHasPlatos
} = require("./models/index");

//JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

//crear instancia del server en express
const server = express();

//política de límite de peticiones
const limiter = rateLimit({
    windowMS: 10 * 1000,
    max: 10,
    message: "Excediste el número de peticiones. Intenta más tarde."
});

//logger
const logger = (req, res, next) => {
    const path = req.path;
    const method = req.method;
    const body = req.body;

    process.nextTick( () => {
        console.log(`
        Método: ${method}
        Ruta: ${path}
        Body: ${JSON.stringify(body)}
        Params: ${JSON.stringify(req.params)}
        `)
    });

    next();
}

const verifyAdminMiddleware = async (req, res, next) =>{
    const posibleUser = await Usuarios.findOne({
        where:{
            correo: req.user.correo,
        }
    });
    if(!posibleUser.esAdmin){
        res.status(403);
        res.json({ error: `Sin permisos de administrador` });
    }
    next();
};

const verifyUserBodyMiddleware = (req, res, next) =>{ 
    const {nombre, usuario, correo, telefono, direccion, contrasena} = req.body;
    if(!nombre || !usuario || !correo || !telefono || !direccion || !contrasena){
        res.status(400);
        res.json({ error: `Algun campo está vacío` });
    }
    next();
};

const verifyUserExistsMiddleware = async (req, res, next) =>{ 
    const posibleUser = await Usuarios.findOne({
        where:{
            correo: req.body.correo,
        }
    });
    if(posibleUser != null){
        res.status(406);
        res.json({ error: `El usuario ya existe en la base` });
    }
    next();
};

const verifyPlatoBodyMiddleware = (req, res, next) =>{ 
    const {nombre, precio, imagen} = req.body;
    if(!nombre || !precio || !imagen){
        res.status(400);
        res.json({ error: `Algun campo está vacío` });
    }
    next();
};

const verifyPlatoExistsMiddleware = async (req, res, next) =>{ 
    const posiblePlato = await Platos.findOne({
        where:{
            nombre: req.body.nombre,
        }
    });
    if(posiblePlato != null){
        res.status(406);
        res.json({ error: `El plato ya existe en la base` });
    }
    next();
};

const verifyPedidoBodyMiddleware = (req, res, next) =>{ 
    const {forma_pago, platos} = req.body;
    if(!forma_pago || !platos){
        res.status(400);
        res.json({ error: `Algun campo está vacío` });
    }
    next();
};

//middlewares globales
server.use(express.json());
server.use(compression());
server.use(helmet());
server.use(limiter);
server.use(logger);
server.use(cors());

server.use(expressJwt({
    secret: JWT_SECRET,
    algorithms: ["HS256"],
}).unless({
    path: ["/login", "/registrar"]
}));


server.post("/login",async (req,res)=>{
    const {correo, contrasena} = req.body;

    try{
        const posibleUsuario = await Usuarios.findOne({
            where: {
                correo,
                contrasena,
            },
        })

        if(posibleUsuario){
            const token = jwt.sign({
                //firmo solo con id, nombre y correo
                id: posibleUsuario.id,
                correo: posibleUsuario.correo,
                nombre: posibleUsuario.nombre
            },JWT_SECRET, 
            {expiresIn: "120m"}
            );
            res.status(200).json({ token });
        }else{
            res.status(401).json({
                error: "Correo y/o contraseña invalido"
            });
        }
    }catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Error, intente nuevamente mas tarde...",
        });
    }
});

server.post("/registrar", verifyUserBodyMiddleware, verifyUserExistsMiddleware, async (req, res)=>{
    const {nombre, usuario, correo, telefono, direccion, contrasena} = req.body;
    await Usuarios.create({
        nombre,
        usuario,
        correo,
        telefono,
        direccion,
        contrasena,
    });

    res.status(201).json(`nuevo usuario creado.`);
})

server.get("/platos", async (req,res) =>{
    const platos = await Platos.findAll({
        attributes: ['id', 'imagen', 'nombre','precio'],
        where: { active : true},
    });
    res.status(200).json(platos);
});

server.get("/platos/:id", async (req,res) =>{
    const idParam = req.params.id;
    const plato = await Platos.findOne({
        attributes: ['id', 'imagen', 'nombre','precio'],
        where: { active : true, id : idParam},
    });
    plato 
        ? res.json(plato) 
        : res.status(404).json({error:`plato con id ${idParam} no existe`});
});

server.get("/pedidos", verifyAdminMiddleware, async (req,res)=>{
    const pedidos = await Pedidos.findAll({
        include: [
            {model : Usuarios , attributes: ['id','nombre','correo']},
            {model : Platos}
        ],
    });
    res.status(200).json(pedidos);
});

server.get("/misPedidos", async (req,res)=>{
    const pedidos = await Pedidos.findAll({
        include: [
            {model : Usuarios , attributes: ['id','nombre','correo']},
            {model : Platos}
        ],where:{
            usuarios_id: req.user.id
        }
    });
    res.status(200).json(pedidos);
});

server.post("/pedidos", verifyPedidoBodyMiddleware, async (req,res)=>{
    const {forma_pago, platos} = req.body;

    const dataPlatos = await Promise.all(
        platos.map( async plato => {
            const platoDB = await Platos.findOne({
                where: {
                    id: plato.platoId,
                }
            })
            return{
                cantidad:plato.cantidad,
                plato_id:plato.platoId,
                precio: platoDB.precio,
            };
        })
    );

    let precio_total = 0;
    dataPlatos.map(async(plato)=>{
        precio_total = precio_total + plato.precio * plato.cantidad;
    });

    const nuevoPedido = await Pedidos.create({
        precio_total,
        forma_pago,
        usuarios_id: req.user.id,
    });


    await Promise.all(dataPlatos.map(async (plato)=>{
        await PedidosHasPlatos.create({
            cantidad: plato.cantidad,
            plato_id: plato.plato_id,
            pedido_id: nuevoPedido.id,
        },{
            fields: ["cantidad","plato_id","pedido_id"]
        });
    }));

    res.status(201).json(nuevoPedido);
});

server.post("/platos", verifyAdminMiddleware, verifyPlatoBodyMiddleware, verifyPlatoExistsMiddleware, async (req,res) =>{
    const {nombre, precio, imagen} = req.body;
    const nuevoPlato = await Platos.create({
        nombre, 
        precio, 
        imagen,
    });

    res.status(201).json(nuevoPlato);
});

server.put("/platos/:id", verifyAdminMiddleware,verifyPlatoBodyMiddleware, async (req,res) =>{
    const idParam = req.params.id;
    const nuevoPlato = await Platos.update(
        {
            nombre: req.body.nombre,
            precio: req.body.precio, 
            imagen: req.body.imagen,
        },
        {where:{
            id: idParam,
        }
    });

    res.status(201).json(`El pedido ${idParam} ha sido modificado.`);
});

server.put("/pedidos/:id", verifyAdminMiddleware, async (req,res) =>{
    const idParam = req.params.id;
    const {precio_total, forma_pago} = req.body;

    const posiblePedido= await Pedidos.findOne({
        where: {
            id:idParam,
        }
    })

    if(!posiblePedido){
        res.status(404).json({
            error: `No existe pedido con id ${idParam}`
        });
    }else{  
        await Pedidos.update(
            {
                precio_total,
                forma_pago,
            },
            {where:{
                id: idParam,
            }
        });
    }
    res.status(201).json(`El pedido ${idParam} ha sido modificado.`);
});

server.put("/pedidos/cambiarEstado/:id", verifyAdminMiddleware, async (req,res) =>{
    const idParam = req.params.id;
    const {estado} = req.body;

    const posiblePedido = await Pedidos.findOne({
        where: {
            id:idParam,
        }
    })

    
    if(!posiblePedido){
        res.status(404).json({
            error: `No existe pedido con id ${idParam}`
        });
    }if(!estado){
        res.status(400).json({
            error: `el campo estado esta vacío`
        });
    }else{  
        await Pedidos.update(
            {
                estado
            },
            {where:{
                id: idParam,
            }
        });
    } 


    res.status(201).json(`El pedido ${idParam} se ha cambiado a estado ${estado}`);
});


server.delete("/platos/:id", verifyAdminMiddleware, async (req,res) =>{
    const idParam = req.params.id;
    
    const posiblePlato= await Platos.findOne({
        where: {
            id:idParam
        }
    })

    try{
        if(!posiblePlato){
            res.status(404).json({
                error: `No existe plato con id ${idParam}`
            });
        }else{  
            await Platos.update(
                {
                    active: false,
                },
                {where:{
                    id: idParam,
                }
            });
        }
    }catch(err){
        console.log(error);
    }
    
    res.status(204);
    res.json(`Se eliminó el plato.`);
});

server.delete("/pedidos/:id", verifyAdminMiddleware, async (req,res) =>{
    const idParam = req.params.id;
    
    const posiblePedido = await Pedidos.findOne({
        where: {
            id:idParam,
        }
    })

    if(!posiblePedido){
        res.status(404).json({
            error: `No existe pedido con id ${idParam}`
        });
    }else{  

        await PedidosHasPlatos.destroy({
            where: {
                pedido_id: idParam,
            }
        });

       await Pedidos.destroy({
            where: {
                id: idParam,
            }
        }); 
    } 

    res.status(204);
    res.json(`El pedido con id ${idParam} fue eliminado`);
});



server.listen(PORT, () => {
    console.log(`Servidor iniciado correctamente en el puerto ${PORT}`);
});