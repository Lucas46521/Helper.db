## ![HelperDbLogo.png](https://raw.githubusercontent.com/Lucas46521/Helper.db/refs/heads/main/HelperDbLogo2.png)
**NPM:** [npmjs.com/helper.db](https://www.npmjs.com/package/helper.db)

Helper.db é uma package de código aberto destina-se a fornecer uma maneira fácil para iniciantes e pessoas de todos os níveis acessarem e armazenarem dados em um ambiente de baixo a médio volume. Todos os dados são armazenados persistentemente por meio de [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) ou [mysql2](https://www.npmjs.com/package/mysql2) e traz vários outros recursos de qualidade de vida.

- **Armazenamento Persistente** - Os dados não desaparecem após reinicializações.
- **Múltiplos Drivers** - Você pode usar tanto o `better-sqlite3` quanto o `mysql2` ou até mesmo `mongo`.
- **Funciona imediatamente** - Não é necessário configurar um servidor de banco de dados, todos os dados são armazenados localmente no mesmo projeto.
- **Amigável para Iniciantes** - Criado originalmente para uso em tutoriais, a documentação é direta e sem complicações.
- **E muito mais...**

## Instalação 

<details>
<summary>Pré-requisitos Mac</summary>
<br>

```bash
1. Install XCode
2. Execute: `npm i -g node-gyp` no terminal
3. Execute: `node-gyp --python /path/to/python` no terminal
```

</details>

```python
npm i helper.db better-sqlite3   # (Padrão) Arquivo SQLite3 local
npm i helper.db mysql2    # (Alternativa) Conexão com servidor MySQL
```

> Se você está tendo problemas para instalar, siga [este guia de solução de problemas](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/troubleshooting.md).  
> Usuários do Windows podem precisar realizar etapas adicionais listadas [aqui](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/troubleshooting.md).

## Exemplo:

```js
const { HelperDB } = require("helper.db");
const db = new HelperDB(); // Criará um json.sqlite na pasta raiz
// Se você quiser especificar um caminho, pode fazer assim:
// const db = new HelperDB({ filePath: "source/to/path/test.sqlite" });

(async () => {
    // Função assíncrona auto-chamada apenas para permitir o uso de async
    // Definindo um objeto no banco de dados:
    await db.set("userInfo", { difficulty: "Easy" });
    // -> { difficulty: 'Easy' }

    // Obtendo um objeto do banco de dados:
    await db.get("userInfo");
    // -> { difficulty: 'Easy' }

    // Obtendo uma propriedade de um objeto no banco de dados:
    await db.get("userInfo.difficulty");
    // -> 'Easy'

    // Definindo um objeto no banco de dados:
    await db.set("userInfo", { difficulty: "Easy" });
    // -> { difficulty: 'Easy' }

    // Adicionando um item a um array (que ainda não existe) dentro de um objeto:
    await db.push("userInfo.items", "Sword");
    // -> { difficulty: 'Easy', items: ['Sword'] }

    // Adicionando a um número (que ainda não existe) dentro de um objeto:
    await db.add("userInfo.balance", 500);
    // -> { difficulty: 'Easy', items: ['Sword'], balance: 500 }

    // Repetindo exemplos anteriores:
    await db.push("userInfo.items", "Watch");
    // -> { difficulty: 'Easy', items: ['Sword', 'Watch'], balance: 500 }
    await db.add("userInfo.balance", 500);
    // -> { difficulty: 'Easy', items: ['Sword', 'Watch'], balance: 1000 }

    // Buscando propriedades individuais
    await db.get("userInfo.balance"); // -> 1000
    await db.get("userInfo.items"); // ['Sword', 'Watch']
})();
```
## Exemplo usando MySQLDriver:

> **NOTE:** Para usar este driver instale: `npm i mysql2` separadamente.

```js
const { HelperDB, MySQLDriver } = require("helper.db");
(async () => {
    const mysqlDriver = new MySQLDriver({
        host: "localhost",
        user: "me",
        password: "secret",
        database: "my_db",
    });

    await mysqlDriver.connect(); // conectar ao banco de dados **isso é importante**

    const db = new HelperDB({ driver: mysqlDriver });
    // Agora você pode usar helper.db normalmente

    await db.set("userInfo", { difficulty: "Easy" });
    // -> { difficulty: 'Easy' }
})();
```

## Exemplo usando MongoDriver:

> **NOTE:** Para usar este driver, instale: `npm i mongoose` separadamente.

```js
const { HelperDB, MongoDriver } = require("helper.db");
(async () => {
    const mongoDriver = new MongoDriver("mongodb://localhost/quickdb");

    await mongoDriver.connect();

    const db = new HelperDB({ driver: mongoDriver });
    // Agora você pode usar helper.db normalmente

    await db.set("userInfo", { difficulty: "Easy" });
    // -> { difficulty: 'Easy' }

    await driver.close();
    // desconectar do banco de dados
})();
```

## Exemplo usando JSONDriver:

> **NOTA:** Para usar este driver, instale `npm i write-file-atomic` separadamente.

```js
const { HelperDB, JSONDriver } = require("quick.db");
const jsonDriver = new JSONDriver();
const db = new HelperDB({ driver: jsonDriver });

await db.set("userInfo", { difficulty: "Easy" });
```

## Exemplo usando MemoryDriver:

> **Observação:** o banco de dados na memória não é persistente e é adequado para armazenamento em cache temporário.

```js
const { HelperDB, MemoryDriver } = require("quick.db");
const memoryDriver = new MemoryDriver();
const db = new HelperDB({ driver: memoryDriver });

await db.set("userInfo", { difficulty: "Easy" });
```

## Mudanças na v1.0.0:

- **Correção de bug** relacionado à conexão do mongoDriver.
- **Adição do método .search()**.

### .search()

O método `.search()` permite buscar um termo em uma coleção de dados armazenados no banco de dados. Ele oferece suporte a busca por propriedades específicas dentro de objetos, além de realizar buscas em arrays e strings. Caso não seja fornecido um termo ou uma propriedade, será lançada uma exceção.

#### Assinatura do método:
```js
const term = '' //termo para ser pesquisado (opicional se property for fornecida)
const property = //propriedade a ser pesquisada (opcional se term for fornecido)
async search(term, property = null);
```
