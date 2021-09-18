# Proyecto Delilah Resto

Este proyecto plantea la creación de un sistema de pedidos online para un restaurante. Se debía poner en funcionamiento las partes necesarias para montar una REST API que permita realizar altas, bajas, modificaciones y obtención de información sobre una estructura de datos que podría consumir un cliente. Parte del desafío estará enfocado en lograr que el desarrollo del proyecto sea puesto en producción utilizando web services.

# Instrucciones de ejecución

## Prerequisitos

Contar con los siguientes software instalados:
  - Visual Studio Code
  - Node
  - Xampp
  - MySql Workbench
  - Postman

## Instalación

- Inicializar Xampp e inicializar el módulo de MySQL.
-Dentro de MySql Workbench crear una nueva conexión a la base

```
Connection Name: XAMPP SQL
Connextion Method: Standard (TCP/IP)
Hostname: 127.0.0.1
Port: 3306
Username: root 
```

- Desde la ventana "Query1" para ejecutar las sentencias de sql ejecutar las sentencias del archivo `script creacion DB.txt`.

- Abrir la carpeta del proyecto dentro de Visual Studio code
- Dentro de la terminar de Bash ubicarse dentro de la carpeta del proyecto `cd 'proyecto-delilah-resto'`
- Ejecutar la sentencia `npm install` para instalar todas las dependencias del archivo package.json. 
- Una vez instaladas ejecutar el comando `npm run dev` para inicializar el servidor.
- Si el servidor se encuentra bien inicializado la consola dará el mensaje "conexion exitosa".

## Aclaraciones

1.  Por defecto todos los usuarios se crean como no administradores, por lo que si se quiere cambiar un usuario a administrador se necesita realizar la modificación desde MySQL Workbench. En caso de querer insertar un usuario administrador se puede utilizar la siguiente consulta:

```
INSERT INTO usuarios (nombre, usuario, correo, telefono, direccion, contrasena, esAdmin)
VALUES ('Miguel Tadakuma','minchy','minchy@google.com','+54 1133550273','Calle cordoba 2263','minchy2021',1);
```
2.  Se incluye la colección de requests de Postman para ser probadas, es necesario modificar el token de autorización para las pruebas entre los usuarios comunes y los usuarios administradores.

3.  Se incluye los archivos spec.yaml y spec.json para ser visualizados desde Swagger Editor. Para poder probar estos archivos es necesario levantar el servidor con el comando `npm run dev`

4.  Se guarda el archivo .env para que no sea necesario configurar nada más a excepción de MySQL Workbench.
