const {DataTypes} = require("sequelize");
const sequelize = require('../config/db');
const Pedidos = sequelize.define("pedidos",{
    precio_total: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM(
            'NUEVO',
            'CONFIRMADO',
            'PREPARANDO',
            'ENVIANDO',
            'CANCELADO',
            'ENTREGADO'
            ),
        defaultValue: 'NUEVO',
        allowNull: false,
    },
    forma_pago: {
        type: DataTypes.ENUM('EF','TC','MP'),
        allowNull: false,
    },
    usuarios_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
},{
    tableName: "pedidos",
    underscored: true,
});

module.exports = Pedidos;