const Pedidos = require("./pedidos");
const PedidosHasPlatos = require("./pedidosHasPlatos");
const Platos = require("./platos");
const Usuarios = require("./usuarios");

Usuarios.hasMany(Pedidos, {
    foreignKey: "usuarios_id"
});

Pedidos.belongsTo(Usuarios, {
    foreignKey: "usuarios_id",
});

//Relacion mas importante la que soluciona
//el dashboard, los favoritos, estado de un pedido de un usuario
Pedidos.belongsToMany(Platos,{
    through: PedidosHasPlatos,
});

module.exports = {
    Platos, 
    Pedidos, 
    PedidosHasPlatos,
    Usuarios,
};