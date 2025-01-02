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

# Changelogs

## 1.0.3

<details>
<summary>Novidades</summary>

### Adição de Eventos

- Eventos adicionados para maior controle e integração.

### Novas Funções

> #### **async in(term, property = null, key = "")**

> - **Descrição**: Filtra dados que contenham o termo especificado em uma propriedade ou valor.
>
> ```js
> await db.in("Lucas", "nome"); // Busca onde a propriedade 'nome' contém 'Lucas'
> await db.in("admin");         // Busca por qualquer valor que contenha 'admin'
> ```

---

> #### **async between(min, max, property = null, key = "")**

> Descrição: Filtra valores numéricos que estejam entre min e max.

> ```js
> await db.between(10, 20, "idade"); // Busca onde a propriedade 'idade' está entre 10 e 20
> await db.between(5, 15);           // Busca por qualquer valor numérico entre 5 e 15
> ```

---

> #### **async endsWith(query, key = "")**

> Descrição: Retorna entradas com IDs que terminam com o termo especificado.

> ```js
> await db.endsWith("123"); // Busca IDs que terminam com '123'
> ```

---

> #### **async startsWith(query, key = "")**

> Descrição: Retorna entradas com IDs que começam com o termo especificado. (Agora suporta arrays de termos).

> ```js
> await db.startsWith("user");         // Busca IDs que começam com 'user'
> await db.startsWith(["adm", "mod"]); // Suporte para múltiplos termos
> ```

---

> #### **async regex(pattern, property = null, key = "")**

> Descrição: Filtra valores que correspondem a uma expressão regular.

> ```js
> await db.regex(/^L.*/, "nome"); // Busca onde a propriedade 'nome' começa com 'L'
> await db.regex(/@gmail\.com$/); // Busca valores terminando com '@gmail.com'
> ```

---

> #### **async compare(property, operator, value, key = "")**

> Descrição: Compara valores de propriedades utilizando operadores lógicos.

> ```js
> await db.compare("idade", ">", 18);       // Busca onde 'idade' é maior que 18
> await db.compare("status", "==", "ativo"); // Busca onde 'status' é 'ativo'
> ```

---

> #### **async custom(filterFunction, key = "")**

> Descrição: Permite criar filtros personalizados utilizando uma função assíncrona.

> ```js
> await db.custom(async (entry) => entry.value.ativo === true); // Busca onde 'ativo' é true
> ```

</details>

## 1.0.0

<details>
<summary>Detalhes</summary>Correções

##### **Resolução de bug na conexão com o mongoDriver.**

#### **Novidades**

> #### **.search(term, property = null)**

> **Descrição: Permite buscar termos em coleções de dados, suportando propriedades específicas, arrays e strings.**

#### Exemplo
> ```js
> await db.search("Lucas", "nome"); // Busca onde 'nome' contém 'Lucas'
> await db.search("admin");         // Busca por qualquer valor que contenha 'admin'
> ```

</details>
