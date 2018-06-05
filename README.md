# Driver Mysql for Blockbase
Compatible with Blockbase Framework

### Version
1.0.2

### How to install ?
```shell
$ npm i --save blockbase-mysql
```

Then add to your config/{env}.yml the following instructions depending of your system
```yml
dbms : mysql
mysql :
    host : localhost
    user : johndoe
    password :
    port : 3306
    database : yourdatabase
```

### How to use ?

When you configure mysql as your dbms, Blockbase automatically binds the driver to the models with the basic methods. Such as **read/save/update/delete etc.**


Inside your **controller/model/app** :

```js
//myController.js
module.exports = (app) => {
    const mysql = app.drivers.mysql

    return {
        async foo(bar){
            //Do something with mysql
    ...
```

### Usage



```js
//myModel.js
module.exports = (app) => {
    const Model = app.model._model

    return class MyModel extends Model {
        constructor(data){
            super({type: 'user'})
            if(data) this.data = data
        }

        async foo(bar){
            let q = `SELECT * FROM ${this.params.type}`

            try {
                //this.client is binded to mysql
                return await this.client.execute(q, [])
            }
            catch(e) {
                throw e
            }
        }
    }
}
```

#### Run tests
Blockbase has some unit tests (with [Mocha](https://mochajs.org)) written run them often !

```sh
$ npm test
```

License
----
(Licence [MIT](https://github.com/blacksmithstudio/blockbase/blob/master/LICENCE))
Coded by [Blacksmith](https://www.blacksmith.studio)

**Free Software, Hell Yeah!**

[Node.js]:https://nodejs.org/en
[NPM]:https://www.npmjs.com
